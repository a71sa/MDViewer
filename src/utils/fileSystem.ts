/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualFile, VirtualFolder } from "../types";

/**
 * Recursively read files from a FileSystemDirectoryHandle (Modern File System Access API)
 */
export async function readDirectoryRecursively(
  dirHandle: any,
  currentPath: string = ""
): Promise<VirtualFile[]> {
  const files: VirtualFile[] = [];
  
  for await (const entry of dirHandle.values()) {
    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
    
    if (entry.kind === "file") {
      // Support markdown files and standard readable text/code files
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
          console.warn(`Failed to get file handle metadata for ${entryPath}:`, e);
          // Fallback with just the handle
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
        console.error(`Failed to read directory ${entryPath}:`, e);
      }
    }
  }
  
  return files;
}

/**
 * Parse flat file list from standard <input type="file" webkitdirectory>
 */
export function parseUploadedFiles(fileList: FileList): VirtualFile[] {
  const files: VirtualFile[] = [];
  
  for (let i = 0; i < fileList.length; i++) {
    const fileObj = fileList[i];
    // Remove leading slash if any
    let relativePath = fileObj.webkitRelativePath || fileObj.name;
    
    const ext = fileObj.name.split(".").pop()?.toLowerCase() || "";
    const isReadable = [
      "md", "markdown", "mdown", "mkdn", "txt", "text", 
      "json", "js", "ts", "tsx", "html", "css", "yaml", "yml"
    ].includes(ext);
    
    if (isReadable) {
      files.push({
        path: relativePath,
        name: fileObj.name,
        size: fileObj.size,
        lastModified: fileObj.lastModified,
        fileObject: fileObj,
      });
    }
  }
  
  return files;
}

/**
 * Builds a nested VirtualFolder tree from a flat list of VirtualFile items
 */
export function buildFolderTree(files: VirtualFile[]): VirtualFolder {
  const root: VirtualFolder = {
    name: "Root",
    path: "",
    files: [],
    subfolders: {},
    isOpen: true,
  };

  for (const file of files) {
    const parts = file.path.split("/");
    let currentFolder = root;
    
    // Go down the folder structure, except for the file itself (which is the last part)
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      if (!currentFolder.subfolders[folderName]) {
        currentFolder.subfolders[folderName] = {
          name: folderName,
          path: parts.slice(0, i + 1).join("/"),
          files: [],
          subfolders: {},
          isOpen: false,
        };
      }
      currentFolder = currentFolder.subfolders[folderName];
    }
    
    currentFolder.files.push(file);
  }

  // Sort files and subfolders alphabetically
  function sortTree(folder: VirtualFolder) {
    folder.files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    const sortedSubfolders: { [name: string]: VirtualFolder } = {};
    const sortedNames = Object.keys(folder.subfolders).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    for (const name of sortedNames) {
      sortedSubfolders[name] = folder.subfolders[name];
      sortTree(sortedSubfolders[name]);
    }
    folder.subfolders = sortedSubfolders;
  }
  
  sortTree(root);
  return root;
}

/**
 * Read the content of a virtual file
 */
export async function readFileText(file: VirtualFile): Promise<string> {
  if (file.handle) {
    const f = await file.handle.getFile();
    return await f.text();
  } else if (file.fileObject) {
    return await file.fileObject.text();
  } else {
    return file.content || "";
  }
}

/**
 * Resolves a relative path (e.g. "../sibling.md" or "./child.md") against a current file path
 */
export function resolveRelativePath(currentPath: string, relativePath: string): string {
  // Decode URL components if the link was URL-encoded
  let target = decodeURIComponent(relativePath);
  
  // Strip off query parameters or hash anchors from the file path
  target = target.split("#")[0].split("?")[0];
  
  if (target.startsWith("/")) {
    return target.slice(1); // Treat absolute paths as relative to root
  }
  
  const currentParts = currentPath.split("/");
  currentParts.pop(); // Remove current file name to get directory
  
  const relativeParts = target.split("/");
  for (const part of relativeParts) {
    if (part === "" || part === ".") {
      continue;
    }
    if (part === "..") {
      currentParts.pop();
    } else {
      currentParts.push(part);
    }
  }
  
  return currentParts.join("/");
}
