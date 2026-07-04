/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VirtualFile {
  path: string; // e.g., "docs/getting-started.md" or "README.md"
  name: string; // e.g., "getting-started.md"
  size?: number;
  lastModified?: number;
  content?: string; // Loaded text content (cached or provided statically)
  handle?: FileSystemFileHandle; // FileSystem Access API handle
  fileObject?: File; // Webkit Directory upload file object
}

export interface VirtualFolder {
  name: string;
  path: string; // e.g., "docs" or "docs/sub"
  files: VirtualFile[];
  subfolders: { [name: string]: VirtualFolder };
  isOpen?: boolean;
}

export interface HistoryEntry {
  path: string;
  title: string;
}

export interface SearchResult {
  file: VirtualFile;
  matches: {
    line: number;
    text: string;
    index: number;
  }[];
  score: number;
}

export interface TocHeading {
  id: string;
  text: string;
  level: number;
}
