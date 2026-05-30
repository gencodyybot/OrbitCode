import React, { useState } from 'react';
import { User, Code, ArrowRight } from 'lucide-react';

interface NameModalProps {
  roomCode: string;
  onJoin: (name: string) => void;
}

export default function NameModal({ roomCode, onJoin }: NameModalProps) {
  const [name, setName] = useState('');

  const sampleNames = [
    'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Linus Torvalds',
    'Margaret Hamilton', 'Guido van Rossum', 'Tim Berners-Lee',
    'Dennis Ritchie', 'Ken Thompson', 'Barbara Liskov'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || sampleNames[Math.floor(Math.random() * sampleNames.length)];
    onJoin(finalName);
  };

  return (
    <div id="username-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4">
      {/* Dynamic color grid circles in backdrop */}
      <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/3 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div id="username-modal-container" className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl p-7 relative">
        <div className="flex flex-col items-center text-center">
          
          {/* Logo badge */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-600/10 mb-4 select-none">
            <Code size={22} />
          </div>

          <h2 className="text-xl font-bold font-sans text-white mb-2">
            Enter Collaboration Session
          </h2>
          <p className="text-neutral-400 text-xs mb-6 max-w-xs leading-relaxed">
            You are joining room: <span className="text-indigo-400 font-mono font-semibold">{roomCode}</span>. Please choose a display name to represent your typing cursor to other active peers.
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-5 bg-black/60 p-4 rounded-xl border border-neutral-800 text-left">
              <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5 font-medium">
                <User size={12} className="text-indigo-400" />
                Collaborator Moniker
              </label>
              <input
                id="modal-username-input"
                type="text"
                autoFocus
                placeholder="e.g. Linus Torvalds"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition duration-150"
              />
              <p className="text-[10px] text-neutral-500 mt-2 font-mono">
                Leave blank to automatically sign in as a random historical scientist.
              </p>
            </div>

            <button
              id="modal-submit-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/10 transition duration-150 cursor-pointer"
            >
              <span>Connect & Launch Code Editor</span>
              <ArrowRight size={13} />
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
