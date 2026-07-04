/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TocHeading } from "../types";

/**
 * Parses Markdown headers recursively to generate a Table of Contents list.
 * Safely ignores headers inside code blocks.
 */
export function getTableOfContents(text: string): TocHeading[] {
  if (!text) return [];
  const headings: TocHeading[] = [];
  const lines = text.split("\n");
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Toggle code block safety
    if (trimmed.startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    
    if (inCodeBlock) continue;

    // Matches lines starting with 1 to 6 hash signs
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const headingText = match[2].replace(/[#`_*]/g, "").trim(); // strip basic markdown noise
      
      // Generate clean ID matching our MarkdownRenderer anchor links
      const id = headingText
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
        
      headings.push({ id, text: headingText, level });
    }
  }
  
  return headings;
}
