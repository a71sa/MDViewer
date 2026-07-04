/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Download, 
  Clock, 
  FileText, 
  BookOpen, 
  ZoomIn, 
  ArrowLeftRight,
  Eye,
  FileDown
} from "lucide-react";
import { VirtualFile } from "../types";
import MarkdownRenderer from "./MarkdownRenderer";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface MainPaneProps {
  activeFile: VirtualFile | null;
  content: string;
  isLoading: boolean;
  onNavigateRelative: (relativePath: string) => void;
  onMermaidClick: (code: string) => void;
  // History controls
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
}

type FontSize = "sm" | "base" | "lg" | "xl";

export default function MainPane({
  activeFile,
  content,
  isLoading,
  onNavigateRelative,
  onMermaidClick,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward
}: MainPaneProps) {
  const [fontSize, setFontSize] = React.useState<FontSize>("base");
  const [isExportingPdf, setIsExportingPdf] = React.useState<boolean>(false);

  // Word count and reading time estimations
  const stats = useMemo(() => {
    if (!content) return { words: 0, time: 0 };
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const time = Math.max(1, Math.ceil(words / 220)); // Average reading speed ~220 WPM
    return { words, time };
  }, [content]);

  // Translate file size
  const formattedSize = useMemo(() => {
    if (!activeFile?.size) return "";
    const bytes = activeFile.size;
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  }, [activeFile]);

  // Translate last modified
  const formattedDate = useMemo(() => {
    if (!activeFile?.lastModified) return "";
    return new Date(activeFile.lastModified).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }, [activeFile]);

  // Break down path into breadcrumbs
  const breadcrumbs = useMemo(() => {
    if (!activeFile?.path) return [];
    return activeFile.path.split("/");
  }, [activeFile]);

  // Copy full path
  const handleCopyPath = () => {
    if (activeFile?.path) {
      navigator.clipboard.writeText(activeFile.path).then(() => {
        alert(`Copied file path: "${activeFile.path}" to clipboard.`);
      });
    }
  };

  // Download raw markdown file
  const handleDownloadFile = () => {
    if (!activeFile) return;
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/markdown" });
    element.href = URL.createObjectURL(file);
    element.download = activeFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export styled PDF file
  const handleExportPdf = async () => {
    if (!activeFile) return;
    const element = document.getElementById("markdown-paper-sheet");
    if (!element) return;

    setIsExportingPdf(true);
    try {
      // Create high-resolution canvas capture
      const canvas = await html2canvas(element, {
        scale: 2, // 2x for sharp text rendering
        useCORS: true,
        backgroundColor: "#141416", // Maintain dark slate theme
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 190; // mm with padding margins
      const pageHeight = 297; // A4 height mm
      const margin = 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - margin * 2);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + margin;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - margin * 2);
      }

      const cleanName = activeFile.name.replace(/\.[^/.]+$/, "");
      pdf.save(`${cleanName}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF export:", err);
      alert("Error generating PDF. Please make sure content is fully loaded.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Font class mapping
  const fontClass = 
    fontSize === "sm" ? "prose-sm text-sm" :
    fontSize === "base" ? "prose-base text-base" :
    fontSize === "lg" ? "prose-lg text-lg" :
    "prose-xl text-xl";

  return (
    <main className="flex-1 flex flex-col h-full bg-[#0A0A0B] overflow-hidden select-text">
      {/* Utility Header bar */}
      <header className="h-14 border-b border-white/5 bg-[#0D0D0E] px-6 flex items-center justify-between shrink-0 select-none">
        {/* Navigation & Breadcrumbs */}
        <div className="flex items-center gap-3.5 overflow-hidden min-w-0">
          {/* History back/forward buttons */}
          <div className="flex items-center gap-1 bg-[#141416] p-0.5 rounded-lg border border-white/5 shrink-0">
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                canGoBack 
                  ? "text-white/65 hover:text-white hover:bg-white/5" 
                  : "text-white/20 cursor-not-allowed"
              }`}
              title="Go Back"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
            </button>
            <button
              onClick={onGoForward}
              disabled={!canGoForward}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                canGoForward 
                  ? "text-white/65 hover:text-white hover:bg-white/5" 
                  : "text-white/20 cursor-not-allowed"
              }`}
              title="Go Forward"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-white/5 shrink-0" />

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-white/40 truncate">
            <FileText className="w-3.5 h-3.5 text-white/30 shrink-0" />
            {breadcrumbs.map((part, index) => {
              const isLast = index === breadcrumbs.length - 1;
              return (
                <React.Fragment key={index}>
                  {index > 0 && <span className="text-white/10">/</span>}
                  <span
                    className={`truncate ${
                      isLast ? "text-white/90 font-bold" : "text-white/40 font-normal"
                    }`}
                  >
                    {part}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Readability & Content Utilities */}
        {activeFile && (
          <div className="flex items-center gap-3 shrink-0">
            {/* Font Zoom Controls */}
            <div className="flex items-center gap-1 bg-[#141416] p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => setFontSize("sm")}
                className={`px-2 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                  fontSize === "sm" ? "bg-white/10 text-indigo-300" : "text-white/40 hover:text-white/80"
                }`}
                title="Small Text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("base")}
                className={`px-2 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  fontSize === "base" ? "bg-white/10 text-indigo-300" : "text-white/40 hover:text-white/80"
                }`}
                title="Regular Text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("lg")}
                className={`px-2 py-1 text-sm font-bold rounded-md transition-all cursor-pointer ${
                  fontSize === "lg" ? "bg-white/10 text-indigo-300" : "text-white/40 hover:text-white/80"
                }`}
                title="Large Text"
              >
                A
              </button>
              <button
                onClick={() => setFontSize("xl")}
                className={`px-2 py-1 text-base font-bold rounded-md transition-all cursor-pointer ${
                  fontSize === "xl" ? "bg-white/10 text-indigo-300" : "text-white/40 hover:text-white/80"
                }`}
                title="Extra Large Text"
              >
                A+
              </button>
            </div>

            <div className="h-4 w-[1px] bg-white/5" />

            {/* Utility Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyPath}
                className="p-1.5 hover:bg-white/5 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Copy Workspace Path"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadFile}
                className="p-1.5 hover:bg-white/5 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Download Raw Markdown"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={handleExportPdf}
                disabled={isExportingPdf}
                className="p-1.5 hover:bg-white/5 text-white/50 hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                title={isExportingPdf ? "Exporting PDF..." : "Export as styled PDF"}
              >
                {isExportingPdf ? (
                  <svg className="animate-spin h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <FileDown className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Document Frame */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {isLoading ? (
          /* Central Loading spinner */
          <div className="h-full flex flex-col items-center justify-center gap-4 text-white/30">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-xs font-semibold tracking-widest font-mono uppercase text-indigo-400">Assembling document content...</p>
          </div>
        ) : activeFile ? (
          /* Active Doc layout */
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Meta tags card */}
            <div className="bg-[#141416] border border-white/5 rounded-xl px-6 py-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/50 shadow-sm select-none">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />
                <span>Estimate: <strong className="text-white/80 font-semibold">{stats.time} min</strong> ({stats.words} words)</span>
              </div>
              {formattedSize && (
                <div className="flex items-center gap-1.5 border-l border-white/5 pl-6">
                  <FileText className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />
                  <span>Size: <strong className="text-white/80 font-semibold">{formattedSize}</strong></span>
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center gap-1.5 border-l border-white/5 pl-6">
                  <Eye className="w-3.5 h-3.5 text-indigo-400/60 shrink-0" />
                  <span>Modified: <strong className="text-white/80 font-semibold">{formattedDate}</strong></span>
                </div>
              )}
            </div>

            {/* Paper sheet doc container */}
            <div id="markdown-paper-sheet" className="bg-[#141416] border border-white/5 rounded-2xl p-8 md:p-12 shadow-md min-h-[500px]">
              <MarkdownRenderer
                content={content}
                onNavigate={onNavigateRelative}
                onMermaidClick={onMermaidClick}
                fontSizeClass={fontClass}
              />
            </div>
          </div>
        ) : (
          /* Splash empty state screen */
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto p-6 select-none">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl mb-5 shadow-sm">
              <BookOpen className="w-10 h-10 stroke-[1.8]" />
            </div>
            <h2 className="text-lg font-bold text-white/90">Ready to read?</h2>
            <p className="text-white/40 text-xs leading-relaxed mt-2.5">
              Open a local folder structure to construct a workspace, search references, navigate diagrams, or select a file to view immediately.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/30 mt-6 border border-white/5 rounded-full px-3 py-1.5 bg-[#141416] shadow-sm">
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-400/50" />
              <span>Supports links, diagrams, and LaTeX math</span>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
