import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Briefcase, User, BookOpen, ArrowRight, Loader2, AlertCircle,
  Sparkles, Search, Star, Eye, Tag, Layers, TrendingUp, X
} from 'lucide-react'

const ICONS = {
  'business-template': Briefcase,
  'portfolio-template': User,
  'blog-template': BookOpen,
}

const COLORS = {
  'business-template': { grad: 'from-indigo-600 to-violet-600', glow: 'rgba(79,70,229,0.25)', badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' },
  'portfolio-template': { grad: 'from-cyan-500 to-blue-600', glow: 'rgba(6,182,212,0.25)', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  'blog-template': { grad: 'from-amber-500 to-orange-600', glow: 'rgba(245,158,11,0.25)', badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
}

// Fake ratings/download counts for marketplace feel
const STATS = {
  'business-template': { rating: 4.9, downloads: '12.4k', featured: true },
  'portfolio-template': { rating: 4.8, downloads: '9.1k', featured: true },
  'blog-template': { rating: 4.7, downloads: '6.8k', featured: false },
}

const ALL_TAGS = ['all', 'business', 'corporate', 'portfolio', 'creative', 'blog', 'minimal', 'dark']

export default function Marketplace() {
  const { getFilteredTemplates, templatesLoading, templatesError,
    marketplaceFilter, marketplaceSearch, setMarketplaceFilter, setMarketplaceSearch,
    selectTemplate, schemaLoading, selectedTemplate } = useStore()
  const navigate = useNavigate()
  const [hoveredId, setHoveredId] = useState(null)
  const [previewId, setPreviewId] = useState(null)

  const filtered = getFilteredTemplates()

  const handleSelect = async (id) => {
    await selectTemplate(id)
    navigate('/editor')
  }

  const previewTemplate = filtered.find(t => t.id === previewId)

  return (
    <div className="h-[calc(100vh-52px)] overflow-y-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* ── Hero ── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-xs font-bold text-indigo-300 uppercase tracking-widest"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <Sparkles size={11} /> Template Marketplace
          </div>
          <h1 className="mb-3 text-white"
            style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif', fontSize: 'clamp(2.4rem,5vw,3.8rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}>
            Build Your Site in Minutes
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto text-base leading-relaxed">
            Choose a template, fill in your content with AI, preview live, and download a complete static website.
          </p>

          {/* Process steps */}
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            {[
              { n: '01', t: 'Pick Template', icon: Layers },
              { n: '02', t: 'AI fills content', icon: Sparkles },
              { n: '03', t: 'Customise', icon: Tag },
              { n: '04', t: 'Export & Deploy', icon: TrendingUp },
            ].map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <Icon size={12} className="text-indigo-400" />
                    <span className="text-xs text-gray-400 font-medium">{s.t}</span>
                  </div>
                  {i < 3 && <ArrowRight size={10} className="text-gray-700" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Search + Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              value={marketplaceSearch}
              onChange={e => setMarketplaceSearch(e.target.value)}
              placeholder="Search templates..."
              className="form-input pl-9 text-sm h-9"
            />
            {marketplaceSearch && (
              <button onClick={() => setMarketplaceSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400">
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-1 flex-wrap">
            {ALL_TAGS.map(tag => (
              <button key={tag} onClick={() => setMarketplaceFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                  ${marketplaceFilter === tag
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.05]'}`}
                style={marketplaceFilter !== tag ? { border: '1px solid rgba(255,255,255,0.06)' } : {}}>
                {tag === 'all' ? 'All' : tag}
              </button>
            ))}
          </div>
        </div>

        {/* ── States ── */}
        {templatesLoading && (
          <div className="flex justify-center items-center py-24">
            <Loader2 className="animate-spin text-indigo-500" size={28} />
          </div>
        )}

        {templatesError && (
          <div className="flex justify-center py-12">
            <div className="flex items-start gap-3 px-6 py-4 rounded-xl text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Server not reachable</p>
                <p className="text-sm text-red-500 mt-0.5">{templatesError}</p>
                <p className="text-xs text-gray-600 mt-1">Make sure the server is running: <code className="text-gray-500">cd server && npm run dev</code></p>
              </div>
            </div>
          </div>
        )}

        {/* ── Template Grid ── */}
        {!templatesLoading && !templatesError && (
          <>
            <div className="text-xs text-gray-600 mb-4 font-medium">
              {filtered.length} template{filtered.length !== 1 ? 's' : ''} available
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(t => {
                const Icon = ICONS[t.id] || Briefcase
                const col = COLORS[t.id] || COLORS['business-template']
                const stats = STATS[t.id] || { rating: 4.5, downloads: '1k', featured: false }
                const isLoading = schemaLoading && selectedTemplate === t.id
                const isHovered = hoveredId === t.id

                return (
                  <div key={t.id}
                    onMouseEnter={() => setHoveredId(t.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: `1px solid ${isHovered ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.07)'}`,
                      transform: isHovered ? 'translateY(-3px)' : 'none',
                      boxShadow: isHovered ? `0 20px 60px ${col.glow}` : 'none',
                    }}>

                    {stats.featured && (
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold text-amber-300"
                        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                        <Star size={9} fill="currentColor" /> Featured
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div className="relative h-44 overflow-hidden">
                      {t.thumbnail ? (
                        <img src={t.thumbnail} alt={t.name}
                          className="w-full h-full object-cover transition-transform duration-700"
                          style={{ transform: isHovered ? 'scale(1.06)' : 'scale(1)', opacity: isHovered ? 0.85 : 0.65 }} />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${col.grad} opacity-20`}>
                          <Icon size={52} className="text-white opacity-40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Hover overlay: preview button */}
                      {isHovered && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewId(t.id) }}
                          className="absolute inset-0 flex items-center justify-center gap-2 text-white text-sm font-semibold"
                          style={{ background: 'rgba(0,0,0,0.3)' }}>
                          <Eye size={16} /> Quick Preview
                        </button>
                      )}

                      {/* Tag badges */}
                      <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                        {t.tags?.slice(0, 2).map(tag => (
                          <span key={tag} className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${col.badge}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br ${col.grad} opacity-80`}>
                          <Icon size={16} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white text-base leading-tight">{t.name}</h3>
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">{t.description}</p>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mb-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star size={10} className="text-amber-400" fill="currentColor" />
                          {stats.rating}
                        </span>
                        <span>{stats.downloads} downloads</span>
                        <span>{t.pages?.length || 3} pages</span>
                      </div>

                      {/* Page pills */}
                      <div className="flex gap-1 flex-wrap mb-4">
                        {t.pages?.slice(0, 5).map(p => (
                          <span key={p} className="text-xs px-2 py-0.5 rounded-md font-mono"
                            style={{ background: 'rgba(255,255,255,0.04)', color: '#4b5563', border: '1px solid rgba(255,255,255,0.05)' }}>
                            {p}.html
                          </span>
                        ))}
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => handleSelect(t.id)}
                        disabled={schemaLoading}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all
                          bg-gradient-to-r ${col.grad} text-white opacity-90 hover:opacity-100 disabled:opacity-50`}
                        style={{ boxShadow: isHovered ? `0 8px 24px ${col.glow}` : 'none' }}>
                        {isLoading ? (
                          <><Loader2 size={13} className="animate-spin" /> Loading…</>
                        ) : (
                          <>Use This Template <ArrowRight size={13} /></>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* "Coming Soon" ghost card */}
              <div className="rounded-2xl overflow-hidden flex items-center justify-center min-h-[360px]"
                style={{ background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.07)' }}>
                <div className="text-center px-6">
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Sparkles size={20} className="text-gray-700" />
                  </div>
                  <p className="text-gray-600 text-sm font-semibold">More templates</p>
                  <p className="text-gray-700 text-xs mt-1">Coming soon</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Quick Preview Modal ── */}
      {previewTemplate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          onClick={() => setPreviewId(null)}>
          <div className="relative max-w-3xl w-full rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: '#111120', border: '1px solid rgba(255,255,255,0.1)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bold text-white">{previewTemplate.name}</h3>
                <p className="text-xs text-gray-500">{previewTemplate.description}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPreviewId(null); handleSelect(previewTemplate.id) }}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                  Use Template
                </button>
                <button onClick={() => setPreviewId(null)}
                  className="p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              {previewTemplate.thumbnail ? (
                <img src={previewTemplate.thumbnail} alt={previewTemplate.name}
                  className="w-full h-full object-cover object-top" />
              ) : (
                <p className="text-gray-600 text-sm">No preview available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
