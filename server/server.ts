import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { getRoomState, saveRoomState, getSnapshotsList, saveSnapshot, getSnapshotContent } from './db.js';

// Setup ES Module polyfills conditionally
const resolvedFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const resolvedDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(resolvedFilename);

// Import y-websocket sync utilities
// @ts-ignore
import pkg from 'y-websocket/bin/utils';
const { setupWSConnection, setContentInitializor } = pkg;

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  // Track rooms for basic health stats
  const activeRooms = new Set<string>();

  // Attach middleware and limits
  app.use(express.json({ limit: '10mb' }));

  // Basic API endpoints for telemetry and health checking
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', activeRooms: activeRooms.size });
  });

  // Snapshot API Endpoints
  app.get('/api/rooms/:roomId/snapshots', async (req, res) => {
    try {
      const list = await getSnapshotsList(req.params.roomId);
      res.json({ success: true, snapshots: list });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/rooms/:roomId/snapshots', async (req, res) => {
    try {
      const { label, type, files, lines } = req.body;
      const snapshot = await saveSnapshot(req.params.roomId, label, type, files, lines);
      res.json({ success: true, snapshot });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/rooms/:roomId/snapshots/:snapshotId', async (req, res) => {
    try {
      const files = await getSnapshotContent(req.params.snapshotId);
      res.json({ success: true, files });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // Initial Content Sync Loader hook
  setContentInitializor(async (ydoc: Y.Doc, roomName: string) => {
    console.log(`[Yjs] Initializing content for room: ${roomName}`);
    activeRooms.add(roomName);
    const dbState = await getRoomState(roomName);
    if (dbState) {
      Y.applyUpdate(ydoc, dbState);
    }
  });

  // Create Node HTTP Server
  const server = http.createServer(app);

  // Setup WebSocket Server for y-websocket bindings
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', (conn, req, { docName }) => {
    console.log(`[WS] Client joined room: ${docName}`);
    setupWSConnection(conn, req, { docName, gc: true });
    
    conn.on('close', async () => {
      console.log(`[WS] Client left room: ${docName}`);
      const clientsOnline = Array.from(wss.clients).filter(c => c.readyState === 1).length;
      if (clientsOnline === 0) {
        activeRooms.delete(docName);
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    if (request.url?.startsWith('/ws')) {
      const docName = request.url.split('/').pop() || 'default-room';
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, { docName });
      });
    } else {
      socket.destroy();
    }
  });

  // Periodically flush memory states to local disk SQLite
  setInterval(async () => {
    // @ts-ignore
    const docs = pkg.docs as Map<string, any>;
    if (!docs || docs.size === 0) return;

    for (const [roomName, ydoc] of docs.entries()) {
      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      await saveRoomState(roomName, stateUpdate);
    }
  }, 10000);

  // Vite middleware integration for high-productivity reactive DX
  if (process.env.NODE_ENV !== 'production') {
    const viteRootPath = path.resolve(resolvedDirname, '../client');
    console.log(`Setting up Vite dev middleware with root: ${viteRootPath}`);
    
    // Dynamically import vite *only* in development where the devDependency is present
    const { createServer: createViteServer } = await import('vite');
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: viteRootPath
    });
    
    app.get('/room/*', async (req, res, next) => {
      try {
        const indexHtmlPath = path.join(viteRootPath, 'index.html');
        const fs = await import('fs');
        let html = fs.readFileSync(indexHtmlPath, 'utf-8');
        html = await viteInstance.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (err) {
        next(err);
      }
    });
    
    app.use(viteInstance.middlewares);
  } else {
    // In production, serve bundled client static assets directly from the shared build dist
    const distPath = path.resolve(resolvedDirname, '../dist');
    console.log(`Setting up static asset serving from prod build directory: ${distPath}`);
    app.use(express.static(distPath));
    
    // All other wildcard HTTP routes serve our bundled SPA entrypoint index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`OrbitCode Server running on port ${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Full-Stack Dev Link: http://localhost:${PORT}`);
    }
  });
}

startServer().catch((err) => {
  console.error('Failed to initialize server:', err);
  process.exit(1);
});
