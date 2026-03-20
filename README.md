# SiteForge v2 — Production Static Site Generator

A fully-featured, production-quality monorepo application for generating, editing, and deploying static websites. Features an AI content generator, drag-and-drop page navigation editor, live multi-viewport preview, and one-click platform-ready exports for Netlify, Vercel, and GitHub Pages.

---

## ✨ What's New in v2

| Feature | Detail |
|---------|--------|
| **Template Marketplace** | Search, tag-filter, quick-preview modal, star ratings |
| **AI Content Generator** | One prompt fills all fields. Claude API or smart demo fallback |
| **Per-field AI Improve** | Hover any field → "Improve" button rewrites it |
| **Drag-and-Drop Nav Editor** | Reorder pages, set custom nav labels |
| **Undo/Redo** | 50-snapshot history. Ctrl+Z / Ctrl+Shift+Z globally |
| **Live Mini-Preview** | Scaled iframe in editor sidebar, auto-refreshes |
| **Viewport Switcher** | Desktop / Tablet (768px) / Mobile (390px) |
| **SEO Panel** | Google SERP preview + char-count bars + Open Graph |
| **Theme Panel** | 12 colour presets + live mini-mockup + custom hex |
| **Netlify Export** | netlify.toml + _redirects + _headers (security headers) |
| **Vercel Export** | vercel.json with routes + cache headers |
| **GitHub Pages Export** | .nojekyll + step-by-step deploy README |

---

## 🚀 Quick Start

```bash
cd siteforge
npm run install:all   # installs root + client + server deps
npm run dev           # starts both servers concurrently
```

- **Frontend** → http://localhost:5173  
- **Backend**  → http://localhost:3001

### Enable AI (optional)

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > server/.env
```

Without this, AI generation uses smart demo content — the app works fully offline.

---

## 📁 Project Structure

```
siteforge/
├── client/src/
│   ├── store/useStore.js            # Zustand + Immer state
│   ├── components/
│   │   ├── Layout.jsx               # Navbar, stepper, undo/redo, toasts
│   │   └── editor/
│   │       ├── AiPanel.jsx          # AI content generation slide-over
│   │       ├── ContentEditor.jsx    # Form fields with per-field AI Improve
│   │       ├── PageNavEditor.jsx    # dnd-kit drag-and-drop page reorder
│   │       ├── ThemePanel.jsx       # Color picker + presets + live preview
│   │       └── SeoPanel.jsx         # Meta fields + SERP preview + OG
│   └── pages/
│       ├── Marketplace.jsx          # Template browser
│       ├── EditorShell.jsx          # 3-panel editor
│       ├── PreviewPage.jsx          # Full-screen preview
│       └── ExportPage.jsx           # Export & deploy hub
├── server/src/routes/
│   ├── templates.js                 # GET /api/templates
│   ├── generate.js                  # POST /api/generate-site + preview-page
│   ├── ai.js                        # POST /api/ai/generate-content + improve-text
│   └── deploy.js                    # POST /api/deploy/{netlify,vercel,github-pages}
└── templates/
    ├── business-template/
    ├── portfolio-template/
    └── blog-template/
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last change |
| `Ctrl+Shift+Z` or `Ctrl+Y` | Redo |
| `Ctrl+Enter` (AI prompt box) | Generate content |

---

## 🎨 Adding Templates

1. Create `/templates/my-template/`
2. Add `schema.json` with `meta`, `global`, and `pages` keys
3. Add HTML pages using `{{variable}}` (Handlebars) — use `{{nav_links}}` for dynamic nav
4. Add `assets/css/style.css` with `--primary: #4f46e5;` in `:root` for theme injection
5. Template appears automatically in the Marketplace

## 🌐 API Reference

| Method | Endpoint |
|--------|----------|
| GET | `/api/templates` |
| GET | `/api/templates/:id/schema` |
| POST | `/api/preview-page` |
| POST | `/api/generate-site` |
| POST | `/api/ai/generate-content` |
| POST | `/api/ai/improve-text` |
| POST | `/api/deploy/netlify` |
| POST | `/api/deploy/vercel` |
| POST | `/api/deploy/github-pages` |
