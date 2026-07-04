/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useRef } from "react";
import { marked } from "marked";
import katex from "katex";
import mermaid from "mermaid";
import "katex/dist/katex.min.css";

// Helper to escape HTML inside custom code blocks
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface MarkdownRendererProps {
  content: string;
  onNavigate: (relativePath: string) => void;
  onMermaidClick?: (code: string) => void;
  fontSizeClass?: string; // e.g. "prose-sm", "prose-base", "prose-lg"
}

export default function MarkdownRenderer({
  content,
  onNavigate,
  onMermaidClick,
  fontSizeClass = "text-base"
}: MarkdownRendererProps) {
  // Ref to store code block texts indexed by a temporary ID
  const codeTexts = useRef<{ [key: string]: string }>({});

  // Reset codeTexts on new render
  codeTexts.current = {};

  // Define custom renderer inside useMemo to preserve references
  const customRenderer = useMemo(() => {
    return {
      // 1. Custom Code block parsing (Mermaid vs standard)
      code(codeObj: any) {
        let code = "";
        let lang = "";

        if (codeObj && typeof codeObj === "object") {
          code = codeObj.text || "";
          lang = codeObj.lang || "";
        } else if (typeof codeObj === "string") {
          code = codeObj;
          lang = arguments[1] || "";
        }

        if (lang.trim().toLowerCase() === "mermaid") {
          const encodedCode = encodeURIComponent(code);
          return `<div class="mermaid-container my-6 p-6 bg-[#0D0D0E]/60 rounded-xl shadow-sm border border-white/5 flex flex-col items-center justify-center cursor-zoom-in hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all duration-200" data-code="${encodedCode}"></div>`;
        }

        const codeId = "code_" + Math.random().toString(36).substring(2, 11);
        codeTexts.current[codeId] = code;

        return `
          <div class="code-block-wrapper my-6 rounded-xl overflow-hidden border border-white/5 shadow-md bg-[#141416] font-mono text-sm">
            <div class="flex items-center justify-between px-4 py-2 bg-[#0D0D0E] border-b border-white/5 text-xs text-white/40 select-none">
              <span class="font-sans uppercase font-medium text-indigo-400 font-semibold">${lang || "text"}</span>
              <button class="copy-code-btn flex items-center gap-1 hover:text-white transition-colors cursor-pointer" data-code-id="${codeId}">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Copy</span>
              </button>
            </div>
            <pre class="p-4 overflow-x-auto text-slate-100 leading-relaxed font-mono"><code>${escapeHtml(code)}</code></pre>
          </div>
        `;
      },

      // 2. Beautiful task items / list items
      listitem(item: any) {
        let text = "";
        let checked: boolean | undefined = undefined;

        if (item && typeof item === "object") {
          text = item.text || "";
          checked = item.checked;
        } else if (typeof item === "string") {
          text = item;
          // In older signatures, task item info is second/third argument
          checked = arguments[2] !== undefined ? arguments[2] : undefined;
        }

        if (checked !== undefined) {
          return `
            <li class="task-list-item flex items-start gap-3 my-1.5 text-white/80">
              <input type="checkbox" disabled class="mt-1 h-4.5 w-4.5 rounded-sm border-white/10 bg-black/35 text-indigo-500 focus:ring-indigo-500 cursor-default shrink-0" ${checked ? "checked" : ""} />
              <span class="${checked ? "line-through text-white/45" : ""}">${text}</span>
            </li>
          `;
        }
        return `<li class="my-1.5 list-disc pl-1 text-white/80 leading-relaxed">${text}</li>`;
      },

      // 3. Document Anchor IDs and clean styles for Headings
      heading(headingObj: any) {
        let text = "";
        let level = 1;

        if (headingObj && typeof headingObj === "object") {
          text = headingObj.text || "";
          level = headingObj.depth || 1;
        } else if (typeof headingObj === "string") {
          text = headingObj;
          level = typeof arguments[1] === "number" ? arguments[1] : 1;
        }

        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");

        const sizeClasses = [
          "",
          "text-3xl font-bold tracking-tight text-white mt-8 mb-4 border-b border-white/5 pb-2.5",
          "text-2xl font-semibold tracking-tight text-white/90 mt-7 mb-3.5 pb-1 border-b border-white/5",
          "text-xl font-semibold text-white/90 mt-6 mb-3",
          "text-lg font-medium text-white/85 mt-5 mb-2.5",
          "text-base font-medium text-white/85 mt-4 mb-2",
          "text-sm font-semibold text-indigo-400 uppercase tracking-wider mt-4 mb-2"
        ];

        return `
          <h${level} id="${id}" class="${sizeClasses[level] || "text-base font-bold"} scroll-mt-24 group flex items-center gap-2">
            <span>${text}</span>
            <a href="#${id}" class="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-indigo-400 font-normal text-sm" aria-hidden="true">#</a>
          </h${level}>
        `;
      },

      // 4. Stylized Blockquotes
      blockquote(quote: any) {
        let text = "";

        if (quote && typeof quote === "object") {
          text = quote.text || "";
        } else if (typeof quote === "string") {
          text = quote;
        }

        return `
          <blockquote class="my-6 pl-4 border-l-4 border-indigo-500/40 bg-indigo-500/5 py-3 text-white/70 italic rounded-r-lg leading-relaxed animate-fade-in">
            ${text}
          </blockquote>
        `;
      }
    };
  }, []);

  // Register the custom renderer with marked
  useEffect(() => {
    marked.use({ renderer: customRenderer as any });
  }, [customRenderer]);

  // Pre-process math (LaTeX) equations using KaTeX prior to running through marked
  const preProcessedContent = useMemo(() => {
    if (!content) return "";
    let result = content;

    // A. Parse and render block equations: $$ math $$
    result = result.replace(/\$\$([\s\S]+?)\$\$/g, (_, formula) => {
      try {
        const rendered = katex.renderToString(formula.trim(), {
          displayMode: true,
          throwOnError: false,
          output: "htmlAndMathml"
        });
        return `<div class="katex-block-wrapper my-6 py-2 overflow-x-auto text-center">${rendered}</div>`;
      } catch (err) {
        console.warn("KaTeX Block render error:", err);
        return `<div class="text-red-500 font-mono text-xs p-2 bg-red-50 border border-red-100 my-2 rounded">Math Error: ${escapeHtml(formula)}</div>`;
      }
    });

    // B. Parse and render inline equations: $ math $
    // Lookbehind to prevent matching escaping backslashes, lookahead to guarantee matches
    result = result.replace(/(?<!\\)\$((?:\\\$|[^$])+?)(?<!\\)\$/g, (_, formula) => {
      try {
        const cleanFormula = formula.replace(/\\\$/g, "$");
        return katex.renderToString(cleanFormula.trim(), {
          displayMode: false,
          throwOnError: false,
          output: "htmlAndMathml"
        });
      } catch (err) {
        console.warn("KaTeX Inline render error:", err);
        return `<span class="text-red-500 font-mono text-[10px]">Math Error</span>`;
      }
    });

    return result;
  }, [content]);

  // Parse HTML content synchronously using marked
  const parsedHtml = useMemo(() => {
    try {
      return marked.parse(preProcessedContent, {
        gfm: true,
        breaks: true,
        async: false
      }) as string;
    } catch (e) {
      console.error("Marked parsing failure:", e);
      return `<div class="p-4 bg-red-50 text-red-700 border border-red-200 rounded">Markdown Compilation Failed</div>`;
    }
  }, [preProcessedContent]);

  // Handle click delegation (link clicks, copy buttons)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // A. Intercept Copy Code Button clicks
    const copyBtn = target.closest(".copy-code-btn");
    if (copyBtn) {
      const codeId = copyBtn.getAttribute("data-code-id");
      const codeText = codeTexts.current[codeId || ""];
      if (codeText) {
        navigator.clipboard.writeText(codeText).then(() => {
          const textSpan = copyBtn.querySelector("span");
          if (textSpan) {
            textSpan.textContent = "Copied!";
            copyBtn.classList.add("text-emerald-500");
            setTimeout(() => {
              textSpan.textContent = "Copy";
              copyBtn.classList.remove("text-emerald-500");
            }, 2000);
          }
        });
      }
      return;
    }

    // B. Intercept Anchor Link click events for cross-referencing and smooth outline scrolling
    const anchor = target.closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href) {
        // Only intercept non-external links
        const isExternal = href.startsWith("http://") || 
                            href.startsWith("https://") || 
                            href.startsWith("mailto:") || 
                            href.startsWith("tel:");
                            
        if (!isExternal) {
          e.preventDefault();

          if (href.startsWith("#")) {
            // Anchor tag - scroll smooth
            const elementId = href.slice(1);
            const targetElement = document.getElementById(elementId);
            if (targetElement) {
              targetElement.scrollIntoView({ behavior: "smooth" });
            }
          } else {
            // Document link! Trigger relative cross-reference resolution
            onNavigate(href);
          }
        } else {
          // Open external link in a new tab
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        }
      }
    }
  };

  // Compile Mermaid diagrams asynchronously
  useEffect(() => {
    const containers = document.querySelectorAll(".mermaid-container");
    if (containers.length === 0) return;

    mermaid.initialize({
      startOnLoad: false,
      theme: "neutral",
      securityLevel: "loose",
      fontFamily: "Inter, sans-serif"
    });

    containers.forEach(async (container, index) => {
      const encodedCode = container.getAttribute("data-code");
      if (!encodedCode) return;

      const code = decodeURIComponent(encodedCode);
      const uniqueId = `mermaid-chart-${index}-${Math.floor(Math.random() * 100000)}`;

      // Show loader
      container.innerHTML = `
        <div class="flex items-center gap-2 text-white/40 text-xs py-3">
          <svg class="animate-spin h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Compiling diagram...
        </div>
      `;

      try {
        const { svg } = await mermaid.render(uniqueId, code);
        
        // Append rendered SVG + small hover zoom tip
        container.innerHTML = `
          <div class="w-full flex justify-end mb-1 text-[10px] text-white/30 select-none group-hover:text-indigo-400 transition-colors">
            🔍 Click to zoom
          </div>
          <div class="w-full overflow-x-auto flex justify-center py-1 bg-white p-2 rounded-lg">${svg}</div>
        `;

        // Click listener to zoom in on Mermaid diagrams in the lightbox
        const handleClick = () => {
          if (onMermaidClick) {
            onMermaidClick(code);
          }
        };
        container.addEventListener("click", handleClick);
        
        // Clean up event listener when content updates
        (container as any)._cleanupMermaid = () => {
          container.removeEventListener("click", handleClick);
        };
      } catch (err: any) {
        console.error("Mermaid Render Error:", err);
        // Clear broken element created by mermaid in document body
        const badElement = document.getElementById(uniqueId);
        if (badElement) badElement.remove();

        container.innerHTML = `
          <div class="p-4 bg-red-950/10 border border-red-900/30 rounded-xl text-red-400 font-mono text-xs w-full overflow-x-auto text-left">
            <div class="font-bold mb-1 flex items-center gap-1.5 text-red-400">
              <svg class="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Diagram Compile Error
            </div>
            <pre class="whitespace-pre-wrap">${err?.message || err || "Failed to render Mermaid syntax"}</pre>
          </div>
        `;
      }
    });

    return () => {
      containers.forEach((container) => {
        if ((container as any)._cleanupMermaid) {
          (container as any)._cleanupMermaid();
        }
      });
    };
  }, [parsedHtml, onMermaidClick]);

  return (
    <div
      onClick={handleContainerClick}
      className={`markdown-body prose max-w-none text-white/80 leading-relaxed selection:bg-indigo-500/30 selection:text-indigo-100 ${fontSizeClass}`}
      dangerouslySetInnerHTML={{ __html: parsedHtml }}
    />
  );
}
