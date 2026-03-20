import { useEffect, useRef, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import ContentEditor from '../components/editor/ContentEditor'
import ThemePanel from '../components/editor/ThemePanel'
import SeoPanel from '../components/editor/SeoPanel'
import PageNavEditor from '../components/editor/PageNavEditor'
import AiPanel from '../components/editor/AiPanel'
import {
  Eye, Download, Globe, Palette, Search, Hash, Wand2,
  Upload, FileJson, ChevronRight, Loader2, Sparkles, X,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react'

// ─── Sidebar tab button ──────────────────────────────────────────────────────
function TabBtn({ icon: Icon, label, active, onClick, badge }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative
        ${active
          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/25'
          : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]'}`}>
      <Icon size={14} className={active ? 'text-indigo-400' : 'text-gray-600 group-hover:text-gray-400'} />
      <span className="truncate">{label}</span>
      {badge && (
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-bold"
          style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontSize: '10px' }}>
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── Page tab in sidebar ──────────────────────────────────────────────────────
function PageTab({ page, active, onClick }) {
  const label = page === '_global' ? 'Global' : page.charAt(0).toUpperCase() + page.slice(1)
  return (
    <button onClick={() => onClick(page)}
      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all mb-0.5
        ${active
          ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
          : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
      {label}
    </button>
  )
}

// ─── Inline mini-preview pane ─────────────────────────────────────────────────
function InlinePreview({ template, page, content, themeColor, seo, pageOrder, onNavigate }) {
  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!template || !page || page.startsWith('_')) return
    setLoading(true)
    try {
      const res = await fetch('/api/preview-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template, page, content, themeColor, seo, pageOrder })
      })
      if (res.ok) setHtml(await res.text())
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [template, page, themeColor, seo])

  // Debounce on content changes
  useEffect(() => {
    const t = setTimeout(load, 800)
    return () => clearTimeout(t)
  }, [content, themeColor, seo])

  useEffect(() => { load() }, [page])

  // Listen for postMessage nav events from mini-preview (pointer-events: none
  // blocks clicks, but keep this in sync if ever enabled)
  useEffect(() => {
    const handler = (e) => {
      if (e.data?.type === 'PREVIEW_NAVIGATE' && onNavigate) onNavigate(e.data.page)
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onNavigate])

  if (!template || !page || page.startsWith('_')) {
    return (
      <div className="h-full flex items-center justify-center text-gray-700 text-sm">
        Select a page to preview
      </div>
    )
  }

  return (
    <div className="relative h-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center"
          style={{ background: 'rgba(8,8,16,0.6)' }}>
          <Loader2 size={20} className="animate-spin text-indigo-500" />
        </div>
      )}
      {html ? (
        <iframe
          srcDoc={html}
          title="mini-preview"
          className="w-full h-full border-0"
          style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.67%', height: '166.67%', pointerEvents: 'none' }}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div className="h-full flex items-center justify-center">
          <Loader2 size={20} className="animate-spin text-indigo-500" />
        </div>
      )}
    </div>
  )
}

// ─── Main EditorShell ─────────────────────────────────────────────────────────
export default function EditorShell() {
  const navigate = useNavigate()
  const fileRef = useRef()

  const {
    schema, content, selectedTemplate, themeColor, seo, pageOrder,
    activePage, setActivePage, activeEditorTab, setActiveEditorTab,
    sidebarCollapsed, setSidebarCollapsed,
    exportConfig, importConfig, generateSite, generating, generateError,
    showNotification
  } = useStore()

  useEffect(() => {
    if (!selectedTemplate || !schema) navigate('/')
  }, [])

  const [showAi, setShowAi] = useState(false)

  if (!schema) return null

  const pages = [...pageOrder, ...(Object.keys(schema.pages || {}).filter(p => !pageOrder.includes(p)))]

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      try {
        await importConfig(JSON.parse(ev.target.result))
      } catch { showNotification('Invalid config file', 'error') }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const editorTabs = [
    { id: 'content', icon: ChevronRight, label: 'Content' },
    { id: 'nav', icon: Hash, label: 'Navigation' },
    { id: 'theme', icon: Palette, label: 'Theme' },
    { id: 'seo', icon: Search, label: 'SEO' },
  ]

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden" style={{ background: '#080810' }}>

      {/* ── LEFT SIDEBAR ── */}
      <aside
        className="flex-shrink-0 flex flex-col border-r border-white/[0.05] transition-all duration-200"
        style={{
          width: sidebarCollapsed ? '48px' : '220px',
          background: 'rgba(255,255,255,0.015)',
        }}>

        {/* Collapse toggle */}
        <div className={`flex ${sidebarCollapsed ? 'justify-center' : 'justify-end'} p-2 border-b border-white/[0.05]`}>
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-gray-700 hover:text-gray-400 hover:bg-white/[0.06] transition-colors">
            {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Tab switcher */}
            <div className="p-2 space-y-0.5 border-b border-white/[0.05]">
              {editorTabs.map(t => (
                <TabBtn key={t.id} icon={t.icon} label={t.label} active={activeEditorTab === t.id}
                  onClick={() => setActiveEditorTab(t.id)} />
              ))}
            </div>

            {/* Page list (only on content tab) */}
            {activeEditorTab === 'content' && (
              <div className="p-2 border-b border-white/[0.05] flex-shrink-0">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-widest px-1 mb-1.5">Pages</p>
                {pages.map(p => (
                  <PageTab key={p} page={p} active={activePage === p}
                    onClick={(pg) => { setActivePage(pg); setActiveEditorTab('content') }} />
                ))}
                <PageTab page="_global" active={activePage === '_global'} onClick={setActivePage} />
              </div>
            )}

            {/* AI generate button */}
            <div className="p-2 border-b border-white/[0.05]">
              <button onClick={() => setShowAi(true)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-indigo-300 hover:text-indigo-200"
                style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)' }}>
                <Sparkles size={12} className="text-indigo-400" />
                AI Fill Content
              </button>
            </div>

            {/* Import/export */}
            <div className="p-2 mt-auto space-y-0.5">
              <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
              <button onClick={() => fileRef.current.click()}
                className="w-full flex items-center gap-2 text-xs text-gray-700 hover:text-gray-400 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                <Upload size={11} /> Import Config
              </button>
              <button onClick={exportConfig}
                className="w-full flex items-center gap-2 text-xs text-gray-700 hover:text-gray-400 px-2 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors">
                <FileJson size={11} /> Export Config
              </button>
            </div>
          </>
        )}
      </aside>

      {/* ── MAIN EDITOR PANEL ── */}
      <div className="flex-1 min-w-0 flex overflow-hidden">

        {/* Editor scroll area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {activeEditorTab === 'content' && <ContentEditor activePage={activePage} />}
          {activeEditorTab === 'nav'     && <PageNavEditor activePage={activePage} onPageSelect={p => { setActivePage(p); setActiveEditorTab('content') }} />}
          {activeEditorTab === 'theme'   && <ThemePanel />}
          {activeEditorTab === 'seo'     && <SeoPanel />}
        </div>

        {/* ── RIGHT MINI-PREVIEW ── */}
        <div className="w-72 xl:w-80 flex-shrink-0 border-l border-white/[0.05] flex flex-col"
          style={{ background: 'rgba(255,255,255,0.01)' }}>

          {/* Preview header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] flex-shrink-0">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Live Preview</span>
            <button onClick={() => navigate('/preview')}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Full preview <Eye size={11} />
            </button>
          </div>

          {/* Scaled iframe */}
          <div className="flex-1 overflow-hidden relative">
            <InlinePreview
              template={selectedTemplate}
              page={activePage}
              content={content}
              themeColor={themeColor}
              seo={seo}
              pageOrder={pageOrder}
              onNavigate={(pg) => { setActivePage(pg); setActiveEditorTab('content') }}
            />
          </div>

          {/* Actions footer */}
          <div className="p-3 border-t border-white/[0.05] space-y-2 flex-shrink-0">
            <button onClick={() => navigate('/preview')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:bg-white/[0.1]"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Eye size={13} /> Full Preview
            </button>
            <button onClick={() => navigate('/export')}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 4px 16px rgba(79,70,229,0.35)' }}>
              <Download size={13} />
              Export Site
            </button>
          </div>
        </div>
      </div>

      {/* ── AI PANEL SLIDE-OVER ── */}
      {showAi && (
        <div className="fixed inset-0 z-[100] flex" onClick={() => setShowAi(false)}>
          <div className="flex-1" />
          <div className="w-96 h-full flex flex-col shadow-2xl"
            style={{ background: '#0f0f1c', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <span className="text-sm font-bold text-white">AI Content Generator</span>
              <button onClick={() => setShowAi(false)}
                className="p-1.5 rounded-lg text-gray-600 hover:text-white hover:bg-white/[0.06] transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AiPanel onClose={() => setShowAi(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
