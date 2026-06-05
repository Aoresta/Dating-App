import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'
export function useRealtime() {
  const { couple, demoMode, mergeRealtime, mergeRealtimeMood, setPresence, setTyping } = useAppStore()
  useEffect(() => {
    if (!supabase || !couple?.id || demoMode) return
    const live = supabase.channel(`couple-${couple.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes', filter: `couple_id=eq.${couple.id}` }, p => mergeRealtime('notes', p.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'moods', filter: `couple_id=eq.${couple.id}` }, p => mergeRealtimeMood(p.new))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shared_images', filter: `couple_id=eq.${couple.id}` }, p => mergeRealtime('sharedImages', p.new))
      .on('presence', { event: 'sync' }, () => setPresence(Object.keys(live.presenceState()).length > 1))
      .on('broadcast', { event: 'typing' }, p => setTyping(Boolean(p.payload?.typing)))
      .subscribe(async status => { if (status === 'SUBSCRIBED') await live.track({ online_at: new Date().toISOString() }) })
    return () => { supabase.removeChannel(live) }
  }, [couple?.id, demoMode, mergeRealtime, mergeRealtimeMood, setPresence, setTyping])
}
