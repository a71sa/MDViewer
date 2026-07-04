/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VirtualFile } from "../types";

export const SAMPLE_DOCUMENTS: VirtualFile[] = [
  {
    path: "Welcome.md",
    name: "Welcome.md",
    size: 2150,
    lastModified: Date.now() - 3600000 * 2, // 2 hours ago
    content: `# 📖 Welcome to MD Workspace!

Hello! This is a highly polished, desktop-grade **Markdown Document Viewer** built in React and Tailwind. It operates entirely client-side, respecting your privacy while offering robust features for reading and organizing documentation.

---

## 🚀 Core Workspace Capabilities

1. **Local Directory Browsing**: Click **"Open Local Folder"** in the sidebar to load an entire local directory. Your folders and subdirectories are reconstructed into an interactive workspace instantly.
2. **Cross-Referencing**: Links between local documents like \`[Math Proof](./Math_Proof.md)\` resolve dynamically. Clicking them navigates the workspace, updating the Back/Forward history stack.
3. **Full-Text Search**: Search keywords across all files. Clicking snippets jumps to the file immediately.
4. **Interactive Diagrams**: Full support for rich Mermaid diagrams. Hover and click any diagram to open the interactive zoom/pan canvas lightbox!
5. **Typeset Math (LaTeX)**: Typeset inline equations (e.g., $e^{i\\pi} + 1 = 0$) or block equations with professional rendering.

---

## 📂 Sample Documentation Suite

To test the cross-referencing and advanced parsing systems immediately, try clicking any of these local files below:

*   📊 **[Interactive Diagrams & Mermaid](./Diagram_Sandbox.md)**: Flowcharts, sequence diagrams, state models, and custom designs.
*   📐 **[LaTeX Mathematical Typesetting](./Math_Proof.md)**: Multi-line matrices, equations, integrals, and formulas.
*   🛠️ **[Deep_Nested/Features.md](./Deep_Nested/Features.md)**: Checklist task managers, beautiful responsive tables, and back-relative link testing (\`../Welcome.md\`).

---

## 📝 Document Checklist
- [x] Create highly modular component files
- [x] Configure synchronous KaTeX formula parser
- [x] Add delegated link tracking for relative file navigations
- [x] Style paper sheet layouts with zoom and typography resizing
- [ ] Connect your own local documentation folders!

*Tip: Use the **A / A+** typography scaling buttons in the utility bar to adjust text sizes for comfortable reading.*
`
  },
  {
    path: "Diagram_Sandbox.md",
    name: "Diagram_Sandbox.md",
    size: 1980,
    lastModified: Date.now() - 3600000, // 1 hour ago
    content: `# 📊 Interactive Diagrams Sandbox

This file demonstrates our high-performance **Mermaid.js integration**. Code fences marked with \`mermaid\` are rendered into responsive SVGs.

**💡 Pro-Tip:** Click on any diagram to open the **Immersive Canvas Lightbox**. In the lightbox, you can pan (drag) and zoom (scroll or use toolbar buttons) to examine dense charts.

---

## 1. Directory Integration Flow (Flowchart)

Here is a flowchart representing how file selections and relative paths are resolved inside the workspace:

\`\`\`mermaid
graph TD
    A[User clicks relative link] --> B{Starts with # ?}
    B -- Yes --> C[Scroll smoothly to element ID]
    B -- No --> D[Resolve absolute path relative to current folder]
    D --> E{File exists in Workspace?}
    E -- Yes --> F[Update History State & Load content]
    E -- No --> G[Display helpful File Not Found toast]
    
    style A fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    style F fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d
    style G fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d
\`\`\`

---

## 2. Document Navigation History (Sequence Diagram)

This sequence diagram details how back/forward stack traversal operates client-side:

\`\`\`mermaid
sequenceDiagram
    autonumber
    actor User
    participant Sidebar
    participant MainPane
    participant HistoryEngine
    
    User->>MainPane: Click link ./Math_Proof.md
    MainPane->>HistoryEngine: Push current file to Back stack
    HistoryEngine->>HistoryEngine: Clear Forward stack
    MainPane->>MainPane: Load and Parse Math_Proof.md
    User->>MainPane: Click "Go Back" button
    MainPane->>HistoryEngine: Pop Back stack
    HistoryEngine->>MainPane: Load Welcome.md
    HistoryEngine->>HistoryEngine: Push Welcome.md to Forward stack
\`\`\`

---

## 3. Product Release Roadmap (Gantt Chart)

\`\`\`mermaid
gantt
    title Markdown Workspace Release Timeline
    dateFormat  YYYY-MM-DD
    section Core Infrastructure
    Parser Architecture        :active, des1, 2026-07-01, 3d
    File System Bridging       :des2, 2026-07-03, 3d
    section Advanced Features
    Full-Text Search Engine    :des3, 2026-07-05, 4d
    Mermaid & KaTeX Pipelines  :des4, 2026-07-08, 4d
    section Review
    Usability Testing          :des5, 2026-07-12, 3d
\`\`\`

---

👈 **[Return to Welcome Page](./Welcome.md)**
`
  },
  {
    path: "Math_Proof.md",
    name: "Math_Proof.md",
    size: 1540,
    lastModified: Date.now() - 1800000, // 30 minutes ago
    content: `# 📐 LaTeX Mathematical Typesetting

This document demonstrates our typesetting system. We compile mathematics using **KaTeX**, supporting inline equations wrapped in single dollar signs \`$...$\` and block equations wrapped in double dollar signs \`$$\n...\n$$\`.

---

## 1. Classical Physics & Math Identifiers

The famous **Euler's Identity** links five fundamental mathematical constants beautifully:

$$e^{i\\pi} + 1 = 0$$

Where:
*   $e$ is Euler's number, the base of natural logarithms.
*   $i$ is the imaginary unit, satisfying $i^2 = -1$.
*   $\\pi$ is the ratio of a circle's circumference to its diameter.

Another classic is the **Quadratic Formula** used to solve $ax^2 + bx + c = 0$:

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

---

## 2. Advanced Calculus & Probability Distributions

The **Gaussian (Normal) Distribution** density function is written as:

$$f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$$

An elegant definite integral representing a continuous probability volume:

$$\\int_{-\\infty}^{\\infty} e^{-x^2} \\, dx = \\sqrt{\\pi}$$

---

## 3. Matrices & Linear Transformations

We can write matrices to describe coordinate rotations in 3D space:

$$R_z(\\theta) = \\begin{pmatrix}
\\cos\\theta & -\\sin\\theta & 0 \\\\
\\sin\\theta & \\cos\\theta & 0 \\\\
0 & 0 & 1
\\end{pmatrix}$$

By integrating these rendering tools, technical portfolios, research summaries, and engineering wikis can be studied on a single screen.

---

👈 **[Return to Welcome Page](./Welcome.md)**
`
  },
  {
    path: "Deep_Nested/Features.md",
    name: "Features.md",
    size: 1850,
    lastModified: Date.now() - 600000, // 10 minutes ago
    content: `# 🛠️ Rich Features & Nested Directory Test

This file resides inside a subfolder (\`Deep_Nested/Features.md\`). We use it to demonstrate how our relative link parser resolves parent-directory traversals (e.g. using \`../Welcome.md\`).

---

## 1. Responsive Data Tables

Our Markdown renderer automatically overrides and formats standard GFM tables into sleek, bordered, responsive lists:

| Extension | Purpose | Feature Highlight | Active |
| :--- | :--- | :--- | :---: |
| \`mermaid\` | Diagramming | Zoomable interactive SVG canvas | Yes |
| \`katex\` | Mathematics | Standard typesetting on the fly | Yes |
| \`marked\` | Engine | Lightning-fast HTML parsing | Yes |
| \`lucide\` | Aesthetics | Smooth, lightweight vector icons | Yes |

---

## 2. Quote Styles & Highlights

> "Simplicity is the ultimate sophistication. By focusing on typography, layout spacing, and clear interactive pathways, we turn standard text folders into beautiful, readable knowledge graphs."
> — *Design Guidelines*

---

## 3. Formatting Code Snippets

Here is a snippet of TypeScript showcasing file tree construction from flat paths:

\`\`\`typescript
export function buildFolderTree(files: VirtualFile[]): VirtualFolder {
  const root: VirtualFolder = { name: "Root", path: "", files: [], subfolders: {} };
  
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const folderName = parts[i];
      if (!current.subfolders[folderName]) {
        current.subfolders[folderName] = { name: folderName, path: "", files: [], subfolders: {} };
      }
      current = current.subfolders[folderName];
    }
    current.files.push(file);
  }
  return root;
}
\`\`\`

---

## 👈 Nested Relative Navigation Test

Click this relative parent-level reference:
*   🏠 **[Go Up to Welcome Page (../Welcome.md)](../Welcome.md)**
`
  }
];
