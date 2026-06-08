import { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function AuthCallbackPage() {
  const nav = useNavigate()

  useEffect(() => {
    const handle = async () => {
      const params = window.location.search
      const hash = window.location.hash

      if (Capacitor.isNativePlatform()) {
        // Shouldn't reach here on native, but just in case
        nav('/auth')
        return
      }

      // On web: handle OAuth callback directly
      if (supabase) {
        // If there's a code param (PKCE flow), exchange it
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        if (code) {
          try {
            await supabase.auth.exchangeCodeForSession(code)
            nav('/home')
            return
          } catch (e) {
            console.error('Code exchange failed:', e)
          }
        }
        // If there are hash tokens (implicit flow), supabase auto-detects them
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          nav('/home')
          return
        }
      }
      nav('/auth')
    }
    handle()
  }, [nav])

  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="text-center text-white">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-pink" />
        <p className="mt-4 text-sm text-muted">Signing you in...</p>
      </div>
    </div>
  )
}
