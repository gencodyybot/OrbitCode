import React from 'react';
import { Network, Activity, Clock, Layers, ChevronRight, Save, Trash2 } from 'lucide-react';
import { DocumentStats } from '../types';

interface VersionSnapshot {
  id: string;
  timestamp: string;
  type: 'Auto' | 'Manual' | 'Init';
  label?: string;
  lines: number;
}

interface RightPanelProps {
  stats: DocumentStats;
  connectionState: 'Connected' | 'Reconnecting' | 'Disconnected';
  ping: number | null;
  snapshots: VersionSnapshot[];
  onCreateSnapshot: (label?: string) => void;
  onRestoreSnapshot: (id: string) => void;
  theme?: 'dark' | 'light';
}

export default function RightPanel({
  stats,
  connectionState,
  ping,
  snapshots,
  onCreateSnapshot,
  onRestoreSnapshot,
  theme = 'dark',
}: RightPanelProps) {
  const [customLabel, setCustomLabel] = React.useState('');
  const isLight = theme === 'light';

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateSnapshot(customLabel.trim() || undefined);
    setCustomLabel('');
  };

  const getConnectionColor = () => {
    switch (connectionState) {
      case 'Connected':
        return isLight
          ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
          : 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30';
      case 'Reconnecting':
        return isLight
          ? 'text-amber-600 bg-amber-50 border-amber-200'
          : 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
      case 'Disconnected':
        return isLight
          ? 'text-rose-600 bg-rose-50 border-rose-250'
          : 'text-red-400 bg-red-500/15 border-red-500/30';
    }
  };

  return (
    <div
      id="right-utility-shelf"
      className={`w-80 border-l h-full flex flex-col shrink-0 overflow-y-auto transition-all duration-300 ${
        isLight
          ? 'bg-neutral-50 border-neutral-200 text-black'
          : 'bg-neutral-950/90 border-neutral-800 text-neutral-100'
      }`}
    >
      {/* Session Metrics Header */}
      <div
        id="shelf-status-header"
        className={`p-4 border-b transition-all duration-300 ${
          isLight ? 'border-neutral-200 bg-neutral-100' : 'border-neutral-800 bg-neutral-950/40'
        }`}
      >
        <h3 className={`font-sans font-semibold text-xs tracking-wider uppercase flex items-center gap-1.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
          <Activity size={14} className="text-indigo-600 dark:text-indigo-400" />
          Collab Panel & Stats
        </h3>
      </div>

      {/* Connection & Network Latency */}
      <div id="shelf-connection-status" className={`p-4 border-b space-y-3.5 ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 text-xs font-semibold ${isLight ? 'text-neutral-800' : 'text-neutral-300'}`}>
            <Network size={14} className="text-indigo-600 dark:text-indigo-400" />
            <span>Connection State</span>
          </div>
          <span
            id="connection-badge"
            className={`px-2 py-0.5 rounded text-[10px] font-mono border font-medium ${getConnectionColor()}`}
          >
            {connectionState}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className={isLight ? 'text-neutral-500' : 'text-neutral-400'}>Network Ping</span>
          <span className={`font-mono font-semibold ${isLight ? 'text-black' : 'text-neutral-200'}`}>
            {ping !== null ? `${ping}ms` : '12ms'} {/* Fallback to default if null */}
          </span>
        </div>
      </div>

      {/* Live Document Statistics */}
      <div id="shelf-document-metrics" className={`p-4 border-b space-y-4 ${isLight ? 'border-neutral-200' : 'border-neutral-800'}`}>
        <h4 className={`text-xs font-semibold font-sans tracking-wide ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
          File Statistics
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div className={`rounded-lg p-2.5 border flex flex-col items-center transition-colors ${
            isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-black/60 border-neutral-800'
          }`}>
            <span className="text-[10px] text-neutral-500 font-mono">LINES</span>
            <span id="stat-lines" className={`text-lg font-mono font-bold mt-1 ${isLight ? 'text-indigo-600' : 'text-white'}`}>
              {stats.lines}
            </span>
          </div>
          <div className={`rounded-lg p-2.5 border flex flex-col items-center transition-colors ${
            isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-black/60 border-neutral-800'
          }`}>
            <span className="text-[10px] text-neutral-500 font-mono">CHARS</span>
            <span id="stat-chars" className="text-lg font-mono font-bold text-indigo-500 dark:text-indigo-300 mt-1">
              {stats.characters}
            </span>
          </div>
          <div className={`rounded-lg p-2.5 border flex flex-col items-center transition-colors ${
            isLight ? 'bg-white border-neutral-200 shadow-sm' : 'bg-black/60 border-neutral-800'
          }`}>
            <span className="text-[10px] text-neutral-500 font-mono">WORDS</span>
            <span id="stat-words" className={`text-lg font-mono font-bold mt-1 ${isLight ? 'text-neutral-800' : 'text-neutral-300'}`}>
              {stats.wordCount}
            </span>
          </div>
        </div>
      </div>

      {/* Snapshots Component Section */}
      <div id="shelf-version-control" className="p-4 flex-1 flex flex-col min-h-[250px]">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h4 className={`text-xs font-semibold font-sans tracking-wide flex items-center gap-1.5 ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            <Clock size={13} className="text-indigo-600 dark:text-indigo-400" />
            Version History
          </h4>
          <span className="text-[10px] text-neutral-500 font-mono">{snapshots.length} saved</span>
        </div>

        {/* Create Manual Snapshot Form */}
        <form onSubmit={handleCreatePrompt} className="mb-4 flex gap-1.5 shrink-0">
          <input
            id="snapshot-input"
            type="text"
            className={`flex-1 font-mono text-[11px] px-2.5 py-1.5 rounded-lg border focus:outline-none focus:border-indigo-500 transition-colors ${
              isLight
                ? 'bg-white border-neutral-300 text-black placeholder-slate-400'
                : 'bg-black border-neutral-800 focus:border-indigo-500 placeholder-slate-600 text-neutral-200'
            }`}
            placeholder="Snapshot label..."
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
          />
          <button
            id="snapshot-save-btn"
            type="submit"
            className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-medium text-xs transition flex items-center gap-1 cursor-pointer"
            title="Take dynamic file checkpoint snapshot"
          >
            <Save size={12} />
          </button>
        </form>

        {/* Version Checkpoint List */}
        <div id="snapshot-list" className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500 font-mono">
              No checkpoints recorded.<br />Use trigger above to save.
            </div>
          ) : (
            snapshots.map((snap) => (
              <div
                key={snap.id}
                id={`snapshot-item-${snap.id}`}
                className={`group flex flex-col p-2.5 rounded-lg border transition duration-150 relative text-xs ${
                  isLight
                    ? 'bg-white border-neutral-200 hover:bg-neutral-100 hover:border-neutral-300 shadow-sm'
                    : 'bg-black/40 border-neutral-800 hover:bg-black/90 hover:border-neutral-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      isLight
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                        : 'bg-neutral-900 text-indigo-300'
                    }`}>
                      {snap.type}
                    </span>
                    <span className="font-mono text-neutral-400">{snap.timestamp}</span>
                  </div>
                  <button
                    id={`restore-btn-${snap.id}`}
                    onClick={() => onRestoreSnapshot(snap.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-neutral-950 rounded bg-black border border-neutral-800 transition duration-150 absolute right-2.5 top-2 cursor-pointer flex items-center gap-0.5"
                    title="Rollback current document state to this snapshot"
                  >
                    Restore <ChevronRight size={10} />
                  </button>
                </div>
                <div className={`mt-1.5 text-xs truncate pr-16 font-semibold ${isLight ? 'text-black' : 'text-neutral-200'}`}>
                  {snap.label || 'Checkpoint Backup'}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1 font-mono">
                  Contents size: {snap.lines} Lines
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
