import { create } from 'zustand'
import { produce } from 'immer'

const API = '/api'

// ─── helpers ──────────────────────────────────────────────────────────────────
export const buildDefaultContent = (schema) => {
  const content = {}
  if (schema.global) {
    content._global = {}
    Object.entries(schema.global).forEach(([k, f]) => { content._global[k] = f.default || '' })
  }
  if (schema.pages) {
    Object.entries(schema.pages).forEach(([page, fields]) => {
      content[page] = {}
      Object.entries(fields).forEach(([k, f]) => { content[page][k] = f.default || '' })
    })
  }
  return content
}

// ─── store ────────────────────────────────────────────────────────────────────
export const useStore = create((set, get) => ({

  // ── Template catalogue ─────────────────────────────────────────────────────
  templates: [],
  templatesLoading: false,
  templatesError: null,
  marketplaceFilter: 'all',   // 'all' | tag string
  marketplaceSearch: '',

  fetchTemplates: async () => {
    set({ templatesLoading: true, templatesError: null })
    try {
      const res = await fetch(`${API}/templates`)
      if (!res.ok) throw new Error('Failed to load templates')
      set({ templates: await res.json(), templatesLoading: false })
    } catch (e) {
      set({ templatesError: e.message, templatesLoading: false })
    }
  },
  setMarketplaceFilter: (f) => set({ marketplaceFilter: f }),
  setMarketplaceSearch: (s) => set({ marketplaceSearch: s }),
  getFilteredTemplates: () => {
    const { templates, marketplaceFilter, marketplaceSearch } = get()
    return templates.filter(t => {
      const matchesFilter = marketplaceFilter === 'all' || t.tags?.includes(marketplaceFilter)
      const q = marketplaceSearch.toLowerCase()
      const matchesSearch = !q || t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
      return matchesFilter && matchesSearch
    })
  },

  // ── Active project ─────────────────────────────────────────────────────────
  selectedTemplate: null,
  schema: null,
  schemaLoading: false,
  content: {},                // { _global: {}, index: {}, about: {}, ... }
  themeColor: '#4f46e5',
  seo: { title: '', description: '', keywords: '', author: '', ogImage: '' },
  pageOrder: [],              // ordered list of page keys for nav editor
  history: [],                // undo stack (array of content snapshots)
  historyIndex: -1,

  selectTemplate: async (id) => {
    set({ schemaLoading: true, selectedTemplate: id, content: {}, history: [], historyIndex: -1 })
    try {
      const res = await fetch(`${API}/templates/${id}/schema`)
      if (!res.ok) throw new Error('Failed to load schema')
      const schema = await res.json()
      const content = buildDefaultContent(schema)
      const pageOrder = Object.keys(schema.pages || {})
      set({
        schema,
        content,
        pageOrder,
        schemaLoading: false,
        currentStep: 2,
        activePage: pageOrder[0] || 'index',
        seo: {
          title: content._global?.site_name || '',
          description: '',
          keywords: '',
          author: content._global?.author_name || '',
          ogImage: ''
        },
        history: [JSON.stringify(content)],
        historyIndex: 0
      })
    } catch (e) {
      set({ schemaLoading: false })
      get().showNotification(e.message, 'error')
    }
  },

  // ── Content editing ────────────────────────────────────────────────────────
  updateContent: (page, key, value) => {
    set(produce(state => {
      if (!state.content[page]) state.content[page] = {}
      state.content[page][key] = value
    }))
    // Debounced history push handled externally
  },

  bulkSetContent: (newContent) => {
    set(produce(state => {
      // Merge rather than replace to preserve other pages
      Object.entries(newContent).forEach(([page, fields]) => {
        if (!state.content[page]) state.content[page] = {}
        Object.assign(state.content[page], fields)
      })
      // Push history snapshot
      const snap = JSON.stringify(state.content)
      state.history = state.history.slice(0, state.historyIndex + 1)
      state.history.push(snap)
      state.historyIndex = state.history.length - 1
    }))
  },

  pushHistory: () => {
    set(produce(state => {
      const snap = JSON.stringify(state.content)
      if (state.history[state.historyIndex] === snap) return
      state.history = state.history.slice(0, state.historyIndex + 1)
      state.history.push(snap)
      if (state.history.length > 50) state.history.shift()
      state.historyIndex = state.history.length - 1
    }))
  },

  undo: () => {
    set(produce(state => {
      if (state.historyIndex <= 0) return
      state.historyIndex--
      state.content = JSON.parse(state.history[state.historyIndex])
    }))
  },

  redo: () => {
    set(produce(state => {
      if (state.historyIndex >= state.history.length - 1) return
      state.historyIndex++
      state.content = JSON.parse(state.history[state.historyIndex])
    }))
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  updateThemeColor: (c) => set({ themeColor: c }),
  updateSeo: (k, v) => set(state => ({ seo: { ...state.seo, [k]: v } })),

  // ── Page order / nav editor ────────────────────────────────────────────────
  reorderPages: (newOrder) => set({ pageOrder: newOrder }),
  setPageNavLabel: (page, label) => {
    set(produce(state => {
      if (!state.schema.pages[page]) return
      if (!state.schema.pages[page].nav_label) state.schema.pages[page].nav_label = {}
      state.schema.pages[page].nav_label = label
    }))
  },

  // ── UI state ───────────────────────────────────────────────────────────────
  currentStep: 1,
  activePage: 'index',
  activeEditorTab: 'content',   // 'content' | 'builder' | 'theme' | 'seo' | 'nav'
  sidebarCollapsed: false,
  previewViewport: 'desktop',   // 'desktop' | 'tablet' | 'mobile'

  setStep: (s) => set({ currentStep: s }),
  setActivePage: (p) => set({ activePage: p }),
  setActiveEditorTab: (t) => set({ activeEditorTab: t }),
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setPreviewViewport: (v) => set({ previewViewport: v }),

  // ── AI generation ──────────────────────────────────────────────────────────
  aiGenerating: false,
  aiPrompt: '',
  lastAiSource: null,

  setAiPrompt: (p) => set({ aiPrompt: p }),

  generateAiContent: async (prompt) => {
    const { selectedTemplate, schema } = get()
    if (!selectedTemplate) return
    set({ aiGenerating: true })
    try {
      const res = await fetch(`${API}/ai/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: selectedTemplate, prompt: prompt || get().aiPrompt })
      })
      const data = await res.json()
      if (data.content) {
        get().bulkSetContent(data.content)
        set({ lastAiSource: data.source })
        get().showNotification(
          data.source === 'claude' ? '✨ AI content generated!' : '✨ Content generated (demo mode)',
          'success'
        )
      }
    } catch (e) {
      get().showNotification('AI generation failed: ' + e.message, 'error')
    } finally {
      set({ aiGenerating: false })
    }
  },

  improveField: async (page, key, currentValue, instruction) => {
    try {
      const res = await fetch(`${API}/ai/improve-text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentValue, instruction, fieldType: 'text' })
      })
      const data = await res.json()
      if (data.improved) {
        get().updateContent(page, key, data.improved)
        get().showNotification('✨ Text improved!', 'success')
      }
    } catch (e) {
      get().showNotification('Improve failed', 'error')
    }
  },

  // ── Build / download / deploy ──────────────────────────────────────────────
  generating: false,
  generateError: null,
  deployTarget: null,
  deployLoading: false,

  generateSite: async () => {
    const { selectedTemplate, content, themeColor, seo, pageOrder } = get()
    set({ generating: true, generateError: null })
    try {
      const res = await fetch(`${API}/generate-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate, content, themeColor, seo, pageOrder })
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Generation failed')
      const blob = await res.blob()
      triggerDownload(blob, `${(content._global?.site_name || selectedTemplate).toLowerCase().replace(/\s/g, '-')}-site.zip`)
      set({ generating: false, currentStep: 4 })
      get().showNotification('🎉 Site generated and downloaded!', 'success')
    } catch (e) {
      set({ generating: false, generateError: e.message })
      get().showNotification(e.message, 'error')
    }
  },

  deployTo: async (target) => {
    const { selectedTemplate, content, themeColor, seo, pageOrder } = get()
    set({ deployLoading: true, deployTarget: target })
    try {
      const endpoint = {
        netlify: `${API}/deploy/netlify`,
        vercel: `${API}/deploy/vercel`,
        'github-pages': `${API}/deploy/github-pages`
      }[target]
      if (!endpoint) throw new Error('Unknown deploy target')

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate, content, themeColor, seo, pageOrder })
      })
      if (!res.ok) throw new Error((await res.json()).error || 'Deploy export failed')
      const blob = await res.blob()
      const siteName = (content._global?.site_name || selectedTemplate).toLowerCase().replace(/\s/g, '-')
      triggerDownload(blob, `${siteName}-${target}-deploy.zip`)
      get().showNotification(`📦 ${target} deploy package ready!`, 'success')
    } catch (e) {
      get().showNotification(e.message, 'error')
    } finally {
      set({ deployLoading: false, deployTarget: null })
    }
  },

  // ── Import / export ────────────────────────────────────────────────────────
  exportConfig: () => {
    const { selectedTemplate, content, themeColor, seo, pageOrder } = get()
    const cfg = { version: 2, template: selectedTemplate, content, themeColor, seo, pageOrder, exportedAt: new Date().toISOString() }
    triggerDownload(new Blob([JSON.stringify(cfg, null, 2)], { type: 'application/json' }), 'site-config.json')
    get().showNotification('Config exported!', 'success')
  },

  importConfig: async (cfg) => {
    if (!cfg.template) return
    // Load schema if needed
    if (cfg.template !== get().selectedTemplate) {
      await get().selectTemplate(cfg.template)
    }
    set({
      content: cfg.content || {},
      themeColor: cfg.themeColor || '#4f46e5',
      seo: cfg.seo || { title: '', description: '', keywords: '', author: '', ogImage: '' },
      pageOrder: cfg.pageOrder || get().pageOrder,
    })
    get().showNotification('Config imported!', 'success')
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notification: null,
  showNotification: (msg, type = 'success') => {
    set({ notification: { msg, type, id: Date.now() } })
    setTimeout(() => set(s => s.notification?.msg === msg ? { notification: null } : {}), 3500)
  },

  // ── Reset ──────────────────────────────────────────────────────────────────
  reset: () => set({
    selectedTemplate: null, schema: null, content: {}, themeColor: '#4f46e5',
    currentStep: 1, activePage: 'index', pageOrder: [], history: [], historyIndex: -1,
    seo: { title: '', description: '', keywords: '', author: '', ogImage: '' },
    aiPrompt: '', marketplaceFilter: 'all', marketplaceSearch: '', activeEditorTab: 'content'
  }),
}))

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

