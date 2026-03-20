import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Palette, Check, ChevronDown, ChevronUp } from 'lucide-react'

const PRESETS = [
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Violet', value: '#7c3aed' },
  { name: 'Cyan', value: '#0891b2' },
  { name: 'Emerald', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Pink', value: '#db2777' },
  { name: 'Slate', value: '#475569' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Fuchsia', value: '#a21caf' },
  { name: 'Sky', value: '#0284c7' },
]

function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/[0.03] transition-colors">
        {title}
        {open ? <ChevronUp size={13} className="text-gray-600" /> : <ChevronDown size={13} className="text-gray-600" />}
      </button>
      {open && (
        <div className="px-4 pb-5 pt-2 space-y-4 border-t border-white/[0.04]">
          {children}
        </div>
      )}
    </div>
  )
}

export default function ThemePanel() {
  const { themeColor, updateThemeColor } = useStore()

  // Derive a "live preview" of the theme applied to a mini mockup
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1,3),16)
    const g = parseInt(hex.slice(3,5),16)
    const b = parseInt(hex.slice(5,7),16)
    return `${r}, ${g}, ${b}`
  }

  return (
    <div className="space-y-4">
      <div className="pb-1">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Palette size={15} className="text-indigo-400" />
          Theme Customisation
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">Changes apply instantly to your preview</p>
      </div>

      {/* Live mini-preview */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-white/[0.05]">
          Live Preview
        </div>
        <div className="p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          {/* Mini site mockup */}
          <div className="rounded-lg overflow-hidden text-xs" style={{ background: '#fff', minHeight: 100 }}>
            {/* Nav */}
            <div className="flex items-center justify-between px-3 py-2"
              style={{ background: themeColor }}>
              <span className="font-bold text-white text-xs">LOGO</span>
              <div className="flex gap-2">
                {['Home','About','Contact'].map(l => (
                  <span key={l} className="text-white/80 text-xs">{l}</span>
                ))}
              </div>
            </div>
            {/* Hero */}
            <div className="px-3 py-3">
              <div className="h-2 rounded mb-1.5" style={{ background: themeColor, width: '70%' }} />
              <div className="h-1.5 rounded bg-gray-200 mb-1" style={{ width: '90%' }} />
              <div className="h-1.5 rounded bg-gray-200 mb-3" style={{ width: '60%' }} />
              <div className="inline-block px-3 py-1 rounded text-white text-xs font-bold"
                style={{ background: themeColor, fontSize: 10 }}>
                Get Started
              </div>
            </div>
          </div>
        </div>
      </div>

      <Section title="🎨 Brand Color">
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Color</label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input type="color" value={themeColor} onChange={e => updateThemeColor(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-0 p-1"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }} />
            </div>
            <div className="flex-1">
              <input type="text" className="form-input text-sm font-mono"
                value={themeColor} onChange={e => {
                  if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) updateThemeColor(e.target.value)
                }} />
              <p className="text-xs text-gray-700 mt-1">
                rgb({hexToRgb(themeColor.padEnd(7, '0'))})
              </p>
            </div>
          </div>

          {/* Preset grid */}
          <div>
            <p className="text-xs text-gray-600 mb-2 font-medium">Presets</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESETS.map(p => (
                <button key={p.value}
                  onClick={() => updateThemeColor(p.value)}
                  title={p.name}
                  className="relative w-full aspect-square rounded-lg transition-transform hover:scale-110 flex items-center justify-center"
                  style={{ background: p.value }}>
                  {themeColor === p.value && (
                    <Check size={12} className="text-white drop-shadow" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="💡 How Theme Works" defaultOpen={false}>
        <div className="space-y-2 text-xs text-gray-500 leading-relaxed">
          <p>The primary color replaces the <code className="text-indigo-400 text-xs">--primary</code> CSS variable in the template's stylesheet.</p>
          <p>This affects: navigation background, buttons, headings, links, and accent elements.</p>
          <p>Each template uses CSS custom properties so the color cascades consistently throughout the entire site.</p>
        </div>
      </Section>
    </div>
  )
}
