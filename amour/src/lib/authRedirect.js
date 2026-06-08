import { Capacitor } from '@capacitor/core'

export const nativeRedirectUrl = 'com.aoresta.amour://auth-callback'

export function getAuthRedirectUrl() {
  if (Capacitor.isNativePlatform()) return nativeRedirectUrl
  return `${window.location.origin}/auth`
}
