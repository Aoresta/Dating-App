import { useEffect } from 'react'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
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
        const parsed = new URL(url)
        const code = parsed.searchParams.get('code')
        if (code) await supabase.auth.exchangeCodeForSession(code)
      })
    }
    setup()
    return () => listener?.remove()
  }, [])
}
