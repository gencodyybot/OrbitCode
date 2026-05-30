import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';
import * as Y from 'yjs';
import { getRoomState, saveRoomState, getSnapshotsList, saveSnapshot, getSnapshotContent } from './db.js';
// @ts-ignore
import pkg from 'y-websocket/bin/utils';

const { setupWSConnection, setContentInitializor } = pkg;

// ES Module compatible pathname derivatives
const resolvedFilename = typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url);
const resolvedDirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(resolvedFilename);

// Track debounced DB writes to avoid disk saturation on high-frequency keystrokes
const saveDebounceMap = new Map<string, NodeJS.Timeout>();

function debounceSaveRoomState(roomId: string, ydoc: Y.Doc) {
  if (saveDebounceMap.has(roomId)) {
    clearTimeout(saveDebounceMap.get(roomId)!);
  }

  const timeout = setTimeout(async () => {
    saveDebounceMap.delete(roomId);
    try {
      const stateUpdate = Y.encodeStateAsUpdate(ydoc);
      await saveRoomState(roomId, Buffer.from(stateUpdate));
      console.log(`[SQLite] Persisted Y.Doc update successfully for room: ${roomId}`);
    } catch (err) {
      console.error(`[SQLite] Failed to persist room state for ${roomId}:`, err);
    }
  }, 1000); // 1.0s debounce cooldown

  saveDebounceMap.set(roomId, timeout);
}

// Hook into Y-WebSocket Shared Document creation to load/register SQLite backups
setContentInitializor(async (ydoc: any) => {
  const roomName = ydoc.name;
  console.log(`[SQLite] Checking saved state for room: ${roomName}...`);
  try {
    const savedState = await getRoomState(roomName);
    if (savedState) {
      Y.applyUpdate(ydoc, new Uint8Array(savedState));
      console.log(`[SQLite] Successfully applied saved state payload for room: ${roomName}`);
    } else {
      console.log(`[SQLite] No saved state found for room ${roomName}. Initializing blank workspace.`);
    }
  } catch (err) {
    console.error(`[SQLite] Failed to load saved state for room: ${roomName}`, err);
  }

  // Bind update listener to track peer edits reactively
  ydoc.on('update', () => {
    debounceSaveRoomState(roomName, ydoc);
  });
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));
  const server = http.createServer(app);
  const PORT = 3000;

  // Set up raw WebSocket Server attached to the shared HTTP server on port 3000
  const wss = new WebSocketServer({ noServer: true });

  // Handle HTTP Upgrade requests
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
    
    // We will route /ws or room upgrades specifically (e.g. /ws/sync-4592-collab or /yjs/sync-4592-collab)
    if (pathname.startsWith('/ws') || pathname.startsWith('/yjs')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      // Allow other upgrades or destroy socket
      socket.destroy();
    }
  });

  // Track collaborative peer websocket connection established via Yjs Provider
  wss.on('connection', (ws, request) => {
    const url = new URL(request.url || '', `http://localhost`);
    const roomName = url.pathname.split('/').pop() || 'default-room';
    
    console.log(`New collaborative peer websocket connection for room: ${roomName}`);
    
    // Wire up the custom setupWSConnection from y-websocket memory provider
    setupWSConnection(ws, request, { docName: roomName, gc: true });
  });

  // API Route - Health Check endpoint for frontend integration verified in client App
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'OrbitCode Collaboration Hub',
      workspaces: ['client', 'server']
    });
  });

  // REST API Routes - Snapshot Version Control Endpoints
  app.get('/api/rooms/:roomId/snapshots', async (req, res) => {
    try {
      const list = await getSnapshotsList(req.params.roomId);
      res.json({ success: true, snapshots: list });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/rooms/:roomId/snapshots', async (req, res) => {
    try {
      const { label, type, files, lines } = req.body;
      const snapshotMeta = {
        id: `snap-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: type || 'Manual',
        label: label || 'Checkpoint Backup',
        lines: lines || 0,
        createdAt: new Date().toISOString()
      };
      await saveSnapshot(req.params.roomId, snapshotMeta, files);
      res.json({ success: true, snapshot: snapshotMeta });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/rooms/:roomId/snapshots/:snapshotId', async (req, res) => {
    try {
      const filesLoaded = await getSnapshotContent(req.params.roomId, req.params.snapshotId);
      if (!filesLoaded) {
        return res.status(404).json({ success: false, error: 'Snapshot files not found' });
      }
      res.json({ success: true, files: filesLoaded });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware integration for high-productivity reactive DX
  if (process.env.NODE_ENV !== 'production') {
    const viteRootPath = path.resolve(resolvedDirname, '../client');
    console.log(`Setting up Vite dev middleware with root: ${viteRootPath}`);
    
    const viteInstance = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
      root: viteRootPath,
    });

    // Handle deep workspace room path fallbacks with transformIndexHtml integration
    app.get('/room/*', async (req, res, next) => {
      try {
        const indexHtmlPath = path.resolve(resolvedDirname, '../client/index.html');
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
    console.log(`===============================================`);
    console.log(`  OrbitCode Server running on port ${PORT}`);
    console.log(`  Full-Stack Dev Link: http://localhost:${PORT}`);
    console.log(`===============================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal initialization error or failed dev server startup:', err);
  process.exit(1);
});
