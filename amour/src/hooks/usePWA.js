import { useEffect, useState } from 'react'
export function usePWA() {
  const [prompt, setPrompt] = useState(null)
  useEffect(() => { const handler = e => { e.preventDefault(); setPrompt(e) }; window.addEventListener('beforeinstallprompt', handler); return () => window.removeEventListener('beforeinstallprompt', handler) }, [])
  return { canInstall: Boolean(prompt), install: async () => { if (!prompt) return; await prompt.prompt(); setPrompt(null) } }
}
