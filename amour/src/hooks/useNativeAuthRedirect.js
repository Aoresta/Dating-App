import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { supabase } from '../lib/supabase'

export function useNativeAuthRedirect() {
  useEffect(() => {
    if (!supabase || !Capacitor.isNativePlatform()) return undefined
    let listener
    const setup = async () => {
      listener = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        if (url?.startsWith('com.aoresta.amour://open/')) {
          const route = new URL(url).pathname.replace('/', '') || 'home'
          window.location.href = `/${route}`
          return
        }
        if (!url?.startsWith('com.aoresta.amour://auth-callback')) return
        try { await Browser.close() } catch (_) {}
        const hash = url.split('#')[1]
        if (hash) {
          const params = new URLSearchParams(hash)
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            return
          }
        }
        const qs = url.split('?')[1]
        if (qs) {
          const params = new URLSearchParams(qs)
          const code = params.get('code')
          if (code) await supabase.auth.exchangeCodeForSession(code)
        }
      })
    }
    setup()
    return () => listener?.remove()
  }, [])
}
