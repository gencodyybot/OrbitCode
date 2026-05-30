import React, { useState } from 'react';
import { File, FolderOpen, Plus, Trash2, ChevronLeft, ChevronRight, FileCode, Check, X } from 'lucide-react';
import { WorkspaceFile } from '../types';

interface SidebarProps {
  files: WorkspaceFile[];
  activeFileId: string;
  isOpen: boolean;
  onToggle: () => void;
  onSelectFile: (id: string) => void;
  onCreateFile: (name: string) => void;
  onDeleteFile: (id: string) => void;
}

export default function Sidebar({
  files,
  activeFileId,
  isOpen,
  onToggle,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
}: SidebarProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [error, setError] = useState('');

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'py' || ext === 'pyw') return <FileCode size={16} className="text-yellow-500 animate-pulse" />;
    if (['js', 'jsx', 'ts', 'tsx'].includes(ext || '')) return <FileCode size={16} className="text-blue-400" />;
    if (['html', 'htm'].includes(ext || '')) return <FileCode size={16} className="text-orange-500" />;
    if (ext === 'css') return <FileCode size={16} className="text-teal-400" />;
    if (ext === 'json') return <FileCode size={16} className="text-rose-400" />;
    if (['cpp', 'c', 'cxx', 'cc'].includes(ext || '')) return <FileCode size={16} className="text-indigo-400" />;
    if (ext === 'java') return <FileCode size={16} className="text-red-500" />;
    if (['kt', 'kts'].includes(ext || '')) return <FileCode size={16} className="text-purple-500" />;
    if (ext === 'rs') return <FileCode size={16} className="text-orange-400" />;
    if (ext === 'go') return <FileCode size={16} className="text-cyan-400" />;
    if (['md', 'markdown'].includes(ext || '')) return <File size={16} className="text-neutral-300" />;
    if (['txt'].includes(ext || '')) return <File size={16} className="text-neutral-400" />;
    if (['sh', 'bash'].includes(ext || '')) return <FileCode size={16} className="text-green-400" />;
    return <File size={16} className="text-neutral-400" />;
  };

  const handleConfirmCreate = () => {
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    if (!/^[a-zA-Z0-9_\-\.]+$/.test(trimmed)) {
      setError('Use letters, numbers, dots, or dashes');
      return;
    }
    setError('');
    onCreateFile(trimmed);
    setNewFileName('');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewFileName('');
    setError('');
  };

  return (
    <div
      id="sidebar-container"
      className={`relative h-full border-r border-neutral-800 bg-neutral-950/90 flex flex-col transition-all duration-300 ${
        isOpen ? 'w-64' : 'w-0 overflow-hidden border-r-0'
      }`}
    >
      {/* Sidebar Header */}
      {isOpen && (
        <div id="sidebar-header" className="flex items-center justify-between p-4 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center gap-2 text-neutral-200">
            <FolderOpen size={18} className="text-indigo-400" />
            <span className="font-semibold text-sm tracking-wide">Workspace</span>
          </div>
          <button
            id="create-file-toggle-btn"
            onClick={() => setIsCreating(true)}
            className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 text-indigo-400 hover:text-white transition-colors duration-150 tooltip cursor-pointer"
            title="Create New File"
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Files List & Creative Form */}
      {isOpen && (
        <div id="sidebar-files" className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Custom inline File creation dialog */}
          {isCreating && (
            <div className="p-3 bg-black/80 border border-indigo-500/30 rounded-lg mb-2">
              <div className="flex items-center gap-2 mb-1">
                <FileCode size={14} className="text-indigo-400 shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. app.py, router.js"
                  value={newFileName}
                  onChange={(e) => {
                    setNewFileName(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmCreate();
                    if (e.key === 'Escape') handleCancelCreate();
                  }}
                  className="bg-transparent text-xs font-mono outline-none w-full text-neutral-100 placeholder-slate-600"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-[10px] text-rose-500 font-mono mb-2">{error}</p>
              )}
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  onClick={handleCancelCreate}
                  className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded transition cursor-pointer"
                  title="Cancel"
                >
                  <X size={12} />
                </button>
                <button
                  onClick={handleConfirmCreate}
                  className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition cursor-pointer"
                  title="Add File"
                >
                  <Check size={12} />
                </button>
              </div>
            </div>
          )}

          {files.length === 0 ? (
            <div className="text-center py-8 text-xs text-neutral-500 font-mono">
              No files in workspace.<br />Create a new file to begin.
            </div>
          ) : (
            files.map((file) => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  id={`file-item-${file.id}`}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-mono transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/15 border-l-2 border-indigo-500 text-white font-medium'
                      : 'hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200'
                  }`}
                  onClick={() => onSelectFile(file.id)}
                >
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    {getFileIcon(file.name)}
                    <span className="truncate" title={file.name}>
                      {file.name}
                    </span>
                  </div>
                  {files.length > 1 && (
                    <button
                      id={`delete-file-btn-${file.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${file.name}?`)) {
                          onDeleteFile(file.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-red-400 transition-all duration-150 cursor-pointer"
                      title="Delete File"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Manual Toggle handle sticking out on the border */}
      <button
        id="sidebar-toggle-handle"
        onClick={onToggle}
        className="absolute top-1/2 -right-3 -translate-y-1/2 flex h-24 w-3 items-center justify-center rounded-r border border-l-0 border-neutral-700 bg-neutral-900 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition cursor-pointer"
      >
        {isOpen ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
      </button>
    </div>
  );
}
