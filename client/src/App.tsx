import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { Monaco, OnMount } from '@monaco-editor/react';
import { Menu, Layout, ChevronLeft, ChevronRight, Activity, Code, Settings, Sparkles } from 'lucide-react';
import { WorkspaceFile, SessionPeer, DocumentStats } from './types';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import RightPanel from './components/RightPanel';
import Footer from './components/Footer';
import LandingPage from './components/LandingPage';
import NameModal from './components/NameModal';

// Collaboration state integrations
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

// Helper to extract session ID code from current window pathname
const getRoomIdFromPath = (): string => {
  const path = window.location.pathname;
  if (path.startsWith('/room/')) {
    return path.substring(6).trim();
  }
  return '';
};

// Seed initial workspace file states
const INITIAL_FILES: WorkspaceFile[] = [];

// Seed interactive peers
const MOCK_PEERS: SessionPeer[] = [
  { id: 'peer-1', name: 'You', color: '#6366f1', isSelf: true },
  { id: 'peer-2', name: 'Alice Cooper', color: '#10b981' },
  { id: 'peer-3', name: 'Bob Wheeler', color: '#f59e0b' },
];

export default function App() {
  // Navigation panel toggle status
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);

  // Active workspace elements
  const [files, setFiles] = useState<WorkspaceFile[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string>('file-1');
  const activeFile = files.find((f) => f.id === activeFileId) || files[0] || {
    id: 'placeholder',
    name: 'No open files',
    content: '',
    language: 'plaintext'
  };

  // Keep a non-stale reference of activeFileId for Monaco change event listeners
  const activeFileIdRef = useRef<string>(activeFileId);
  useEffect(() => {
    activeFileIdRef.current = activeFileId;
  }, [activeFileId]);

  // Theme settings
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Metrics, statuses, latency indicators
  const [backendStatus, setBackendStatus] = useState<'Connected' | 'Reconnecting' | 'Disconnected'>('Disconnected');
  const [ping, setPing] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'Saved' | 'Unsaved Changes' | 'Syncing...'>('Saved');

  // Room Identifier Code
  const [currentRoom, setCurrentRoom] = useState<string>(getRoomIdFromPath());
  const [displayName, setDisplayName] = useState<string>(() => localStorage.getItem('orbitcode_username') || '');
  const [copiedCode, setCopiedCode] = useState(false);

  // Synchronize path navigation events
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoom(getRoomIdFromPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Snapshot Checkpoints Array state
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [copiedActiveText, setCopiedActiveText] = useState(false);

  // Live document telemetry values
  const [stats, setStats] = useState<DocumentStats>({
    lines: 7,
    characters: 142,
    wordCount: 18,
  });

  // Collaboration and Awareness peer states
  const [peers, setPeers] = useState<SessionPeer[]>([]);
  const [awarenessUsers, setAwarenessUsers] = useState<{ [clientId: number]: { name: string; color: string } }>({});

  // Reference hooks for the Monaco and Yjs document structures
  const editorRef = useRef<any>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  // Determine dynamic local socket channel URI
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${wsProtocol}//${window.location.host}/ws`;

  // Track standard API Ping Latency separately
  useEffect(() => {
    let intervalId: any;

    const checkState = async () => {
      if (backendStatus !== 'Connected') {
        setPing(null);
        return;
      }
      const startPing = Date.now();
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const latency = Date.now() - startPing;
          setPing(latency);
        }
      } catch (err) {
        setPing(null);
      }
    };

    checkState();
    intervalId = setInterval(checkState, 3500);

    return () => {
      clearInterval(intervalId);
    };
  }, [backendStatus]);

  // Initialize Y.Doc and WebSocket Provider once on mount when room and display name are ready
  useEffect(() => {
    if (!currentRoom || !displayName) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const wsProtocolStr = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // We connect to the `/ws` websocket endpoint on our custom Node/Express server
    const serverUrl = `${wsProtocolStr}//${window.location.host}/ws`;
    
    console.log(`Connecting WebsocketProvider to: ${serverUrl} room: ${currentRoom}`);
    const provider = new WebsocketProvider(serverUrl, currentRoom, ydoc);
    providerRef.current = provider;

    const yfiles = ydoc.getMap<any>('files-directory');

    const syncLocalFilesWithYDoc = () => {
      const list: WorkspaceFile[] = [];
      yfiles.forEach((meta: any, id: string) => {
        const ytext = ydoc.getText(id);
        list.push({
          id,
          name: meta.name,
          content: ytext.toString(),
          language: meta.language,
        });
      });
      
      setFiles(list);
      setActiveFileId((currentId) => {
        if (list.some((f) => f.id === currentId)) {
          return currentId;
        }
        return list.length > 0 ? list[0].id : '';
      });
    };

    yfiles.observe(syncLocalFilesWithYDoc);

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates();
      const updatedPeers: SessionPeer[] = [];
      const users: { [clientId: number]: { name: string; color: string } } = {};

      states.forEach((state: any, clientID) => {
        const isSelf = clientID === provider.awareness.clientID;
        const name = state.user?.name || `Guest ${clientID % 100}`;
        const color = state.user?.color || '#3b82f6';

        updatedPeers.push({
          id: String(clientID),
          name: name + (isSelf ? ' (You)' : ''),
          color,
          isSelf,
        });

        // Set the user in the awareness map
        users[clientID] = { name, color };
      });

      setPeers(updatedPeers);
      setAwarenessUsers(users);
    };

    const guestColors = [
      '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', 
      '#ef4444', '#06b6d4', '#14b8a6', '#a855f7', '#f43f5e'
    ];
    const randomColor = guestColors[Math.floor(Math.random() * guestColors.length)];

    provider.awareness.setLocalStateField('user', {
      name: displayName,
      color: randomColor,
    });

    provider.awareness.on('change', handleAwarenessChange);

    // Initial run to build correct self state representation
    handleAwarenessChange();

    provider.on('status', (event: any) => {
      console.log('Real-time sync connection status:', event.status);
      if (event.status === 'connected') {
        setBackendStatus('Connected');
        setSaveStatus('Saved');
        // Re-apply local profile state just in case of connection drop
        provider.awareness.setLocalStateField('user', {
          name: displayName,
          color: randomColor,
        });
      } else if (event.status === 'connecting') {
        setBackendStatus('Reconnecting');
      } else {
        setBackendStatus('Disconnected');
      }
    });

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        console.log('[Yjs] Synchronized session content.');
        if (yfiles.size === 0) {
          console.log('[Yjs] File directory is empty. Seeding defaults.');
          ydoc.transact(() => {
            INITIAL_FILES.forEach((f) => {
              yfiles.set(f.id, { id: f.id, name: f.name, language: f.language });
              const ytext = ydoc.getText(f.id);
              if (ytext.toString() === '') {
                ytext.insert(0, f.content);
              }
            });
          });
        }
        syncLocalFilesWithYDoc();
      }
    });

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      yfiles.unobserve(syncLocalFilesWithYDoc);
      provider.awareness.off('change', handleAwarenessChange);
      provider.destroy();
      ydoc.destroy();
      setPeers([]);
      setAwarenessUsers({});
    };
  }, [currentRoom, displayName]);

  // Handle active Monaco Editor and File document binding
  useEffect(() => {
    if (!editorRef.current || !ydocRef.current || !providerRef.current) return;

    // Tear down any existing active bindings beforehand
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const ydoc = ydocRef.current;
    const provider = providerRef.current;
    const editor = editorRef.current;

    // Obtain or instanciate the shared text type named after our active workspace file identifier
    const ytext = ydoc.getText(activeFileId);

    // Initial load: parse current file content if the state in Y.Doc is totally clean/empty
    if (ytext.toString() === '' && activeFile && activeFile.content) {
      ydoc.transact(() => {
        ytext.insert(0, activeFile.content);
      });
    }

    console.log(`Binding Y.Text for file ${activeFileId} (shared text length: ${ytext.length})`);

    // Setup bidirectional synchronization binding
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    bindingRef.current = binding;

    // Keep statistics inline after binding resolves standard states
    updateStats(ytext.toString());

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [activeFileId, editorRef.current]);

  // Sync state stats when code content changes
  const updateStats = (text: string) => {
    const lines = text.split('\n').length;
    const characters = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    setStats({ lines, characters, wordCount });
  };

  // Run on Editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Set initial stats on first load
    const currentCode = editor.getValue();
    updateStats(currentCode);

    // Watch carefully for document modifications
    editor.onDidChangeModelContent(() => {
      const code = editor.getValue();
      updateStats(code);
      setSaveStatus('Saved');

      // Sync latest edits back to files representation in state safely using non-stale ref
      setFiles((prevFiles) =>
        prevFiles.map((f) => (f.id === activeFileIdRef.current ? { ...f, content: code } : f))
      );
    });
  };

  // Trigger whenever user clicks a different file tab
  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    if (ydocRef.current) {
      const ytext = ydocRef.current.getText(id);
      const latestText = ytext.toString();
      setFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, content: latestText } : f))
      );
      updateStats(latestText);
    } else {
      const targetFile = files.find((f) => f.id === id);
      if (targetFile) {
        updateStats(targetFile.content);
      }
    }
  };

  // Create new workspace file
  const handleCreateFile = (name: string) => {
    if (!ydocRef.current) return;

    let targetName = name?.trim();
    if (!targetName) {
      const count = files.length + 1;
      targetName = `untitled_${count}.py`;
    }

    // Determine language based on extension
    let language = 'plaintext';
    const ext = targetName.split('.').pop()?.toLowerCase() || '';
    if (['js', 'jsx', 'cjs', 'mjs'].includes(ext)) {
      language = 'javascript';
    } else if (['ts', 'tsx'].includes(ext)) {
      language = 'typescript';
    } else if (ext === 'html' || ext === 'htm') {
      language = 'html';
    } else if (ext === 'css') {
      language = 'css';
    } else if (ext === 'json') {
      language = 'json';
    } else if (['py', 'pyw'].includes(ext)) {
      language = 'python';
    } else if (['cpp', 'cc', 'cxx', 'c'].includes(ext)) {
      language = 'cpp';
    } else if (['cs'].includes(ext)) {
      language = 'csharp';
    } else if (['java'].includes(ext)) {
      language = 'java';
    } else if (['kt', 'kts'].includes(ext)) {
      language = 'kotlin';
    } else if (['rs'].includes(ext)) {
      language = 'rust';
    } else if (['go'].includes(ext)) {
      language = 'go';
    } else if (['md', 'markdown'].includes(ext)) {
      language = 'markdown';
    } else if (['sh', 'bash'].includes(ext)) {
      language = 'shell';
    } else if (['yaml', 'yml'].includes(ext)) {
      language = 'yaml';
    } else {
      language = 'plaintext';
    }

    const newId = `file-${Date.now()}`;
    let defaultContent = '';
    if (language === 'python') {
      defaultContent = `# Collaborative Python file: ${targetName}\n\ndef main():\n    print("Hello from ${targetName}!")\n`;
    } else if (['javascript', 'typescript'].includes(language)) {
      defaultContent = `// Collaborative ${language.toUpperCase()} file\nconsole.log("Welcome to ${targetName}");\n`;
    } else if (language === 'html') {
      defaultContent = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${targetName}</title>\n</head>\n<body>\n  <h1>Welcome to ${targetName}</h1>\n</body>\n</html>\n`;
    } else if (language === 'cpp') {
      defaultContent = `#include <iostream>\n\nint main() {\n    std::cout << "Hello from ${targetName}!" << std::endl;\n    return 0;\n}\n`;
    } else if (language === 'java') {
      const className = targetName.split('.')[0];
      defaultContent = `public class ${className} {\n    public static void main(String[] args) {\n        System.out.println("Hello from ${targetName}!");\n    }\n}\n`;
    } else if (language === 'kotlin') {
      defaultContent = `fun main() {\n    println("Hello from ${targetName}!")\n}\n`;
    } else if (language === 'css') {
      defaultContent = `/* Collaborative CSS file */\nbody {\n  margin: 0;\n  padding: 0;\n}\n`;
    } else {
      defaultContent = `Collaborative file: ${targetName}\n`;
    }

    const ydoc = ydocRef.current;
    const yfiles = ydoc.getMap<any>('files-directory');

    ydoc.transact(() => {
      // 1. Create text entry
      const ytext = ydoc.getText(newId);
      ytext.insert(0, defaultContent);

      // 2. Set directory metadata
      yfiles.set(newId, {
        id: newId,
        name: targetName,
        language
      });
    });

    setActiveFileId(newId);
    setSaveStatus('Saved');
  };

  // Delete designated workspace file
  const handleDeleteFile = (id: string) => {
    if (!ydocRef.current) return;

    // Standard safety fallback: don't delete if it's the last file
    if (files.length <= 1) return;

    const ydoc = ydocRef.current;
    const yfiles = ydoc.getMap<any>('files-directory');

    yfiles.delete(id);

    if (activeFileId === id) {
      const remaining = files.filter((f) => f.id !== id);
      if (remaining.length > 0) {
        setActiveFileId(remaining[0].id);
      }
    }
    setSaveStatus('Saved');
  };

  // Switch document theme status
  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Copy Room Invite Link Helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(window.location.origin + '/room/' + currentRoom);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Export current code files as downloads
  const handleExport = (format: 'raw' | 'json') => {
    let contentBlob: Blob;
    let filename: string;

    if (format === 'raw') {
      contentBlob = new Blob([activeFile.content], { type: 'text/plain;charset=utf-8' });
      filename = activeFile.name;
    } else {
      contentBlob = new Blob([JSON.stringify(files, null, 2)], { type: 'application/json' });
      filename = `orbitcode-session-export.json`;
    }

    const element = document.createElement('a');
    element.href = URL.createObjectURL(contentBlob);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy current active file code to clipboard
  const handleCopyToClipboard = () => {
    if (activeFile && activeFile.content) {
      navigator.clipboard.writeText(activeFile.content);
      setCopiedActiveText(true);
      setTimeout(() => setCopiedActiveText(false), 2000);
    }
  };

  // Fetch snapshots list from Database backend
  const loadSnapshots = useCallback(async () => {
    if (!currentRoom) return;
    try {
      const res = await fetch(`/api/rooms/${currentRoom}/snapshots`);
      const data = await res.json();
      if (data.success && data.snapshots) {
        setSnapshots(data.snapshots);
      }
    } catch (e) {
      console.error('[Snapshots] Error loading checkpoints:', e);
    }
  }, [currentRoom]);

  useEffect(() => {
    if (currentRoom) {
      loadSnapshots();
    }
  }, [currentRoom, loadSnapshots]);

  // Snapshots implementation
  const handleCreateSnapshot = async (label?: string) => {
    if (!currentRoom) return;
    try {
      setSaveStatus('Syncing...');
      const labelText = label || `Version checkpoint #${snapshots.length + 1}`;
      
      const res = await fetch(`/api/rooms/${currentRoom}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: labelText,
          type: 'Manual',
          files: files,
          lines: stats.lines,
        }),
      });
      const data = await res.json();
      if (data.success && data.snapshot) {
        setSnapshots((prev) => [data.snapshot, ...prev]);
        setSaveStatus('Saved');
      } else {
        setSaveStatus('Unsaved Changes');
      }
    } catch (err) {
      console.error('[Snapshots] Failed to create version checkpoint:', err);
      setSaveStatus('Unsaved Changes');
    }
  };

  const handleRestoreSnapshot = async (id: string) => {
    if (!currentRoom || !ydocRef.current) return;

    if (id === 'snap-1' || id === 'init-snap' || id === 'init-snap') {
      const ydoc = ydocRef.current;
      const yfiles = ydoc.getMap<any>('files-directory');
      ydoc.transact(() => {
        yfiles.clear();
        INITIAL_FILES.forEach((f) => {
          yfiles.set(f.id, { id: f.id, name: f.name, language: f.language });
          const ytext = ydoc.getText(f.id);
          ytext.delete(0, ytext.length);
          ytext.insert(0, f.content);
        });
      });
      setSaveStatus('Saved');
      return;
    }

    try {
      setSaveStatus('Syncing...');
      const res = await fetch(`/api/rooms/${currentRoom}/snapshots/${id}`);
      const data = await res.json();
      if (data.success && data.files) {
        const ydoc = ydocRef.current;
        const yfiles = ydoc.getMap<any>('files-directory');
        
        ydoc.transact(() => {
          // Identify snap file IDs to remove keys not present in restored set
          const snapFileIds = new Set(data.files.map((f: any) => f.id));
          yfiles.forEach((meta: any, key: string) => {
            if (!snapFileIds.has(key)) {
              yfiles.delete(key);
            }
          });

          // Insert or update restored text buffers
          data.files.forEach((f: any) => {
            yfiles.set(f.id, { id: f.id, name: f.name, language: f.language });
            const ytext = ydoc.getText(f.id);
            ytext.delete(0, ytext.length);
            ytext.insert(0, f.content);
          });
        });
        
        setSaveStatus('Saved');
      } else {
        setSaveStatus('Unsaved Changes');
      }
    } catch (err) {
      console.error('[Snapshots] Error restoring database checkpoint:', err);
      setSaveStatus('Unsaved Changes');
    }
  };

  // Session Management Actions
  const handleCreateSession = (name: string) => {
    let uuid = '';
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        uuid = crypto.randomUUID().replace(/-/g, '');
      } else {
        uuid = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      }
    } catch (e) {
      uuid = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
    }
    const generatedId = 'room-' + uuid.substring(0, 12);
    localStorage.setItem('orbitcode_username', name);
    setDisplayName(name);
    window.history.pushState({}, '', `/room/${generatedId}`);
    setCurrentRoom(generatedId);
  };

  const handleJoinSession = (code: string, name: string) => {
    let cleanedCode = code.trim();
    if (cleanedCode.includes('/room/')) {
      cleanedCode = cleanedCode.substring(cleanedCode.indexOf('/room/') + 6);
    }
    localStorage.setItem('orbitcode_username', name);
    setDisplayName(name);
    window.history.pushState({}, '', `/room/${cleanedCode}`);
    setCurrentRoom(cleanedCode);
  };

  // If no room session code is yet selected, present landing portal
  if (!currentRoom) {
    return (
      <LandingPage
        onCreateSession={handleCreateSession}
        onJoinSession={handleJoinSession}
      />
    );
  }

  // Intercept direct accesses to rooms with display name choice modal
  if (!displayName) {
    return (
      <NameModal
        roomCode={currentRoom}
        onJoin={(name) => {
          localStorage.setItem('orbitcode_username', name);
          setDisplayName(name);
        }}
      />
    );
  }

  return (
    <div
      id="orbitcode-grid-root"
      className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${
        theme === 'dark' ? 'bg-black text-neutral-100' : 'bg-neutral-50 text-black'
      }`}
    >
      {/* Dynamic Topbar */}
      <Topbar
        roomCode={currentRoom}
        peers={peers}
        theme={theme}
        onThemeToggle={handleThemeToggle}
        onExportCode={handleExport}
        onCopyToClipboard={handleCopyToClipboard}
        onCopyRoomCode={handleCopyCode}
        copied={copiedCode}
        copiedActiveText={copiedActiveText}
      />

      {/* Main Workspace split Stage */}
      <div id="workspace-core-split" className="flex flex-1 overflow-hidden relative">
        <Sidebar
          files={files}
          activeFileId={activeFileId}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onSelectFile={handleSelectFile}
          onCreateFile={handleCreateFile}
          onDeleteFile={handleDeleteFile}
        />

        {/* Monaco Editor viewport pane */}
        <div
          id="editor-stage-pane"
          className={`flex-1 flex flex-col overflow-hidden relative h-full transition-colors duration-300 ${
            theme === 'light' ? 'bg-white' : 'bg-black'
          }`}
        >
          {/* Editor Header stats tab */}
          <div
            id="editor-header-tab"
            className={`h-9 border-b flex items-center justify-between px-4 text-xs font-mono select-none shrink-0 transition-colors duration-300 ${
              theme === 'light'
                ? 'bg-neutral-100 border-neutral-200 text-neutral-800 border-neutral-200'
                : 'bg-neutral-950/50 border-neutral-800 text-neutral-300 border-r border-neutral-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-1 rounded transition flex items-center gap-1 cursor-pointer font-sans ${
                  theme === 'light'
                    ? 'text-indigo-600 hover:text-indigo-700 hover:bg-neutral-200'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
                title={isSidebarOpen ? 'Collapse workspace' : 'Expand workspace'}
              >
                <Layout size={14} className="text-indigo-500" />
              </button>
              {activeFile.id !== 'placeholder' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className={theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}>Editing: </span>
                  <span className={`font-semibold font-mono ${theme === 'light' ? 'text-indigo-600' : 'text-white'}`}>{activeFile.name}</span>
                  <span className={theme === 'light' ? 'text-neutral-400 text-[10px]' : 'text-neutral-600 text-[10px]'}>({activeFile.language})</span>
                </>
              )}
              {activeFile.id === 'placeholder' && (
                <span className={theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}>No open files</span>
              )}
            </div>

            {/* Expand/Collapse metrics toggler */}
            <button
              id="toggle-right-panel-btn"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
              className={`p-1 rounded transition flex items-center gap-1 cursor-pointer font-sans px-2.5 py-0.5 ${
                theme === 'light'
                  ? 'text-indigo-600 hover:text-indigo-700 hover:bg-neutral-200'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
              title={isRightPanelOpen ? 'Collapse stats shelf' : 'Expand stats shelf'}
            >
              <Activity size={14} className="text-indigo-500" />
              <span className="text-[10px] hidden sm:inline font-semibold">
                {isRightPanelOpen ? 'Hide Metrics' : 'Show Metrics'}
              </span>
            </button>
          </div>

          {/* Monaco Wrapper container */}
          <div id="monaco-wrapper" className="flex-1 w-full h-[calc(100%-36px)] overflow-hidden relative">
            {backendStatus !== 'Connected' && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md transition-all duration-300">
                <div className="bg-neutral-950/90 border border-neutral-800 rounded-xl p-8 max-w-sm text-center shadow-2xl flex flex-col items-center">
                  <div className="relative flex items-center justify-center w-12 h-12 mb-4">
                    <span className="absolute animate-ping inline-flex h-10 w-10 rounded-full bg-indigo-500/20 opacity-75"></span>
                    <span className="relative w-8 h-8 rounded-full bg-indigo-500/10 border-2 border-indigo-500 border-t-transparent animate-spin"></span>
                  </div>
                  <h3 className="text-white text-sm font-semibold font-sans tracking-tight mb-2">
                    Reconnecting to workspace...
                  </h3>
                  <p className="text-neutral-400 text-[10px] font-mono leading-relaxed max-w-[240px]">
                    Real-time synchronization was interrupted. Re-establishing the secure collaborative workspace link.
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 px-2.5 py-0.5 bg-black border border-neutral-800 rounded-full text-[10px] font-mono text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>State: {backendStatus}</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeFile.id !== 'placeholder' ? (
              <Editor
                height="100%"
                path={activeFile.name}
                defaultLanguage={activeFile.language}
                language={activeFile.language}
                value={activeFile.content}
                theme={theme === 'dark' ? 'amoled-dark' : 'light'}
                beforeMount={(monaco) => {
                  monaco.editor.defineTheme('amoled-dark', {
                    base: 'vs-dark',
                    inherit: true,
                    rules: [],
                    colors: {
                      'editor.background': '#000000',
                    }
                  });
                }}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  fontSize: 14,
                  fontFamily: 'JetBrains Mono, Menlo, Monaco, Courier New, monospace',
                  padding: { top: 12, bottom: 12 },
                  readOnly: backendStatus !== 'Connected',
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalHasArrows: false,
                    horizontalHasArrows: false,
                  },
                }}
              />
            ) : (
              <div className={`flex flex-col items-center justify-center h-full text-sm font-mono ${theme === 'light' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                <Code size={48} className={`mb-4 opacity-50 ${theme === 'light' ? 'text-indigo-300' : 'text-neutral-800'}`} />
                <p>No open files.</p>
                <p className="text-xs opacity-70 mt-2">Create a new file in the Workspace to begin coding.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar for metrics and snapshots */}
        {isRightPanelOpen && (
          <RightPanel
            stats={stats}
            connectionState={backendStatus}
            ping={ping}
            snapshots={snapshots}
            onCreateSnapshot={handleCreateSnapshot}
            onRestoreSnapshot={handleRestoreSnapshot}
            theme={theme}
          />
        )}
      </div>

      {/* Synchronized footer */}
      <Footer
        stats={stats}
        wsUrl={wsUrl}
        isSaving={saveStatus === 'Syncing...'}
        saveStatus={saveStatus}
        connectionState={backendStatus}
        ping={ping}
        theme={theme}
      />

      {/* Dynamic Monaco Cursor presence definitions compiled per online client */}
      <style>{`
        .yRemoteSelection {
          background-color: rgba(99, 102, 241, 0.25);
          transition: background-color 0.15s ease-in-out;
        }

        .yRemoteSelectionHead {
          position: absolute;
          width: 2px !important;
          height: 100%;
          border-left: 2px solid #555;
        }

        ${Object.entries(awarenessUsers).map(([clientId, userObj]) => {
          const user = userObj as { name: string; color: string };
          return `
            .yRemoteSelection-${clientId} {
              background-color: ${user.color}35 !important;
            }

            .yRemoteSelectionHead-${clientId} {
              position: absolute;
              border-left: 2px solid ${user.color} !important;
              height: 100%;
              box-sizing: border-box;
            }

            .yRemoteSelectionHead-${clientId}::after {
              content: "${user.name.replace(/"/g, '\\"')}";
              position: absolute;
              top: -14px;
              left: 0;
              background-color: ${user.color};
              color: #ffffff;
              font-size: 10px;
              font-family: system-ui, -apple-system, sans-serif;
              font-weight: 600;
              padding: 1px 5px;
              border-radius: 3px;
              white-space: nowrap;
              z-index: 1000;
              pointer-events: none;
              line-height: normal;
              height: auto;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
              opacity: 0.9;
              transition: opacity 0.15s ease-in-out;
            }
          `;
        }).join('\n')}
      `}</style>
    </div>
  );
}
