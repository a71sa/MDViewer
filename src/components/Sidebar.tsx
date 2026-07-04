/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  ListTree, 
  Compass, 
  FolderSearch, 
  ChevronRight, 
  ChevronDown, 
  Upload, 
  FileCode,
  BookOpen,
  Info
} from "lucide-react";
import { VirtualFile, VirtualFolder, SearchResult, TocHeading } from "../types";

interface SidebarProps {
  rootFolder: VirtualFolder | null;
  filesList: VirtualFile[];
  activeFilePath: string;
  onFileSelect: (file: VirtualFile) => void;
  onOpenDirectory: () => void;
  onFilesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  searchResults: SearchResult[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearching: boolean;
  tocHeadings: TocHeading[];
  onLoadSamples: () => void;
}

type SidebarTab = "explorer" | "search" | "outline";

export default function Sidebar({
  rootFolder,
  filesList,
  activeFilePath,
  onFileSelect,
  onOpenDirectory,
  onFilesUpload,
  searchResults,
  searchQuery,
  setSearchQuery,
  isSearching,
  tocHeadings,
  onLoadSamples
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("explorer");
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Toggle single folder collapse
  const toggleFolder = (path: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Support recursive folder render
  const renderFolderNode = (folder: VirtualFolder, depth: number = 0) => {
    const isRoot = folder.path === "";
    
    // Subfolders & files
    const subfolderElements = Object.values(folder.subfolders).map((sub) =>
      renderFolderNode(sub, depth + 1)
    );

    const fileElements = folder.files.map((file) => {
      const isActive = file.path === activeFilePath;
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      
      return (
        <button
          key={file.path}
          onClick={() => onFileSelect(file)}
          style={{ paddingLeft: `${(depth + 1) * 12 + 12}px` }}
          className={`w-full flex items-center gap-2 py-1.5 pr-3 text-sm rounded-lg transition-all text-left select-none group cursor-pointer ${
            isActive
              ? "bg-indigo-500/10 text-indigo-300 font-medium border-l-2 border-indigo-500 rounded-l-none"
              : "text-white/50 hover:bg-white/5 hover:text-white"
          }`}
        >
          {fileExt === "md" || fileExt === "markdown" ? (
            <BookOpen className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/50"}`} />
          ) : ["js", "ts", "tsx", "html", "css", "json"].includes(fileExt || "") ? (
            <FileCode className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/50"}`} />
          ) : (
            <FileText className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-400" : "text-white/30 group-hover:text-white/50"}`} />
          )}
          <span className="truncate" title={file.name}>
            {file.name}
          </span>
        </button>
      );
    });

    if (isRoot) {
      return (
        <div key="root-folder" className="space-y-0.5">
          {subfolderElements}
          {fileElements}
        </div>
      );
    }

    const isCollapsed = collapsedFolders[folder.path] ?? false;

    return (
      <div key={folder.path} className="space-y-0.5">
        <button
          onClick={() => toggleFolder(folder.path)}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          className="w-full flex items-center justify-between py-1.5 pr-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left select-none cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5 shrink-0 text-white/40" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 shrink-0 text-white/40" />
            )}
            {isCollapsed ? (
              <Folder className="w-4 h-4 shrink-0 text-indigo-400 fill-indigo-500/10" />
            ) : (
              <FolderOpen className="w-4 h-4 shrink-0 text-indigo-400 fill-indigo-500/20" />
            )}
            <span className="text-sm font-medium truncate" title={folder.name}>
              {folder.name}
            </span>
          </div>
          <span className="text-[10px] text-white/40 px-1.5 py-0.5 bg-white/5 border border-white/5 rounded-sm">
            {folder.files.length + Object.keys(folder.subfolders).length}
          </span>
        </button>

        {!isCollapsed && (
          <div className="overflow-hidden">
            {subfolderElements}
            {fileElements}
          </div>
        )}
      </div>
    );
  };

  const isAccessAPISupported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  return (
    <aside className="w-80 border-r border-white/5 bg-[#141416] flex flex-col h-full shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/5 bg-[#0D0D0E]/40">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
            <BookOpen className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="font-bold text-white/95 text-base leading-none">MD Workspace</h1>
            <p className="text-[9px] text-indigo-400/80 font-bold mt-1.5 uppercase tracking-widest font-mono">
              Elegant Document Vault
            </p>
          </div>
        </div>
      </div>

      {/* Action triggers: Load Directory */}
      <div className="p-3 border-b border-white/5 bg-transparent space-y-2">
        <div className="grid grid-cols-1 gap-2">
          {isAccessAPISupported ? (
            <button
              onClick={onOpenDirectory}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer w-full"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Open Local Folder</span>
            </button>
          ) : null}

          {/* Webkit directory selector (Fallback or Alternative) */}
          <label className="flex items-center justify-center gap-2 px-3 py-2 bg-[#0D0D0E] hover:bg-white/5 border border-white/10 hover:border-white/20 text-white/70 active:bg-white/10 rounded-lg text-xs font-semibold cursor-pointer transition-all text-center w-full">
            <Upload className="w-4 h-4 text-white/40" />
            <span>{isAccessAPISupported ? "Select Folder (Fallback)" : "Open Folder"}</span>
            <input
              type="file"
              webkitdirectory=""
              directory=""
              multiple
              onChange={onFilesUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Info panel when empty */}
        {!rootFolder && (
          <div className="p-2.5 bg-indigo-500/5 border border-indigo-500/10 rounded-lg flex gap-2">
            <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-indigo-200 font-semibold">No Folder Loaded</p>
              <p className="text-[10px] text-indigo-300/70 mt-0.5 leading-relaxed">
                Open a folder or click below to load standard sample documents.
              </p>
              <button
                onClick={onLoadSamples}
                className="mt-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 underline decoration-dotted decoration-indigo-400/50 transition-colors cursor-pointer"
              >
                Load Sample Docs
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs navigation */}
      <div className="flex border border-white/5 bg-black/40 p-1 m-2.5 rounded-lg shrink-0">
        <button
          onClick={() => setActiveTab("explorer")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            activeTab === "explorer"
              ? "bg-white/10 text-indigo-300 font-semibold"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Explorer</span>
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer relative ${
            activeTab === "search"
              ? "bg-white/10 text-indigo-300 font-semibold"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Search</span>
          {searchResults.length > 0 && (
            <span className="absolute -top-1.5 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-extrabold text-white animate-scale">
              {searchResults.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("outline")}
          disabled={tocHeadings.length === 0}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed ${
            activeTab === "outline"
              ? "bg-white/10 text-indigo-300 font-semibold"
              : "text-white/40 hover:text-white/70"
          }`}
        >
          <ListTree className="w-3.5 h-3.5" />
          <span>Outline</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto px-3.5 pb-4">
        {/* Explorer Panel */}
        {activeTab === "explorer" && (
          <div className="space-y-1">
            {rootFolder ? (
              renderFolderNode(rootFolder)
            ) : (
              <div className="text-center py-12 px-4">
                <FolderSearch className="w-8 h-8 mx-auto text-white/20 stroke-[1.5]" />
                <p className="text-xs text-white/60 font-medium mt-3">No Files Available</p>
                <p className="text-[11px] text-white/30 mt-1 leading-relaxed">
                  Connect a local documentation directory or explore the prebuilt sample suite.
                </p>
                <button
                  onClick={onLoadSamples}
                  className="mt-4 px-3 py-1.5 border border-white/5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-medium text-white/75 transition-colors cursor-pointer"
                >
                  Load Sample Suite
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search Panel */}
        {activeTab === "search" && (
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search across all files..."
                className="w-full text-xs pl-8 pr-8 py-2 border border-white/5 hover:border-white/10 focus:border-indigo-500 bg-[#0D0D0E] rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30 transition-all text-white/90 placeholder-white/30"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/30" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 py-0.5 px-1.5 hover:bg-white/10 rounded-sm text-[10px] text-white/40 hover:text-white/70 transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Loader / Empty States */}
            {isSearching ? (
              <div className="flex items-center justify-center gap-2 py-8 text-white/40 text-xs">
                <svg className="animate-spin h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Searching documentation...</span>
              </div>
            ) : searchQuery.trim() === "" ? (
              <div className="text-center py-8 text-white/30 text-[11px] leading-relaxed">
                Enter keywords to trigger a full-text search across all documents.
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-white/50 font-medium">No results found</p>
                <p className="text-[11px] text-white/30 mt-1">Try keywords like "Markdown", "Mermaid", or "math".</p>
              </div>
            ) : (
              /* Search list */
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider select-none">
                  Matching files ({searchResults.length})
                </p>
                <div className="space-y-2.5">
                  {searchResults.map((result) => (
                    <div key={result.file.path} className="border border-white/5 bg-[#0D0D0E] rounded-lg overflow-hidden shadow-sm">
                      {/* File title trigger */}
                      <button
                        onClick={() => onFileSelect(result.file)}
                        className="w-full text-left bg-white/5 hover:bg-white/10 px-2.5 py-1.5 border-b border-white/5 flex items-center justify-between select-none cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-white/80 truncate block max-w-[180px]">
                          {result.file.name}
                        </span>
                        <span className="text-[9px] text-indigo-300 px-1 bg-indigo-500/10 rounded-sm">
                          {result.matches.length} matches
                        </span>
                      </button>

                      {/* File Matches snippets */}
                      <div className="p-1 space-y-1">
                        {result.matches.slice(0, 3).map((match, i) => (
                          <button
                            key={i}
                            onClick={() => onFileSelect(result.file)}
                            className="w-full text-left p-1.5 hover:bg-white/5 rounded-md text-[11px] font-mono leading-normal text-white/40 flex items-start gap-1 cursor-pointer truncate hover:text-white/80"
                          >
                            <span className="text-[9px] font-bold text-indigo-400/50 shrink-0 w-6">
                              L{match.line}
                            </span>
                            <span className="truncate text-white/60 block">
                              {match.text}
                            </span>
                          </button>
                        ))}
                        {result.matches.length > 3 && (
                          <div className="text-center text-[10px] text-white/30 py-1 border-t border-white/5">
                            + {result.matches.length - 3} more matches
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Outline Panel */}
        {activeTab === "outline" && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-2 select-none">
              Table of Contents
            </p>
            <div className="space-y-1 border-l border-white/5 pl-1">
              {tocHeadings.map((heading, i) => {
                // Determine padding level
                const plClass = 
                  heading.level === 1 ? "pl-1 font-semibold text-white/90" :
                  heading.level === 2 ? "pl-3 text-white/60 hover:text-indigo-300" :
                  heading.level === 3 ? "pl-6 text-white/40 text-xs hover:text-indigo-300" :
                  "pl-9 text-white/30 text-[11px] hover:text-indigo-300";

                return (
                  <button
                    key={i}
                    onClick={() => {
                      const element = document.getElementById(heading.id);
                      if (element) {
                        element.scrollIntoView({ behavior: "smooth" });
                      }
                    }}
                    className={`w-full text-left py-1 text-xs hover:text-indigo-300 rounded-sm transition-colors cursor-pointer select-none truncate block ${plClass}`}
                    title={heading.text}
                  >
                    {heading.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer statistics */}
      {filesList.length > 0 && (
        <div className="p-3 bg-[#0D0D0E]/80 border-t border-white/5 text-[10px] text-white/35 flex items-center justify-between select-none">
          <span>Loaded workspace</span>
          <span className="font-semibold text-white/65 font-mono">
            {filesList.length} Files
          </span>
        </div>
      )}
    </aside>
  );
}
