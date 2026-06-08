import { useEffect } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'

const WidgetBridge = Capacitor.isNativePlatform() ? registerPlugin('WidgetBridge') : null

export function useRealtimeSync() {
  const user = useAppStore(s => s.user)
  const couple = useAppStore(s => s.couple)
  const demoMode = useAppStore(s => s.demoMode)

  useEffect(() => {
    if (!supabase || demoMode || !couple?.id) return

    const coupleId = couple.id
    const userId = user?.id
    const subs = []

    // Notes channel
    const notesCh = supabase.channel(`notes:${coupleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notes', filter: `couple_id=eq.${coupleId}` }, payload => {
        const row = payload.new
        if (row.sender_id === userId) return
        const { data: profile } = { data: null }
        useAppStore.getState().mergeRealtime('notes', { ...row, sender_name: 'Partner' })
      })
      .subscribe()
    subs.push(notesCh)

    // Moods channel
    const moodsCh = supabase.channel(`moods:${coupleId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moods', filter: `couple_id=eq.${coupleId}` }, payload => {
        const row = payload.new
        if (row.user_id === userId) return
        useAppStore.getState().mergeRealtimeMood(row)
      })
      .subscribe()
    subs.push(moodsCh)

    // Memories channel
    const memoriesCh = supabase.channel(`memories:${coupleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memories', filter: `couple_id=eq.${coupleId}` }, payload => {
        const row = payload.new
        useAppStore.getState().mergeRealtime('memories', row)
      })
      .subscribe()
    subs.push(memoriesCh)

    // Shared images channel
    const imagesCh = supabase.channel(`images:${coupleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shared_images', filter: `couple_id=eq.${coupleId}` }, payload => {
        const row = payload.new
        if (row.sender_id === userId) return
        useAppStore.getState().mergeRealtime('sharedImages', { ...row, sender: 'Partner' })
      })
      .subscribe()
    subs.push(imagesCh)

    // Doodles channel — also auto-set as lockscreen on partner device
    const doodlesCh = supabase.channel(`doodles:${coupleId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'doodles', filter: `couple_id=eq.${coupleId}` }, payload => {
        const row = payload.new
        if (row.sender_id === userId) return
        useAppStore.getState().mergeRealtime('doodles', row)
        // Auto-set partner's doodle as lockscreen wallpaper on native
        if (WidgetBridge && row.data) {
          WidgetBridge.setLockscreenWallpaper({ image: row.data }).catch(() => {})
        }
      })
      .subscribe()
    subs.push(doodlesCh)

    // Presence channel — show partner online/offline + typing
    const presenceCh = supabase.channel(`presence:${coupleId}`, { config: { presence: { key: userId } } })
    presenceCh
      .on('presence', { event: 'sync' }, () => {
        const state = presenceCh.presenceState()
        const partnerKeys = Object.keys(state).filter(k => k !== userId)
        useAppStore.getState().setPresence(partnerKeys.length > 0)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key !== userId) useAppStore.getState().setPresence(true)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key !== userId) useAppStore.getState().setPresence(false)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await presenceCh.track({ online: true })
      })
    subs.push(presenceCh)

    return () => {
      subs.forEach(ch => supabase.removeChannel(ch))
    }
  }, [user?.id, couple?.id, demoMode])
}
