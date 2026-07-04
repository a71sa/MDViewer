/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "./components/Sidebar";
import MainPane from "./components/MainPane";
import Lightbox from "./components/Lightbox";
import { VirtualFile, VirtualFolder, SearchResult } from "./types";
import { buildFolderTree, parseUploadedFiles, readFileText, resolveRelativePath } from "./utils/fileSystem";
import { searchFiles } from "./utils/search";
import { getTableOfContents } from "./utils/markdown";
import { SAMPLE_DOCUMENTS } from "./utils/samples";

export default function App() {
  // Core Workspace state
  const [filesList, setFilesList] = useState<VirtualFile[]>([]);
  const [rootFolder, setRootFolder] = useState<VirtualFolder | null>(null);
  
  // Navigation State
  const [activeFilePath, setActiveFilePath] = useState<string>("");
  const [activeFileContent, setActiveFileContent] = useState<string>("");
  const [isLoadingFile, setIsLoadingFile] = useState<boolean>(false);
  
  // Navigation History Stack
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Search State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Lightbox State
  const [activeMermaidCode, setActiveMermaidCode] = useState<string | null>(null);

  // Load the built-in Sample Suite on initial app mount for a beautiful, immediate experience
  useEffect(() => {
    loadSamples();
  }, []);

  // Helper to load sample files
  const loadSamples = async () => {
    // Clone samples to prevent side effects when editing content in cache
    const clonedSamples = SAMPLE_DOCUMENTS.map((doc) => ({ ...doc }));
    setFilesList(clonedSamples);
    
    const tree = buildFolderTree(clonedSamples);
    setRootFolder(tree);

    // Default to the Welcome document
    const welcomeDoc = clonedSamples.find((f) => f.path === "Welcome.md") || clonedSamples[0];
    if (welcomeDoc) {
      setIsLoadingFile(true);
      try {
        const text = await readFileText(welcomeDoc);
        welcomeDoc.content = text;
        
        setActiveFilePath(welcomeDoc.path);
        setActiveFileContent(text);
        
        // Reset navigation history stack
        setHistory([welcomeDoc.path]);
        setHistoryIndex(0);
      } catch (err) {
        console.error("Failed to load welcome sample:", err);
      } finally {
        setIsLoadingFile(false);
      }
    }
  };

  // Navigates directly to a selected VirtualFile
  const selectFile = async (file: VirtualFile) => {
    setIsLoadingFile(true);
    try {
      // Lazy load text from disk/upload and cache it
      let text = file.content;
      if (text === undefined) {
        text = await readFileText(file);
        file.content = text; // Cache it
      }

      setActiveFilePath(file.path);
      setActiveFileContent(text);

      // Push file to navigation history stack, cutting off any forward history
      const newHistory = history.slice(0, historyIndex + 1);
      
      // Prevent pushing duplicate paths in sequence
      if (newHistory[newHistory.length - 1] !== file.path) {
        newHistory.push(file.path);
      }
      
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    } catch (err) {
      console.error(`Failed to load file text for ${file.path}:`, err);
      alert(`Could not load file: "${file.name}"`);
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Traverses backward in navigation history
  const handleGoBack = async () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetPath = history[targetIndex];
      const targetFile = filesList.find((f) => f.path === targetPath);
      
      if (targetFile) {
        setIsLoadingFile(true);
        try {
          let text = targetFile.content;
          if (text === undefined) {
            text = await readFileText(targetFile);
            targetFile.content = text;
          }
          setActiveFilePath(targetPath);
          setActiveFileContent(text);
          setHistoryIndex(targetIndex);
        } catch (err) {
          console.error("Failed to navigate back in history:", err);
        } finally {
          setIsLoadingFile(false);
        }
      }
    }
  };

  // Traverses forward in navigation history
  const handleGoForward = async () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetPath = history[targetIndex];
      const targetFile = filesList.find((f) => f.path === targetPath);
      
      if (targetFile) {
        setIsLoadingFile(true);
        try {
          let text = targetFile.content;
          if (text === undefined) {
            text = await readFileText(targetFile);
            targetFile.content = text;
          }
          setActiveFilePath(targetPath);
          setActiveFileContent(text);
          setHistoryIndex(targetIndex);
        } catch (err) {
          console.error("Failed to navigate forward in history:", err);
        } finally {
          setIsLoadingFile(false);
        }
      }
    }
  };

  // Resolves relative clicks inside Markdown (supporting cross-references and anchors)
  const handleNavigateRelative = async (relativePath: string) => {
    const hashIndex = relativePath.indexOf("#");
    const filePathPart = hashIndex !== -1 ? relativePath.substring(0, hashIndex) : relativePath;
    const anchorPart = hashIndex !== -1 ? relativePath.substring(hashIndex + 1) : "";

    if (filePathPart) {
      // Resolve path (e.g. "./Math_Proof.md" or "../Welcome.md") relative to active path
      const resolvedPath = resolveRelativePath(activeFilePath, filePathPart);
      const targetFile = filesList.find(
        (f) => f.path === resolvedPath || f.path.toLowerCase() === resolvedPath.toLowerCase()
      );

      if (targetFile) {
        await selectFile(targetFile);
        
        // After loading the file and letting it mount, scroll to anchor heading
        if (anchorPart) {
          setTimeout(() => {
            const element = document.getElementById(anchorPart);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 150);
        }
      } else {
        alert(`Cross-reference failed: File "${resolvedPath}" was not found in the loaded folder.`);
      }
    } else if (anchorPart) {
      // Internal page anchor link
      const element = document.getElementById(anchorPart);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Handles standard Native showDirectoryPicker folder selection
  const handleOpenDirectory = async () => {
    try {
      // Prompt user to select directory
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "read"
      });
      
      setIsLoadingFile(true);
      const files = await readDirectoryRecursively(dirHandle);
      
      if (files.length === 0) {
        alert("No markdown, text, or readable code files found in the chosen folder.");
        setIsLoadingFile(false);
        return;
      }

      setFilesList(files);
      const tree = buildFolderTree(files);
      setRootFolder(tree);

      // Default to README.md or welcome.md if present, else fallback to first file
      const preferredDoc = files.find(
        (f) => f.name.toLowerCase() === "readme.md" || f.name.toLowerCase() === "welcome.md"
      ) || files[0];

      if (preferredDoc) {
        const text = await readFileText(preferredDoc);
        preferredDoc.content = text;
        setActiveFilePath(preferredDoc.path);
        setActiveFileContent(text);
        
        // Reset history stack
        setHistory([preferredDoc.path]);
        setHistoryIndex(0);
      }
      
      // Clear queries
      setSearchQuery("");
      setSearchResults([]);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Failed to select local folder:", err);
        alert(`Folder Selection Failed: ${err.message || err}`);
      }
    } finally {
      setIsLoadingFile(false);
    }
  };

  // Handles webkit directory drag-and-drop or upload fallback directory selection
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsLoadingFile(true);
    const files = parseUploadedFiles(fileList);

    if (files.length === 0) {
      alert("No markdown, text, or readable files found in the uploaded directory.");
      setIsLoadingFile(false);
      return;
    }

    setFilesList(files);
    const tree = buildFolderTree(files);
    setRootFolder(tree);

    // Default to README.md, welcome.md, or first file
    const preferredDoc = files.find(
      (f) => f.name.toLowerCase() === "readme.md" || f.name.toLowerCase() === "welcome.md"
    ) || files[0];

    if (preferredDoc) {
      const text = await readFileText(preferredDoc);
      preferredDoc.content = text;
      setActiveFilePath(preferredDoc.path);
      setActiveFileContent(text);
      
      // Reset history stack
      setHistory([preferredDoc.path]);
      setHistoryIndex(0);
    }

    setSearchQuery("");
    setSearchResults([]);
    setIsLoadingFile(false);
  };

  // Background recursion read for FileSystemDirectoryHandle (helper wrapper)
  const readDirectoryRecursively = async (
    dirHandle: any,
    currentPath: string = ""
  ): Promise<VirtualFile[]> => {
    const files: VirtualFile[] = [];
    for await (const entry of (dirHandle as any).values()) {
      const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
      if (entry.kind === "file") {
        const ext = entry.name.split(".").pop()?.toLowerCase() || "";
        const isReadable = [
          "md", "markdown", "mdown", "mkdn", "txt", "text", 
          "json", "js", "ts", "tsx", "html", "css", "yaml", "yml"
        ].includes(ext);

        if (isReadable) {
          try {
            const fileObj = await entry.getFile();
            files.push({
              path: entryPath,
              name: entry.name,
              size: fileObj.size,
              lastModified: fileObj.lastModified,
              handle: entry,
            });
          } catch (e) {
            files.push({
              path: entryPath,
              name: entry.name,
              handle: entry,
            });
          }
        }
      } else if (entry.kind === "directory") {
        try {
          const subFiles = await readDirectoryRecursively(entry, entryPath);
          files.push(...subFiles);
        } catch (e) {
          console.error("Directory read failure:", e);
        }
      }
    }
    return files;
  };

  // Reactive full-text search indexing with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delayTimer = setTimeout(async () => {
      try {
        const results = await searchFiles(filesList, searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error("Search index pipeline failure:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [searchQuery, filesList]);

  // Compute active file metadata
  const activeFileObject = useMemo(() => {
    return filesList.find((f) => f.path === activeFilePath) || null;
  }, [filesList, activeFilePath]);

  // Compute Table of Contents headings for active document
  const tocHeadings = useMemo(() => {
    return getTableOfContents(activeFileContent);
  }, [activeFileContent]);

  // Synchronize browser history / Back button to close the interactive diagram lightbox gracefully
  useEffect(() => {
    if (activeMermaidCode) {
      // Push dummy state to capture back navigation
      window.history.pushState({ lightboxOpen: true }, "");
      
      const handlePopState = (e: PopStateEvent) => {
        // If they navigate back, close the lightbox
        setActiveMermaidCode(null);
      };
      
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [activeMermaidCode]);

  // Cleanly close lightbox by reverting history state if pushed
  const handleCloseLightbox = () => {
    if (window.history.state && window.history.state.lightboxOpen) {
      window.history.back();
    }
    setActiveMermaidCode(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0A0A0B] text-gray-300 font-sans antialiased">
      {/* Sidebar Controller */}
      <Sidebar
        rootFolder={rootFolder}
        filesList={filesList}
        activeFilePath={activeFilePath}
        onFileSelect={selectFile}
        onOpenDirectory={handleOpenDirectory}
        onFilesUpload={handleFilesUpload}
        searchResults={searchResults}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        tocHeadings={tocHeadings}
        onLoadSamples={loadSamples}
      />

      {/* Main Reading Workspace Canvas */}
      <MainPane
        activeFile={activeFileObject}
        content={activeFileContent}
        isLoading={isLoadingFile}
        onNavigateRelative={handleNavigateRelative}
        onMermaidClick={setActiveMermaidCode}
        canGoBack={historyIndex > 0}
        canGoForward={historyIndex < history.length - 1}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
      />

      {/* Immersive zoom/pan Mermaid Lightbox Canvas */}
      {activeMermaidCode && (
        <Lightbox
          code={activeMermaidCode}
          onClose={handleCloseLightbox}
        />
      )}
    </div>
  );
}
