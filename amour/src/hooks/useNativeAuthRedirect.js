import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import { supabase } from '../lib/supabase'

export function useNativeAuthRedirect() {
  useEffect(() => {
    if (!supabase || !Capacitor.isNativePlatform()) return undefined
    let appListener, browserListener

    const setup = async () => {
      // Handle deep link callback (primary OAuth path)
      appListener = await CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        if (url?.startsWith('com.aoresta.amour://open/')) {
          const route = url.replace('com.aoresta.amour://open/', '') || 'home'
          window.location.href = `/${route}`
          return
        }
        if (!url?.startsWith('com.aoresta.amour://auth-callback')) return
        try { await Browser.close() } catch (_) {}

        // Try hash tokens (implicit flow)
        const hashIdx = url.indexOf('#')
        if (hashIdx !== -1) {
          const params = new URLSearchParams(url.substring(hashIdx + 1))
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            })
            if (!error) { window.location.href = '/home'; return }
          }
        }

        // Try code exchange (PKCE flow)
        const qsIdx = url.indexOf('?')
        if (qsIdx !== -1) {
          const params = new URLSearchParams(url.substring(qsIdx + 1))
          const code = params.get('code')
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code)
            if (!error) { window.location.href = '/home'; return }
          }
        }
      })

      // Fallback: when user closes browser, check if session was established
      browserListener = await Browser.addListener('browserFinished', async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) window.location.href = '/home'
      })
    }

    setup()
    return () => {
      appListener?.remove()
      browserListener?.remove()
    }
  }, [])
}
