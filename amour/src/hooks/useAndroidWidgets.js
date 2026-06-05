import { useEffect } from 'react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { differenceInCalendarDays } from 'date-fns'
import { useAppStore } from '../store/appStore'

const WidgetBridge = registerPlugin('WidgetBridge')

export function useAndroidWidgets() {
  const state = useAppStore()
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const days = state.couple?.start_date ? differenceInCalendarDays(new Date(), new Date(state.couple.start_date)) : 0
    const latestDoodle = state.doodles?.[0]?.data || ''
    const latestMemory = state.memories?.[0]
    const latestQuestion = 'What small ritual would you love for us to start?'
    WidgetBridge.update({
      days: String(days),
      daysSubtitle: state.couple?.start_date ? 'days together' : 'set your start date',
      mood: `${state.myMood?.emoji || '—'} ${state.myMood?.label || 'Set mood'}`,
      partnerMood: `${state.partnerMood?.emoji || '—'} ${state.partnerMood?.label || 'Partner mood'}`,
      memoryTitle: latestMemory?.title || 'No memories yet',
      memorySubtitle: latestMemory?.story || 'Create your first memory',
      memoryImage: latestMemory?.image_data || latestMemory?.image_url || '',
      doodleImage: latestDoodle,
      question: latestQuestion,
      questionSubtitle: 'Tap to answer together'
    }).catch(() => {})
  }, [state.couple, state.myMood, state.partnerMood, state.memories, state.doodles])
}
