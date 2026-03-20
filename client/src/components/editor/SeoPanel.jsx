import { useStore } from '../../store/useStore'
import { Search, Share2, CheckCircle, AlertCircle, Info } from 'lucide-react'

const CHAR_LIMITS = {
  title: { min: 30, max: 60 },
  description: { min: 70, max: 160 },
}

function CharBar({ value, min, max }) {
  const len = (value || '').length
  const pct = Math.min((len / max) * 100, 100)
  const ok = len >= min && len <= max
  const over = len > max
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{len} chars</span>
        <span className={ok ? 'text-emerald-500' : over ? 'text-red-400' : 'text-gray-600'}>
          {min}–{max} recommended
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: ok ? '#10b981' : over ? '#ef4444' : '#6b7280' }} />
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, hint, charLimit }) {
  const InputEl = type === 'textarea' ? 'textarea' : 'input'
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
        {label}
        {hint && (
          <span title={hint} className="cursor-help">
            <Info size={10} className="text-gray-700" />
          </span>
        )}
      </label>
      <InputEl
        type={type !== 'textarea' ? type : undefined}
        className="form-input text-sm"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={type === 'textarea' ? 2 : undefined}
      />
      {charLimit && <CharBar value={value} min={charLimit.min} max={charLimit.max} />}
    </div>
  )
}

export default function SeoPanel() {
  const { seo, updateSeo, content } = useStore()

  // SERP preview
  const displayTitle = seo.title || content._global?.site_name || 'My Website'
  const displayDesc = seo.description || 'No description set. Add one for better search engine visibility.'
  const displayUrl = 'https://yoursite.com'

  const titleOk = seo.title?.length >= 30 && seo.title?.length <= 60
  const descOk = seo.description?.length >= 70 && seo.description?.length <= 160

  return (
    <div className="space-y-5">
      <div className="pb-1">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Search size={15} className="text-indigo-400" />
          SEO & Meta Tags
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">Optimise for search engines and social sharing</p>
      </div>

      {/* SERP Preview */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Google Preview</span>
          <div className="flex items-center gap-1">
            {titleOk && descOk
              ? <><CheckCircle size={11} className="text-emerald-400" /><span className="text-xs text-emerald-400">Optimised</span></>
              : <><AlertCircle size={11} className="text-amber-400" /><span className="text-xs text-amber-400">Needs work</span></>
            }
          </div>
        </div>
        <div className="p-4" style={{ background: 'rgba(255,255,255,0.015)' }}>
          <div className="text-xs text-gray-600 mb-1 truncate">{displayUrl}</div>
          <div className="text-base font-medium mb-1 truncate"
            style={{ color: '#8ab4f8', fontFamily: 'arial, sans-serif', lineHeight: 1.3 }}>
            {displayTitle}
          </div>
          <div className="text-xs leading-relaxed line-clamp-2"
            style={{ color: '#bdc1c6', fontFamily: 'arial, sans-serif' }}>
            {displayDesc}
          </div>
        </div>
      </div>

      {/* Core meta fields */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/[0.05]">
          Core Meta
        </div>
        <div className="px-4 py-4 space-y-4">
          <Field label="Site Title" value={seo.title} onChange={v => updateSeo('title', v)}
            placeholder="Your Site Name — Tagline"
            hint="Appears in browser tab and search results. 30–60 chars recommended."
            charLimit={CHAR_LIMITS.title} />
          <Field label="Meta Description" type="textarea" value={seo.description} onChange={v => updateSeo('description', v)}
            placeholder="A compelling description of your site for search engines..."
            hint="Shown below your title in search results. 70–160 chars recommended."
            charLimit={CHAR_LIMITS.description} />
          <Field label="Keywords" value={seo.keywords} onChange={v => updateSeo('keywords', v)}
            placeholder="keyword1, keyword2, keyword3"
            hint="Comma-separated keywords (less important for modern SEO, but still useful)." />
          <Field label="Author" value={seo.author} onChange={v => updateSeo('author', v)}
            placeholder="Your name or company name" />
        </div>
      </div>

      {/* Open Graph */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 border-b border-white/[0.05] flex items-center gap-2">
          <Share2 size={13} className="text-indigo-400" />
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Social (Open Graph)</span>
        </div>
        <div className="px-4 py-4 space-y-4">
          <Field label="OG Image URL" value={seo.ogImage} onChange={v => updateSeo('ogImage', v)}
            placeholder="https://yoursite.com/og-image.png"
            hint="1200×630px recommended. Used when sharing on Twitter, Facebook, LinkedIn." />
          <div className="rounded-lg p-3 text-xs text-gray-600 leading-relaxed"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <strong className="text-gray-500">Tip:</strong> OG title and description are auto-generated from your site title and meta description above.
          </div>
        </div>
      </div>
    </div>
  )
}
