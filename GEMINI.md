# Interactive ML & Agent Design Workspace

This workspace is a specialized environment combining **Machine Learning education** with **high-fidelity AI-driven design capabilities**. It is optimized for use with AI agents to create interactive prototypes, animations, and high-quality UI/UX designs while referencing core ML concepts.

## 🧠 Machine Learning Context
The root of the workspace contains comprehensive study materials for Machine Learning.
- **`materials.md`**: Detailed notes covering Decision Trees, Ensemble Learning, SVM, Clustering, and Dimensionality Reduction. This serves as a foundational knowledge base for any ML-related design or research tasks.

## 🛠️ AI Agent Skills
The workspace is powered by a suite of "Agent Skills" located in `.agents/skills/`. These skills provide the AI agent with senior-level expertise in various design disciplines.

### Primary Skills
- **`huashu-design`**: A high-fidelity prototyping and animation engine. It can generate:
  - Interactive iOS/Android prototypes (using `assets/ios_frame.jsx`).
  - Motion design and product launch animations (exported as MP4/GIF).
  - HTML-based slide decks (exported as editable PPTX or PDF).
  - Infographics and data visualizations.
- **`impeccable`**: A Senior Frontend Designer skill focused on production-grade code, visual hierarchy, and "anti-AI slop" principles. It handles UI/UX audits, critiques, and refinement.

### Specialized Taste Skills
A collection of "Taste Skills" (tracked in `skills-lock.json`) provides specific aesthetic directions:
- `minimalist-ui`, `industrial-brutalist-ui`, `high-end-visual-design`, `gpt-taste`, `stitch-design-taste`.
- `image-to-code`, `imagegen-frontend-web/mobile`: Skills for generating and implementing design concepts.

## 🚀 Key Workflows

### 1. Design & Prototyping
When tasked with design, always **activate the relevant skill** (e.g., `activate_skill("huashu-design")`).
- **Fact Verification First**: Always verify product specs using `google_web_search` before making design assumptions.
- **Core Asset Protocol**: For branded work, search and download official logos and product shots into `assets/<brand>-brand/`.
- **Junior Designer Mode**: Present assumptions and placeholders (using `design_canvas.jsx`) to the user before deep implementation.

### 2. Rendering & Export
The workspace includes a toolchain for exporting HTML-based designs:
- **Video**: `scripts/render-video.js` (requires Node.js & Playwright).
- **PDF/PPTX**: `scripts/export_deck_pdf.mjs` and `scripts/export_deck_pptx.mjs`.
- **Validation**: `scripts/verify.py` for automated click-testing.

## 📁 Directory Structure
- **`.agents/skills/`**: Source code, assets, and references for all installed skills.
- **`materials.md`**: Core ML study notes.
- **`skills-lock.json`**: Registry of installed skills and their sources.

## ⚠️ Important Note
This workspace relies on several system dependencies for its full toolchain:
- **Node.js** (for running `.mjs` and `.js` scripts).
- **Playwright** (for screenshots and PDF/Video rendering).
- **ffmpeg** (for video conversion and audio mixing).
- **Babel** (often used for inline React in HTML prototypes).
