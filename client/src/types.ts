export interface WorkspaceFile {
  id: string;
  name: string;
  content: string;
  language: string;
}

export interface SessionPeer {
  id: string;
  name: string;
  color: string;
  isSelf?: boolean;
}

export interface DocumentStats {
  lines: number;
  characters: number;
  wordCount: number;
}
