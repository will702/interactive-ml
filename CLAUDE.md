# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

Build an **interactive, minimalist study website for machine learning** — covering Sessions 15–22 from BINUS University (Decision Trees, Ensemble Learning, SVM, Clustering, Dimensionality Reduction). The site is a personal study tool: clean, fast, and rich in interactive visualizations.

## Source Material

`materials.md` — the canonical ML content. All algorithms, definitions, tables, and comparisons live here. Derive all site content from this file; do not invent or paraphrase beyond what it contains.

## Design Philosophy

- Minimalist first. Whitespace, typography, and hierarchy over decoration.
- Interactive where it adds understanding (not novelty) — e.g., animated decision tree splits, draggable SVM margin, live k-means convergence.
- No frameworks unless justified. Prefer vanilla HTML/CSS/JS for static content; use React only if component complexity demands it.
- Activate the `minimalist-ui` skill when making visual/layout decisions.
- Activate the `impeccable` skill for UI audits and "anti-AI slop" critiques before finalizing any page.

## Available Skills (`.agents/skills/`)

| Skill | When to use |
|---|---|
| `huashu-design` | Prototyping, animations, interactive visualizations, slide decks |
| `impeccable` | UI audit, visual hierarchy critique, production-grade polish |
| `minimalist-ui` | Aesthetic direction for minimalist layouts |
| `design-taste-frontend` | General frontend design taste |
| `image-to-code` | Converting design references to code |

Skills are registered in `skills-lock.json`. Check there for skill paths.

## Toolchain

Rendering/export scripts (when needed):
- **Video**: `scripts/render-video.js` — requires Node.js + Playwright
- **PDF**: `scripts/export_deck_pdf.mjs`
- **PPTX**: `scripts/export_deck_pptx.mjs`
- **Validation**: `scripts/verify.py` — automated click-testing

System deps: Node.js, Playwright, ffmpeg, Babel (inline React in HTML prototypes).

## Dev Commands

No build system yet — add commands here as the project is scaffolded. Start with `npx serve .` or `python3 -m http.server` for local preview.

## Content Coverage

Sessions in `materials.md`:
- **15–16**: Decision Tree, Bagging, Boosting (AdaBoost, Gradient Boosting), Random Forest, Stacking
- **17–18**: SVM — Maximal Margin Classifier, Support Vector Classifier, Kernel Trick (Linear, Poly, RBF, Sigmoid)
- **19–20**: Clustering — K-Means (Elbow/Silhouette), Hierarchical (Agglomerative, linkage types), DBSCAN
- **21–22**: Dimensionality Reduction — PCA, LDA, t-SNE; comparison table included
