import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout'
import Marketplace from './pages/Marketplace'
import EditorShell from './pages/EditorShell'
import PreviewPage from './pages/PreviewPage'
import ExportPage from './pages/ExportPage'
import { useStore } from './store/useStore'

export default function App() {
  const fetchTemplates = useStore(s => s.fetchTemplates)
  useEffect(() => { fetchTemplates() }, [])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Marketplace />} />
        <Route path="/editor" element={<EditorShell />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/export" element={<ExportPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}
