import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Monitor, Tablet, Smartphone, RefreshCw, ChevronLeft,
  Download, Loader2, ZoomIn, ZoomOut, ExternalLink
} from 'lucide-react'

const VIEWPORTS = [
  { id: 'desktop',  icon: Monitor,     label: 'Desktop', w: null,    px: null },
  { id: 'tablet',   icon: Tablet,      label: 'Tablet',  w: '768px', px: 768  },
  { id: 'mobile',   icon: Smartphone,  label: 'Mobile',  w: '390px', px: 390  },
]

export default function PreviewPage() {
  const navigate  = useNavigate()
  const {
    schema, selectedTemplate, content, themeColor, seo, pageOrder,
    activePage, setActivePage, showNotification
  } = useStore()

  const [viewport,  setViewport]  = useState('desktop')
  const [zoom,      setZoom]      = useState(1.0)
  const [html,      setHtml]      = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [iframeH,   setIframeH]   = useState(700)
  const iframeRef = useRef()

  useEffect(() => { if (!selectedTemplate || !schema) navigate('/') }, [])

  const pages = schema
    ? [...new Set([...pageOrder, ...Object.keys(schema.pages || {})])]
    : []

  const vp = VIEWPORTS.find(v => v.id === viewport) ?? VIEWPORTS[0]

  // ── Load preview HTML from server ──────────────────────────────────────────
  const loadPreview = useCallback(async (pageOverride) => {
    const targetPage = pageOverride ?? activePage
    if (!selectedTemplate || !targetPage) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/preview-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: selectedTemplate,
          page: targetPage,
          content, themeColor, seo, pageOrder
        })
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      setHtml(await res.text())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [selectedTemplate, activePage, themeColor, seo, pageOrder])

  // Debounce content / theme / seo changes
  useEffect(() => {
    const t = setTimeout(() => loadPreview(), 700)
    return () => clearTimeout(t)
  }, [content, themeColor, seo])

  // Immediate on page switch
  useEffect(() => { loadPreview() }, [activePage])

  // ── Listen for postMessage from the iframe ──────────────────────────────────
  // The server injects an interceptor script that fires:
  //   { type: 'PREVIEW_NAVIGATE', page: 'about' }   when a nav link is clicked
  //   { type: 'PREVIEW_LOADED',   height: 1240 }     when the page fully loads
  useEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return
      if (e.data.type === 'PREVIEW_NAVIGATE') {
        const target = e.data.page
        if (pages.includes(target)) {
          setActivePage(target)          // updates the active tab + triggers loadPreview
        } else {
          showNotification(`Page "${target}" not found in this template`, 'error')
        }
      }
      if (e.data.type === 'PREVIEW_LOADED') {
        if (e.data.height) setIframeH(Math.max(600, e.data.height + 40))
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [pages])

  // ── Zoom helpers ────────────────────────────────────────────────────────────
  const canZoomOut = zoom > 0.4
  const canZoomIn  = zoom < 1.0
  const bumpZoom   = (delta) => setZoom(z => Math.round(Math.min(1, Math.max(0.35, z + delta)) * 100) / 100)

  return (
    <div className="flex flex-col h-[calc(100vh-52px)]" style={{ background: '#05050d' }}>

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 px-4 border-b border-white/[0.05] flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.018)', height: '44px' }}>

        {/* Back */}
        <button onClick={() => navigate('/editor')}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors">
          <ChevronLeft size={13} /> Editor
        </button>

        <div className="w-px h-4 bg-white/[0.07]" />

        {/* Page tabs */}
        <nav className="flex gap-0.5 overflow-x-auto no-scrollbar">
          {pages.map(p => (
            <button key={p} onClick={() => setActivePage(p)}
              className={`px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-all
                ${activePage === p
                  ? 'text-white bg-indigo-600/25 border border-indigo-500/30'
                  : 'text-gray-600 hover:text-gray-300 hover:bg-white/[0.04]'}`}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </nav>

        <div className="w-px h-4 bg-white/[0.07]" />

        {/* Viewport */}
        <div className="flex gap-0.5">
          {VIEWPORTS.map(v => {
            const Icon = v.icon
            return (
              <button key={v.id} onClick={() => setViewport(v.id)}
                title={v.label}
                className={`p-1.5 rounded-md transition-all
                  ${viewport === v.id ? 'bg-white/[0.1] text-white' : 'text-gray-700 hover:text-gray-400'}`}>
                <Icon size={14} />
              </button>
            )
          })}
        </div>

        {/* Zoom – only for non-desktop */}
        {vp.px && (
          <>
            <div className="w-px h-4 bg-white/[0.07]" />
            <div className="flex items-center gap-0.5">
              <button onClick={() => bumpZoom(-0.1)} disabled={!canZoomOut}
                className="p-1 rounded text-gray-700 hover:text-gray-400 disabled:opacity-30 transition-colors">
                <ZoomOut size={12} />
              </button>
              <span className="text-xs text-gray-600 w-9 text-center tabular-nums">
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={() => bumpZoom(0.1)} disabled={!canZoomIn}
                className="p-1 rounded text-gray-700 hover:text-gray-400 disabled:opacity-30 transition-colors">
                <ZoomIn size={12} />
              </button>
            </div>
          </>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 ml-1">
            <Loader2 size={11} className="animate-spin" /> Rendering…
          </div>
        )}

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => loadPreview()}
            title="Refresh preview"
            className="p-1.5 rounded-md text-gray-700 hover:text-gray-400 transition-colors">
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => navigate('/export')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 2px 10px rgba(79,70,229,0.35)' }}>
            <Download size={12} /> Export
          </button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="flex-1 overflow-auto flex justify-center pt-6 pb-8 px-4"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%,rgba(79,70,229,0.05),transparent 70%), #05050d'
        }}>

        {error ? (
          <div className="mt-20 text-center space-y-3">
            <p className="text-red-400 text-sm font-semibold">Preview failed</p>
            <p className="text-gray-600 text-xs max-w-xs">{error}</p>
            <button onClick={() => loadPreview()}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Retry
            </button>
          </div>
        ) : (
          /* Outer shell – simulates a browser chrome for non-desktop viewports */
          <div
            className="relative flex-shrink-0 transition-all duration-300 rounded-xl overflow-hidden shadow-2xl"
            style={{
              width: vp.w ?? '100%',
              maxWidth: '100%',
              background: '#fff',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.07), 0 24px 80px rgba(0,0,0,0.5)',
              transform: vp.px ? `scale(${zoom})` : 'none',
              transformOrigin: 'top center',
              // Keep scroll container aware of actual rendered height when scaled
              marginBottom: vp.px ? `${iframeH * zoom - iframeH}px` : 0,
            }}>

            {/* Browser-chrome bar for tablet / mobile */}
            {vp.px && (
              <div className="flex items-center gap-2 px-3 py-2 border-b"
                style={{ background: '#f5f5f7', borderColor: '#e5e5ea' }}>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }} />
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }} />
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-xs text-gray-400 bg-white rounded px-3 py-0.5 border border-gray-200">
                    yoursite.com/{activePage === 'index' ? '' : activePage}
                  </span>
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.75)' }}>
                <Loader2 className="animate-spin text-indigo-500" size={28} />
              </div>
            )}

            {/* The iframe itself — sandbox allows scripts but NOT top navigation */}
            {html && (
              <iframe
                ref={iframeRef}
                srcDoc={html}
                title={`Preview · ${activePage}`}
                className="w-full border-0 block"
                style={{ height: `${iframeH}px` }}
                sandbox="allow-scripts allow-same-origin"
                /* NOTE: no allow-top-navigation — combined with the server-injected
                   interceptor script, all .html link clicks post a message here
                   and never touch the parent frame's URL */
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

