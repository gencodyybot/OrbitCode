import React from 'react';
import { RefreshCw, Radio, HardDrive, Wifi, WifiOff, Activity } from 'lucide-react';
import { DocumentStats } from '../types';

interface FooterProps {
  stats: DocumentStats;
  wsUrl: string;
  isSaving: boolean;
  saveStatus: 'Saved' | 'Unsaved Changes' | 'Syncing...';
  connectionState: 'Connected' | 'Reconnecting' | 'Disconnected';
  ping: number | null;
  theme?: 'dark' | 'light';
}

export default function Footer({
  stats,
  wsUrl,
  isSaving,
  saveStatus,
  connectionState,
  ping,
  theme = 'dark',
}: FooterProps) {
  const isLight = theme === 'light';

  const getConnectionStyles = () => {
    switch (connectionState) {
      case 'Connected':
        return {
          bg: isLight
            ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]',
          icon: <Wifi size={12} className={`${isLight ? 'text-emerald-600' : 'text-emerald-400'} animate-pulse shrink-0`} />,
        };
      case 'Reconnecting':
        return {
          bg: isLight
            ? 'bg-amber-50 border-amber-200 text-amber-600'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          dot: 'bg-amber-400 animate-ping',
          icon: <RefreshCw size={12} className={`${isLight ? 'text-amber-600' : 'text-amber-400'} animate-spin shrink-0`} />,
        };
      case 'Disconnected':
        return {
          bg: isLight
            ? 'bg-rose-50 border-rose-200 text-rose-600'
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          dot: 'bg-rose-400',
          icon: <WifiOff size={12} className={`${isLight ? 'text-rose-600' : 'text-rose-400'} shrink-0`} />,
        };
    }
  };

  const connStyles = getConnectionStyles();

  return (
    <footer
      id="app-footer"
      className={`flex h-8 items-center justify-between border-t px-4 text-[11px] font-mono select-none shrink-0 transition-all duration-300 ${
        isLight
          ? 'border-neutral-200 bg-neutral-100 text-neutral-600 border-neutral-200'
          : 'border-neutral-800 bg-neutral-950 text-neutral-400'
      }`}
    >
      {/* Save Status indicators */}
      <div id="footer-status-indicator" className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <HardDrive size={13} className={saveStatus === 'Syncing...' ? 'text-indigo-600 animate-spin shrink-0' : 'text-neutral-400 shrink-0'} />
          <span>
            Document: <span className={`font-semibold ${isLight ? 'text-black' : 'text-neutral-200'}`}>{saveStatus}</span>
          </span>
        </div>

        {/* Live status widget in the footer */}
        <div
          id="footer-connection-badge"
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded border ${connStyles.bg} transition-colors duration-300`}
        >
          {connStyles.icon}
          <span className="font-semibold text-[10px] tracking-wider uppercase">{connectionState}</span>
          {ping !== null && connectionState === 'Connected' && (
            <>
              <span className={`font-normal ${isLight ? 'text-neutral-300' : 'text-black'}`}>|</span>
              <span className={`flex items-center gap-1 text-[10px] ${isLight ? 'text-neutral-600' : 'text-neutral-300'}`}>
                <Activity size={10} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                {ping}ms
              </span>
            </>
          )}
        </div>
      </div>

      {/* Lines / Characters / Words mini telemetry */}
      <div
        id="footer-center-metrics"
        className={`flex items-center gap-4 hidden sm:flex px-3 py-0.5 rounded border transition-all duration-300 ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-600 shadow-sm'
            : 'bg-black border-neutral-800 text-neutral-400'
        }`}
      >
        <span>Lines: <span className={`font-semibold ${isLight ? 'text-indigo-600 font-extrabold' : 'text-white'}`}>{stats.lines}</span></span>
        <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-neutral-200' : 'bg-neutral-900'}`} />
        <span>Chars: <span className="text-indigo-600 dark:text-indigo-300 font-semibold">{stats.characters}</span></span>
        <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-neutral-200' : 'bg-neutral-900'}`} />
        <span>Words: <span className={`font-semibold ${isLight ? 'text-neutral-800 text-semibold' : 'text-neutral-300'}`}>{stats.wordCount}</span></span>
      </div>

      {/* Live Node URI Info */}
      <div id="footer-node-address" className="flex items-center gap-1.5 overflow-hidden">
        <Radio size={13} className="text-indigo-600 dark:text-indigo-400 shrink-0 animate-pulse" />
        <span className="truncate max-w-[150px] md:max-w-[250px]" title={wsUrl}>
          Channel: <span className={isLight ? 'text-neutral-800 font-semibold' : 'text-neutral-300'}>{wsUrl}</span>
        </span>
      </div>
    </footer>
  );
}
