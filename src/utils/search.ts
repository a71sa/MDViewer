/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualFile, SearchResult } from "../types";
import { readFileText } from "./fileSystem";

/**
 * Searches across a list of VirtualFiles for a search query.
 * Progressively loads and caches contents of files to build a full-text search index.
 */
export async function searchFiles(
  files: VirtualFile[],
  query: string,
  onProgress?: (indexedCount: number, total: number) => void
): Promise<SearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  
  const results: SearchResult[] = [];
  const lowerQuery = trimmedQuery.toLowerCase();

  let count = 0;
  for (const file of files) {
    count++;
    if (onProgress && count % 5 === 0) {
      onProgress(count, files.length);
    }

    try {
      // Lazy load content if not cached
      let text = file.content;
      if (text === undefined) {
        text = await readFileText(file);
        file.content = text; // Cache it in the file structure
      }

      const fileLowerName = file.name.toLowerCase();
      const fileLowerPath = file.path.toLowerCase();
      
      const isNameMatch = fileLowerName.includes(lowerQuery);
      const isPathMatch = fileLowerPath.includes(lowerQuery);
      
      const lines = text.split("\n");
      const matches: SearchResult["matches"] = [];

      for (let i = 0; i < lines.length; i++) {
        const lineText = lines[i];
        const index = lineText.toLowerCase().indexOf(lowerQuery);
        if (index !== -1) {
          // Limit length of search preview line
          let displayLine = lineText.trim();
          if (displayLine.length > 100) {
            const start = Math.max(0, index - 30);
            displayLine = (start > 0 ? "..." : "") + displayLine.slice(start, start + 100) + (start + 100 < lineText.length ? "..." : "");
          }
          matches.push({
            line: i + 1,
            text: displayLine,
            index: displayLine.toLowerCase().indexOf(lowerQuery),
          });
          
          // Max matches per file to keep UI responsive and search fast
          if (matches.length >= 10) break;
        }
      }

      if (matches.length > 0 || isNameMatch || isPathMatch) {
        // Scoring formula: name match is highest, then path match, then body matches
        let score = 0;
        if (isNameMatch) score += 200;
        if (isPathMatch) score += 50;
        score += matches.length * 10;

        results.push({
          file,
          matches,
          score,
        });
      }
    } catch (e) {
      console.warn(`Search indexing failed for file ${file.path}:`, e);
    }
  }

  if (onProgress) {
    onProgress(files.length, files.length);
  }

  return results.sort((a, b) => b.score - a.score);
}
