import { useState, useCallback, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Wand2, Loader2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'

// ─── Field components ──────────────────────────────────────────────────────────
function TextField({ value, onChange, placeholder, onBlur }) {
  return (
    <input type="text" className="form-input text-sm"
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''} onBlur={onBlur} />
  )
}

function TextareaField({ value, onChange, placeholder, onBlur }) {
  return (
    <textarea className="form-input text-sm leading-relaxed"
      value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''} rows={3} onBlur={onBlur} />
  )
}

function EmailField({ value, onChange, onBlur }) {
  return (
    <input type="email" className="form-input text-sm"
      value={value} onChange={e => onChange(e.target.value)}
      placeholder="email@example.com" onBlur={onBlur} />
  )
}

function UrlField({ value, onChange, onBlur }) {
  return (
    <input type="url" className="form-input text-sm"
      value={value} onChange={e => onChange(e.target.value)}
      placeholder="https://" onBlur={onBlur} />
  )
}

const FIELD_MAP = { text: TextField, textarea: TextareaField, email: EmailField, url: UrlField }

// ─── Single field row ──────────────────────────────────────────────────────────
function FieldRow({ page, fieldKey, field, value, onChange, onImprove, improving }) {
  const Comp = FIELD_MAP[field.type] || TextField
  const canImprove = (field.type === 'text' || field.type === 'textarea') && value?.length > 3

  return (
    <div className="space-y-1.5 group/field">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </label>
        {canImprove && (
          <button
            onClick={() => onImprove(page, fieldKey, value)}
            disabled={improving}
            className="opacity-0 group-hover/field:opacity-100 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-all px-1.5 py-0.5 rounded-md hover:bg-indigo-500/10"
            title="AI: Improve this text">
            {improving ? <Loader2 size={9} className="animate-spin" /> : <Wand2 size={9} />}
            Improve
          </button>
        )}
      </div>
      <Comp value={value || ''} onChange={onChange} placeholder={field.default}
        onBlur={() => useStore.getState().pushHistory()} />
    </div>
  )
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function Section({ title, emoji, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-200 hover:bg-white/[0.03] transition-colors">
        <span className="flex items-center gap-2">{emoji && <span>{emoji}</span>}{title}</span>
        {open ? <ChevronUp size={13} className="text-gray-600" /> : <ChevronDown size={13} className="text-gray-600" />}
      </button>
      {open && (
        <div className="px-4 pb-5 pt-1 space-y-4 border-t border-white/[0.04]">
          {children}
        </div>
      )}
    </div>
  )
}

// ─── Main ContentEditor ──────────────────────────────────────────────────────
export default function ContentEditor({ activePage }) {
  const { schema, content, updateContent, improveField } = useStore()
  const [improvingField, setImprovingField] = useState(null)

  const handleImprove = async (page, key, value) => {
    setImprovingField(`${page}.${key}`)
    await improveField(page, key, value)
    setImprovingField(null)
  }

  if (activePage === '_global') {
    const globalFields = schema?.global || {}
    return (
      <div className="space-y-4">
        <SectionHeader title="Global Settings" subtitle="Applied across all pages" />
        <Section title="Site-wide Fields" emoji="🌐">
          {Object.entries(globalFields).map(([key, field]) => (
            <FieldRow key={key} page="_global" fieldKey={key} field={field}
              value={content._global?.[key] || ''}
              onChange={v => updateContent('_global', key, v)}
              onImprove={handleImprove}
              improving={improvingField === `_global.${key}`} />
          ))}
        </Section>
      </div>
    )
  }

  const pageFields = schema?.pages?.[activePage] || {}
  const entries = Object.entries(pageFields)

  // Group fields into chunks of ~4 for collapsible sections
  const sections = []
  let chunk = []
  entries.forEach(([key, field], i) => {
    chunk.push([key, field])
    if (chunk.length === 5 || i === entries.length - 1) {
      sections.push([...chunk])
      chunk = []
    }
  })

  return (
    <div className="space-y-4">
      <SectionHeader
        title={`${activePage.charAt(0).toUpperCase() + activePage.slice(1)} Page`}
        subtitle={`${entries.length} editable fields`} />
      {sections.map((group, si) => {
        const firstField = group[0]?.[1]
        const isHero = group[0]?.[0]?.includes('hero') || si === 0
        return (
          <Section key={si}
            title={si === 0 ? 'Main Content' : si === 1 ? 'Secondary Content' : 'Additional Fields'}
            emoji={si === 0 ? '✏️' : si === 1 ? '📋' : '⚙️'}
            defaultOpen={si === 0}>
            {group.map(([key, field]) => (
              <FieldRow key={key} page={activePage} fieldKey={key} field={field}
                value={content[activePage]?.[key] || ''}
                onChange={v => updateContent(activePage, key, v)}
                onImprove={handleImprove}
                improving={improvingField === `${activePage}.${key}`} />
            ))}
          </Section>
        )
      })}
    </div>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="pb-1">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
    </div>
  )
}
