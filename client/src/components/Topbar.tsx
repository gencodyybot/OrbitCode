import React from 'react';
import { Share2, Download, Copy, Moon, Sun, Code, Check } from 'lucide-react';
import { SessionPeer } from '../types';

interface TopbarProps {
  roomCode: string;
  peers: SessionPeer[];
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onExportCode: (format: 'raw' | 'json') => void;
  onCopyToClipboard: () => void;
  onCopyRoomCode: () => void;
  copied: boolean;
  copiedActiveText: boolean;
}

export default function Topbar({
  roomCode,
  peers,
  theme,
  onThemeToggle,
  onExportCode,
  onCopyToClipboard,
  onCopyRoomCode,
  copied,
  copiedActiveText,
}: TopbarProps) {
  const isLight = theme === 'light';

  return (
    <header
      id="app-topbar"
      className={`flex h-14 items-center justify-between border-b z-10 select-none shrink-0 transition-all duration-300 ${
        isLight
          ? 'bg-white border-neutral-200 text-black'
          : 'bg-neutral-950 border-neutral-800 text-neutral-100'
      }`}
    >
      {/* Brand Logo & Name */}
      <div id="topbar-logo-group" className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-600/20">
          <Code size={18} className="animate-spin-slow" />
        </div>
        <div className="flex flex-col">
          <span className={`font-sans font-bold text-sm tracking-widest uppercase`}>
            Orbit<span className="text-indigo-600 dark:text-indigo-400 font-extrabold">Code</span>
          </span>
          <span className={`text-[10px] font-mono tracking-wide ${isLight ? 'text-neutral-400' : 'text-neutral-500'}`}>
            COLLAB HUB
          </span>
        </div>
      </div>

      {/* Collaboration Peers Indicator & Room Code */}
      <div id="topbar-session-info" className="flex items-center gap-4">
        {/* Room Code Share Button */}
        <div
          id="room-code-badge"
          className={`flex items-center rounded-lg p-1 border transition-all duration-350 ${
            isLight ? 'bg-neutral-50 border-neutral-200' : 'bg-black border-neutral-800'
          }`}
        >
          <span className={`px-2.5 py-1 text-xs font-mono ${isLight ? 'text-neutral-600' : 'text-neutral-400'}`}>
            ROOM: <span className={`font-semibold ${isLight ? 'text-black' : 'text-white'}`}>{roomCode}</span>
          </span>
          <button
            id="share-button"
            onClick={onCopyRoomCode}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition duration-150 cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-indigo-600 hover:bg-indigo-500 text-neutral-100'
            }`}
          >
            {copied ? <Check size={12} /> : <Share2 size={12} />}
            <span>{copied ? 'Copied' : 'Share'}</span>
          </button>
        </div>

        {/* Separator */}
        <div className={`h-5 w-[1px] hidden sm:block ${isLight ? 'bg-neutral-200' : 'bg-neutral-900'}`} />

        {/* Peers Active Avatar Stack */}
        <div id="peers-avatar-stack" className="items-center gap-1.5 hidden sm:flex">
          <div className="flex -space-x-1.5">
            {peers.map((peer) => (
              <div
                key={peer.id}
                id={`peer-avatar-${peer.id}`}
                className="relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white uppercase shadow-sm cursor-help ring-2"
                style={{
                  backgroundColor: peer.color,
                  borderColor: peer.isSelf ? '#6366f1' : isLight ? '#cbd5e1' : '#334155',
                  boxShadow: peer.isSelf ? '0 0 8px rgba(99, 102, 241, 0.4)' : undefined,
                }}
                title={`${peer.name} ${peer.isSelf ? '(You)' : ''}`}
              >
                {peer.name.slice(0, 1) || 'P'}
                {/* Active Indicator Pulse Ring */}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white dark:border-slate-900 animate-pulse" />
              </div>
            ))}
          </div>
          <span className={`text-xs font-medium ml-1 ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
            {peers.length} active
          </span>
        </div>
      </div>

      {/* Workspace Actions (Theme preference & Export downloads) */}
      <div id="topbar-actions" className="flex items-center gap-2">
        {/* Theme Toggle Button */}
        <button
          id="toggle-theme-btn"
          onClick={onThemeToggle}
          className={`p-2 rounded-lg transition duration-200 cursor-pointer ${
            isLight
              ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
              : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white'
          }`}
          title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
        >
          {isLight ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Live Export & Clipboard tools */}
        <div id="export-dropdown-wrapper" className="flex items-center gap-1.5">
          <button
            id="export-raw-btn"
            onClick={() => onExportCode('raw')}
            className={`flex items-center gap-1 text-xs px-3 py-2 rounded-lg transition duration-200 cursor-pointer ${
              isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200'
            }`}
            title="Download active source code file"
          >
            <Download size={14} className="shrink-0" />
            <span className="hidden md:inline font-medium">Export Code</span>
          </button>
          
          <button
            id="copy-clipboard-btn"
            onClick={onCopyToClipboard}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition duration-200 cursor-pointer text-xs font-medium ${
              copiedActiveText
                ? 'bg-emerald-600 text-white animate-pulse'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50'
                : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200'
            }`}
            title="Copy current active file text"
          >
            {copiedActiveText ? <Check size={14} /> : <Copy size={14} />}
            <span className="hidden md:inline">{copiedActiveText ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
