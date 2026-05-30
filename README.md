# OrbitCode

A high-performance, real-time collaborative online code editor that allows multiple developers to code together synchronously with zero perceived latency. The editing canvas operates on Conflict-Free Replicated Data Types (CRDTs) to ensure seamless state synchronization, while code testing and execution are kept safely decoupled to run within the user's native local machine environment.

## 🚀 Features

* **Real-Time Code Syncing:** Features zero-perceived latency typing replication across multiple concurrent users powered by Yjs.
* **Smart Conflict Resolution:** Reconciles concurrent editing and structural modifications gracefully without text overlap or dropped characters.
* **Persistent Workspaces:** Automatically backs up binary document state updates to an embedded SQLite database layout on the server, ensuring your projects are saved perfectly even if you return a year later.
* **Multi-File Navigation:** An interactive sidebar file tree supporting real-time creation, editing, and deletion of independent files within a single room session.
* **Active User Awareness:** Full cursor presence tracking that displays a vertical cursor indicator, custom high-visibility marker colors, and floating usernames for active peers.
* **Session Segmentation:** Dynamic room creation generating secure alphanumeric room IDs for easily sharing workspaces with teammates.
* **Developer Shell Polish:** Features an integrated dark-mode UI layout running a fully configured Monaco Editor viewport with syntax highlighting, automatic word-wrap, and cursor animations.

## 🛠️ Tech Stack

* **Frontend:** React, TypeScript, Vite, Monaco Editor (`@monaco-editor/react`), Tailwind CSS
* **Synchronization & Transport:** Yjs (CRDTs), WebSockets (`ws`, `y-websocket`)
* **Backend:** Node.js, Express, TypeScript
* **Database:** SQLite (Prisma ORM)
  
