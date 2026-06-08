import { Capacitor } from '@capacitor/core'

export const nativeRedirectUrl = 'com.aoresta.amour://auth-callback'
// Web page that receives OAuth callback and redirects to the custom scheme deep link
export const oauthRedirectPage = 'https://oauth-redirect-rpgejyzh.devinapps.com'

export function getAuthRedirectUrl() {
  if (Capacitor.isNativePlatform()) return oauthRedirectPage
  return `${window.location.origin}/auth`
}
