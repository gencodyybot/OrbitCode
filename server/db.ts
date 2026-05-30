import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, 'rooms_data');

// Ensure DB directory exists
fs.mkdir(DB_DIR, { recursive: true }).catch(err => {
  console.error('Failed to create rooms_data directory', err);
});

/**
 * Loads the binary state update buffer for a given room.
 */
export async function getRoomState(roomId: string): Promise<Buffer | null> {
  try {
    const filePath = path.join(DB_DIR, `${roomId}.bin`);
    const data = await fs.readFile(filePath);
    return data;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return null;
    }
    console.error(`Error loading state for room ${roomId}:`, err);
    throw err;
  }
}

/**
 * Saves/updates the binary state update buffer for a given room.
 */
export async function saveRoomState(roomId: string, state: Buffer): Promise<void> {
  try {
    const filePath = path.join(DB_DIR, `${roomId}.bin`);
    await fs.writeFile(filePath, state);
  } catch (err) {
    console.error(`Error saving state for room ${roomId}:`, err);
    throw err;
  }
}

/**
 * Snapshot Version Control helpers
 */
export async function getSnapshotsList(roomId: string): Promise<any[]> {
  try {
    const filePath = path.join(DB_DIR, `${roomId}_snapshots.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      // Default initial snapshot
      return [
        {
          id: 'init-snap',
          timestamp: '01:50 PM',
          type: 'Init',
          label: 'Initial workspace structure',
          lines: 7,
          createdAt: new Date().toISOString()
        }
      ];
    }
    console.error(`Error loading snapshots list for room ${roomId}:`, err);
    return [];
  }
}

export async function saveSnapshot(
  roomId: string,
  snapshotMeta: any,
  filesPayload: any[]
): Promise<void> {
  try {
    // 1. Save detailed snapshot content
    const contentPath = path.join(DB_DIR, `${roomId}_snapshot_${snapshotMeta.id}.json`);
    await fs.writeFile(contentPath, JSON.stringify(filesPayload, null, 2), 'utf-8');

    // 2. Append to snapshots metadata listing
    const snapshots = await getSnapshotsList(roomId);
    const updatedList = [snapshotMeta, ...snapshots.filter(s => s.id !== snapshotMeta.id)];
    
    const listPath = path.join(DB_DIR, `${roomId}_snapshots.json`);
    await fs.writeFile(listPath, JSON.stringify(updatedList, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving snapshot for room ${roomId}:`, err);
    throw err;
  }
}

export async function getSnapshotContent(roomId: string, snapshotId: string): Promise<any[] | null> {
  try {
    const filePath = path.join(DB_DIR, `${roomId}_snapshot_${snapshotId}.json`);
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return null;
    }
    console.error(`Error loading snapshot content for room ${roomId}, sync id: ${snapshotId}:`, err);
    throw err;
  }
}

