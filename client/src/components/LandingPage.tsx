import React, { useState } from 'react';
import { Code, Sparkles, ArrowRight, User, Terminal, Cpu } from 'lucide-react';

interface LandingPageProps {
  onCreateSession: (name: string) => void;
  onJoinSession: (code: string, name: string) => void;
}

export default function LandingPage({ onCreateSession, onJoinSession }: LandingPageProps) {
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  // Randomized helper placeholders
  const sampleNames = [
    'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Linus Torvalds',
    'Margaret Hamilton', 'Guido van Rossum', 'Tim Berners-Lee',
    'Dennis Ritchie', 'Ken Thompson', 'Barbara Liskov'
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || sampleNames[Math.floor(Math.random() * sampleNames.length)];
    onCreateSession(finalName);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setError('Please enter a valid session room code');
      return;
    }
    const finalName = name.trim() || sampleNames[Math.floor(Math.random() * sampleNames.length)];
    onJoinSession(roomCode.trim(), finalName);
  };

  return (
    <div id="landing-page-root" className="min-h-screen w-screen flex flex-col items-center justify-center bg-black text-neutral-100 p-6 md:p-12 relative overflow-hidden">
      {/* Background visual ambiance grids & circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Tiny subtle aesthetic border grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-40" />

      <main id="landing-main" className="w-full max-w-xl bg-neutral-950/60 border border-neutral-800 rounded-2xl shadow-2xl p-8 backdrop-blur-md relative z-10">
        
        {/* Hub Logo Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xl shadow-indigo-600/20 mb-4 ring-1 ring-white/10">
            <Code size={28} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white mb-2">
            Orbit<span className="text-indigo-400">Code</span> Workspace
          </h1>
          <p className="text-neutral-400 text-sm max-w-sm">
            Experience microsecond collaborative CRDT code editing, realtime cursor tracking, and modular workspace checkpointing.
          </p>
        </div>

        {/* Unified Display Name Config Section */}
        <div className="mb-6 bg-black/80 p-4 rounded-xl border border-neutral-800/80">
          <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2 flex items-center gap-1.5 font-medium">
            <User size={12} className="text-indigo-400" />
            Your Collaborative Display Name
          </label>
          <input
            id="nickname-input"
            type="text"
            placeholder="e.g. Margaret Hamilton (or leave blank for custom guest code)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-neutral-100 placeholder-slate-500 outline-none focus:border-indigo-500 transition duration-150"
          />
        </div>

        {/* Split actions Grid: Create / Join Forms */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-neutral-800">
          
          {/* Create Session Card */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Start Fresh Session
              </h3>
              <p className="text-xs text-neutral-400 mb-4 leading-relaxed leading-medium">
                Establish an entirely new room workspace. Perfect for starting coding interviews or pairing.
              </p>
            </div>
            
            <button
              id="create-session-btn"
              onClick={handleCreate}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/10 text-white font-medium text-xs rounded-lg transition duration-150 cursor-pointer"
            >
              <span>Create Session</span>
              <ArrowRight size={12} />
            </button>
          </div>

          {/* Join Session Card */}
          <form onSubmit={handleJoin} className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-neutral-800 pt-5 md:pt-0 md:pl-5">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1.5 flex items-center gap-1.5">
                <Terminal size={14} className="text-indigo-400" />
                Join Existing Room
              </h3>
              <p className="text-xs text-neutral-400 mb-3.5 leading-relaxed">
                Provide an active alphanumeric invitation code to synchronize workspace.
              </p>
              
              <div className="mb-4">
                <input
                  id="join-code-input"
                  type="text"
                  placeholder="e.g. orbit-51a82-collab"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-black border border-neutral-800 rounded-lg px-3 py-2 text-xs text-neutral-200 placeholder-slate-600 outline-none focus:border-indigo-500 transition duration-150 font-mono"
                />
                {error && <p className="text-[10px] text-rose-500 mt-1">{error}</p>}
              </div>
            </div>

            <button
              id="join-session-btn"
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-200 font-medium text-xs rounded-lg transition duration-150 cursor-pointer"
            >
              <span>Join Session</span>
              <ArrowRight size={12} />
            </button>
          </form>

        </div>

      </main>

      {/* Landing footer tags */}
      <footer className="mt-8 text-center text-[11px] text-neutral-500 font-mono uppercase tracking-wider relative z-10">
        <span className="inline-flex items-center gap-1">
          <Cpu size={12} /> Real-time Node CRDT Sync Service
        </span>
      </footer>
    </div>
  );
}
