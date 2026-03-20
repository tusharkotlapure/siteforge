import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { Zap, CheckCircle, Circle, ChevronRight, RotateCcw, Undo2, Redo2 } from 'lucide-react'

const STEPS = [
  { num: 1, label: 'Templates', path: '/' },
  { num: 2, label: 'Editor', path: '/editor' },
  { num: 3, label: 'Preview', path: '/preview' },
  { num: 4, label: 'Export', path: '/export' },
]

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    currentStep, selectedTemplate, notification, reset,
    undo, redo, canUndo, canRedo, generating
  } = useStore()

  const activeStep = STEPS.findIndex(s => s.path === location.pathname) + 1

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if (e.key === 'z' && e.shiftKey)  { e.preventDefault(); redo() }
      if (e.key === 'y')                 { e.preventDefault(); redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080810' }}>

      {/* ── Navbar ── */}
      <header className="border-b border-white/[0.05] sticky top-0 z-50 flex-shrink-0"
        style={{ background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-screen-2xl mx-auto px-4 h-13 flex items-center gap-4" style={{ height: '52px' }}>

          {/* Logo */}
          <button onClick={() => { reset(); navigate('/') }}
            className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              <Zap size={13} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-white text-sm tracking-tighter"
              style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif', letterSpacing: '-0.04em' }}>
              SiteForge
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded font-bold tracking-wide"
              style={{ background: 'rgba(79,70,229,0.2)', color: '#818cf8', fontSize: '9px' }}>v2</span>
          </button>

          {/* Stepper */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
            {STEPS.map((step, i) => {
              const done = currentStep > step.num
              const active = activeStep === step.num
              const reachable = currentStep >= step.num
              return (
                <div key={step.num} className="flex items-center">
                  <button
                    onClick={() => reachable && navigate(step.path)}
                    disabled={!reachable}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                      ${active ? 'text-white' : ''}
                      ${done ? 'text-emerald-400 hover:bg-emerald-500/10' : ''}
                      ${!active && !done ? 'text-gray-700 cursor-default' : ''}
                    `}
                    style={active ? { background: 'rgba(79,70,229,0.2)', border: '1px solid rgba(99,102,241,0.35)' } : {}}>
                    {done
                      ? <CheckCircle size={12} className="text-emerald-400" />
                      : <Circle size={12} className={active ? 'text-indigo-400' : 'text-gray-700'} />}
                    <span className={active ? 'text-indigo-200' : ''}>{step.label}</span>
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight size={11} className="text-gray-800 mx-0.5" />
                  )}
                </div>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {selectedTemplate && (
              <>
                <button onClick={undo} disabled={!canUndo()}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-30 text-gray-600 hover:text-gray-300 hover:bg-white/[0.06]">
                  <Undo2 size={13} />
                </button>
                <button onClick={redo} disabled={!canRedo()}
                  title="Redo (Ctrl+Shift+Z)"
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-30 text-gray-600 hover:text-gray-300 hover:bg-white/[0.06]">
                  <Redo2 size={13} />
                </button>
                <div className="w-px h-4 bg-white/[0.08] mx-1" />
                <button onClick={() => { reset(); navigate('/') }}
                  className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded">
                  <RotateCcw size={11} /> New Site
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {children}
      </main>

      {/* ── Toast ── */}
      {notification && (
        <div key={notification.id}
          className={`fixed bottom-5 right-5 z-[200] flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl animate-slide-up
            ${notification.type === 'error'
              ? 'bg-red-950/95 text-red-200 border border-red-800/60'
              : 'bg-emerald-950/95 text-emerald-200 border border-emerald-800/60'}`}>
          <span>{notification.type === 'error' ? '⚠' : '✓'}</span>
          {notification.msg}
        </div>
      )}
    </div>
  )
}
