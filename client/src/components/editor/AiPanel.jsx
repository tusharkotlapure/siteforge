import { useState } from 'react'
import { useStore } from '../../store/useStore'
import { Sparkles, Loader2, Wand2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react'

const PROMPT_EXAMPLES = [
  'A boutique coffee shop in Brooklyn serving specialty espresso and pastries',
  'Full-stack developer who loves React, Rust, and building open source tools',
  'A minimalist lifestyle blog about slow living, mindful consumption, and intentional design',
  'SaaS startup building AI-powered HR automation software for mid-size companies',
  'Freelance brand designer creating visual identities for ethical businesses',
]

export default function AiPanel({ onClose }) {
  const { generateAiContent, aiGenerating, selectedTemplate, schema } = useStore()
  const [prompt, setPrompt] = useState('')
  const [showExamples, setShowExamples] = useState(false)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    await generateAiContent(prompt.trim())
    onClose?.()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Sparkles size={13} className="text-white" />
          </div>
          <h3 className="font-bold text-white text-sm">AI Content Generator</h3>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          Describe your business or project. AI will fill all fields instantly.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Your Business / Project
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="Describe your business, project, or idea in a sentence or two..."
            rows={4}
            className="form-input text-sm leading-relaxed"
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleGenerate()
            }}
          />
          <p className="text-xs text-gray-700 mt-1">Ctrl+Enter to generate</p>
        </div>

        {/* Examples */}
        <div>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors font-medium">
            <Lightbulb size={11} />
            Example prompts
            {showExamples ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </button>
          {showExamples && (
            <div className="mt-2 space-y-1.5">
              {PROMPT_EXAMPLES.map((ex, i) => (
                <button key={i} onClick={() => { setPrompt(ex); setShowExamples(false) }}
                  className="w-full text-left text-xs text-gray-500 hover:text-gray-300 px-3 py-2 rounded-lg transition-colors leading-relaxed"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  "{ex}"
                </button>
              ))}
            </div>
          )}
        </div>

        {/* What gets generated */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(79,70,229,0.06)', border: '1px solid rgba(79,70,229,0.12)' }}>
          <p className="text-xs font-bold text-indigo-400 mb-2">Will generate content for:</p>
          <div className="space-y-1">
            {schema?.global && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                Global settings ({Object.keys(schema.global).length} fields)
              </div>
            )}
            {schema?.pages && Object.entries(schema.pages).map(([page, fields]) => (
              <div key={page} className="flex items-center gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                {page.charAt(0).toUpperCase() + page.slice(1)} page ({Object.keys(fields).length} fields)
              </div>
            ))}
          </div>
        </div>

        {!process.env.VITE_AI_NOTE && (
          <div className="text-xs text-gray-700 leading-relaxed p-3 rounded-lg"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            💡 Works in demo mode without an API key. Set <code className="text-gray-500">ANTHROPIC_API_KEY</code> in server/.env for Claude-powered generation.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 pb-5 pt-3 border-t border-white/[0.06]">
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || aiGenerating}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: prompt.trim() ? '0 4px 20px rgba(79,70,229,0.4)' : 'none' }}>
          {aiGenerating ? (
            <><Loader2 size={14} className="animate-spin" /> Generating…</>
          ) : (
            <><Wand2 size={14} /> Generate All Content</>
          )}
        </button>
      </div>
    </div>
  )
}
