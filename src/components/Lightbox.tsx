/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import mermaid from "mermaid";
import { ZoomIn, ZoomOut, RotateCcw, X, Move, Sun, Moon } from "lucide-react";

interface LightboxProps {
  code: string;
  onClose: () => void;
}

export default function Lightbox({ code, onClose }: LightboxProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [bgMode, setBgMode] = useState<"light" | "dark">("light");
  const containerRef = useRef<HTMLDivElement>(null);

  // Render the diagram specifically inside the modal
  useEffect(() => {
    let active = true;
    const renderDiagram = async () => {
      const uniqueId = `mermaid-lightbox-${Math.floor(Math.random() * 100000)}`;
      try {
        const { svg } = await mermaid.render(uniqueId, code);
        if (active) {
          setSvgHtml(svg);
          setError("");
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Syntax compilation failed.");
        }
        const badElement = document.getElementById(uniqueId);
        if (badElement) badElement.remove();
      }
    };

    renderDiagram();
    return () => {
      active = false;
    };
  }, [code]);

  // Adjust zoom with buttons
  const handleZoomIn = () => setScale((s) => Math.min(s + 0.25, 4));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.25, 0.5));
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Keyboard shortcut listeners (Escape to close, +/- to zoom)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "=" || e.key === "+") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleReset();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle Drag / Pan mechanics
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle Mouse Wheel Zoom inside container
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 0.1;
    const direction = e.deltaY < 0 ? 1 : -1;
    setScale((prevScale) => {
      const nextScale = prevScale + direction * zoomFactor;
      return Math.min(Math.max(nextScale, 0.4), 4);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-xs select-none"
      id="lightbox-backdrop"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Lightbox Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 text-white">
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Move className="w-4 h-4 text-indigo-400" />
            Interactive Diagram Canvas
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Scroll to zoom • Click & drag to explore
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Controls toolbar */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-4.5 h-4.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-4.5 h-4.5" />
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>
            <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />
            <button
              onClick={() => setBgMode(prev => prev === "light" ? "dark" : "light")}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer flex items-center justify-center animate-fade-in"
              title={`Switch to ${bgMode === "light" ? "dark" : "light"} canvas background`}
            >
              {bgMode === "light" ? <Moon className="w-4.5 h-4.5 text-indigo-400" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Canvas (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        className={`flex-1 overflow-hidden relative flex items-center justify-center cursor-grab transition-colors duration-200 ${
          isDragging ? "cursor-grabbing" : ""
        } ${
          bgMode === "light" 
            ? "bg-slate-50 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px]" 
            : "bg-[#09090b] bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:24px_24px]"
        }`}
      >
        {error ? (
          <div className="p-6 bg-red-950/50 border border-red-900/50 text-red-400 max-w-lg rounded-xl font-mono text-xs shadow-lg">
            <h4 className="font-bold text-red-300 mb-2 flex items-center gap-1.5 text-sm">
              Failed to Compile
            </h4>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        ) : svgHtml ? (
          <div
            className="absolute transition-transform duration-75 ease-out flex items-center justify-center"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "center"
            }}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-500 text-sm">
            <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating immersive canvas...
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-6 py-2 border-t border-slate-900 text-slate-500 text-xs flex justify-between select-none">
        <span>Click and drag to pan • Zoom factor: {(scale * 100).toFixed(0)}%</span>
        <span>Drag to explore full structure</span>
      </div>
    </div>
  );
}
