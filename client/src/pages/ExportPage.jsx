import { useState } from 'react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore'
import {
  Download, CheckCircle, Loader2, ArrowLeft, Zap,
  ExternalLink, FileArchive, Globe, GitBranch, Cloud,
  AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Info
} from 'lucide-react'

// ─── Deploy target card ────────────────────────────────────────────────────────
function DeployCard({ target, label, description, icon: Icon, color, gradient, steps, onDeploy, loading, disabled }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-200"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-lg"
            style={{ background: gradient, color: '#fff' }}>
            <Icon size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-0.5">
              <h3 className="font-bold text-white text-sm">{label}</h3>
              <button onClick={() => setExpanded(e => !e)}
                className="text-gray-700 hover:text-gray-500 transition-colors p-0.5">
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pl-15 space-y-2">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-2">Deploy Steps</p>
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(79,70,229,0.2)', color: '#818cf8', fontSize: '10px' }}>
                  {i+1}
                </span>
                {step}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => onDeploy(target)}
          disabled={disabled || loading}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all disabled:opacity-50"
          style={{ background: gradient, boxShadow: loading ? 'none' : `0 4px 16px ${color}44` }}>
          {loading
            ? <><Loader2 size={12} className="animate-spin" /> Packaging…</>
            : <><Download size={12} /> Download {label} Package</>
          }
        </button>
      </div>
    </div>
  )
}

// ─── File tree display ────────────────────────────────────────────────────────
function FileTree({ pages }) {
  const items = [
    { depth: 0, name: 'your-site/', type: 'dir', color: '#818cf8' },
    { depth: 1, name: 'index.html', type: 'html', color: '#34d399' },
    ...pages.filter(p => p !== 'index').map(p => ({
      depth: 1, name: `${p}.html`, type: 'html', color: '#34d399'
    })),
    { depth: 1, name: 'assets/', type: 'dir', color: '#818cf8' },
    { depth: 2, name: 'css/style.css', type: 'css', color: '#60a5fa' },
    { depth: 2, name: 'js/script.js', type: 'js', color: '#fbbf24' },
    { depth: 1, name: 'netlify.toml*', type: 'config', color: '#f472b6', note: 'Netlify only' },
    { depth: 1, name: 'vercel.json*', type: 'config', color: '#f472b6', note: 'Vercel only' },
  ]
  return (
    <div className="font-mono text-xs space-y-0.5">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1" style={{ paddingLeft: `${item.depth * 16}px` }}>
          <span className="text-gray-700 select-none">{item.depth > 0 ? '├ ' : ''}</span>
          <span style={{ color: item.color }}>{item.name}</span>
          {item.note && <span className="text-gray-700 ml-1 text-xs">({item.note})</span>}
        </div>
      ))}
    </div>
  )
}

// ─── Main ExportPage ──────────────────────────────────────────────────────────
export default function ExportPage() {
  const navigate = useNavigate()
  const {
    schema, selectedTemplate, content, pageOrder,
    generating, generateError, generateSite,
    deployTo, deployLoading, deployTarget,
    reset, showNotification
  } = useStore()

  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => { if (!selectedTemplate || !schema) navigate('/') }, [])

  if (!schema) return null

  const pages = [...new Set([...pageOrder, ...Object.keys(schema.pages || {})])]
  const siteName = content._global?.site_name || selectedTemplate || 'My Site'

  const handleGenerate = async () => {
    await generateSite()
    if (!generateError) setDownloaded(true)
  }

  const DEPLOY_TARGETS = [
    {
      target: 'netlify',
      label: 'Netlify',
      description: 'Drag & drop deploy or use the Netlify CLI. Includes netlify.toml and _headers.',
      icon: Cloud,
      color: '#00ad9f',
      gradient: 'linear-gradient(135deg,#00ad9f,#00c7b7)',
      steps: [
        'Download the Netlify package ZIP',
        'Extract the ZIP to a folder',
        'Visit app.netlify.com → drag the folder to deploy',
        'Or run: npx netlify-cli deploy --prod --dir .',
      ]
    },
    {
      target: 'vercel',
      label: 'Vercel',
      description: 'Zero-config Vercel deployment. Includes vercel.json with routes and cache headers.',
      icon: Zap,
      color: '#ffffff',
      gradient: 'linear-gradient(135deg,#333,#555)',
      steps: [
        'Download the Vercel package ZIP',
        'Install Vercel CLI: npm i -g vercel',
        'Extract and run: vercel --prod',
        'Or import a GitHub repo at vercel.com/new',
      ]
    },
    {
      target: 'github-pages',
      label: 'GitHub Pages',
      description: 'Free hosting on GitHub. Includes .nojekyll and deploy instructions.',
      icon: GitBranch,
      color: '#6e5494',
      gradient: 'linear-gradient(135deg,#24292e,#3a3f4b)',
      steps: [
        'Download the GitHub Pages package ZIP',
        'Create a new GitHub repository',
        'Push the extracted contents as the main branch',
        'Enable GitHub Pages in repo Settings → Pages',
      ]
    },
  ]

  return (
    <div className="h-[calc(100vh-52px)] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <button onClick={() => navigate('/preview')}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-300 transition-colors mb-5">
            <ArrowLeft size={13} /> Back to Preview
          </button>
          <h1 className="text-3xl font-bold text-white mb-2"
            style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif', letterSpacing: '-0.04em' }}>
            Export & Deploy
          </h1>
          <p className="text-gray-500 text-sm">
            Download <strong className="text-gray-300">{siteName}</strong> as a static site or get a platform-ready package.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Left: Export options ── */}
          <div className="lg:col-span-3 space-y-5">

            {/* Plain ZIP */}
            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.2)' }}>
              <div className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                    <FileArchive size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm mb-0.5">Download ZIP</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Pure HTML/CSS/JS — host anywhere. No framework, no build step required.
                    </p>
                  </div>
                </div>

                {generateError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl mb-4 text-red-400 text-xs"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                    <AlertTriangle size={13} className="shrink-0" /> {generateError}
                  </div>
                )}

                <button onClick={handleGenerate} disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', boxShadow: '0 4px 20px rgba(79,70,229,0.4)' }}>
                  {generating
                    ? <><Loader2 size={14} className="animate-spin" /> Building…</>
                    : downloaded
                    ? <><RefreshCw size={14} /> Download Again</>
                    : <><Download size={14} /> Download ZIP ({pages.length} pages)</>
                  }
                </button>

                {downloaded && !generating && (
                  <p className="text-xs text-emerald-400 text-center mt-2 flex items-center justify-center gap-1">
                    <CheckCircle size={11} /> Downloaded successfully!
                  </p>
                )}
              </div>
            </div>

            {/* Deploy targets */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe size={13} className="text-gray-600" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-widest">Platform-Ready Packages</span>
              </div>
              <div className="space-y-3">
                {DEPLOY_TARGETS.map(t => (
                  <DeployCard key={t.target} {...t}
                    onDeploy={deployTo}
                    loading={deployLoading && deployTarget === t.target}
                    disabled={deployLoading && deployTarget !== t.target} />
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Summary + file tree ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Site summary */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-4">Site Summary</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { n: pages.length, l: 'Pages' },
                  { n: '100%', l: 'Static' },
                  { n: '~15kb', l: 'Bundle' },
                ].map(s => (
                  <div key={s.l} className="text-center">
                    <div className="text-xl font-bold text-white mb-0.5"
                      style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>{s.n}</div>
                    <div className="text-xs text-gray-600">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-600 space-y-1 pt-3 border-t border-white/[0.05]">
                <div>Template: <span className="text-gray-400">{selectedTemplate}</span></div>
                <div>Theme: <span className="font-mono" style={{ color: useStore.getState().themeColor }}>
                  {useStore.getState().themeColor}
                </span></div>
              </div>
            </div>

            {/* File tree */}
            <div className="rounded-2xl p-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Output Structure</h3>
              <FileTree pages={pages} />
            </div>

            {/* Info */}
            <div className="rounded-xl p-4 text-xs text-gray-600 space-y-2 leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-start gap-2">
                <Info size={11} className="mt-0.5 shrink-0 text-gray-700" />
                <span>Generated sites are 100% static — no server, no database, no runtime dependencies.</span>
              </div>
              <div className="flex items-start gap-2">
                <Info size={11} className="mt-0.5 shrink-0 text-gray-700" />
                <span>Platform packages include optimised config files and step-by-step instructions.</span>
              </div>
            </div>

            {/* Start over */}
            <button onClick={() => { reset(); navigate('/') }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-white transition-all hover:bg-white/[0.06]"
              style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
              <Zap size={12} /> Build Another Site
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
