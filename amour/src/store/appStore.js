import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { subDays } from 'date-fns'
import { supabase } from '../lib/supabase'
import { DEFAULT_WIDGETS } from '../widgets/widgetRegistry'

const id = () => crypto.randomUUID()
const demoStart = subDays(new Date(), 127).toISOString()
const demoUser = { id: 'demo-user', email: 'you@amour.demo', user_metadata: { full_name: 'You' } }
const demoPartner = { id: 'demo-partner', name: 'Your Partner', avatar_url: '', online: true, mood: '😍' }

export const useAppStore = create(persist((set, get) => ({
  user: null, session: null, loading: true, demoMode: false,
  partner: null, couple: null, isPaired: false, coupleCode: null,
  partnerOnline: false, partnerTyping: false,
  notes: [], memories: [], myMood: null, partnerMood: null, sharedImages: [], doodles: [],
  activeWidgets: DEFAULT_WIDGETS,
  initDemoMode: () => set({
    user: demoUser, session: null, loading: false, demoMode: true, partner: demoPartner, partnerOnline: true,
    couple: { id: 'demo-couple', start_date: demoStart, anniversary: subDays(new Date(), -238).toISOString() },
    isPaired: true, coupleCode: 'AMOUR7', myMood: { emoji: '🥰', label: 'Adored' }, partnerMood: { emoji: '😍', label: 'In love' },
    notes: [
      { id: id(), sender_id: 'demo-partner', sender_name: 'Your Partner', content: 'Thinking of you made my whole afternoon softer 💕', created_at: subDays(new Date(), 1).toISOString(), type: 'text' },
      { id: id(), sender_id: 'demo-user', sender_name: 'You', content: 'You are still my favorite notification.', created_at: new Date().toISOString(), type: 'text' }
    ],
    memories: [
      { id: id(), title: 'First Date', story: 'Coffee turned into a long walk and neither of us wanted to leave.', image_url: 'https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=900&q=80', date: subDays(new Date(), 127).toISOString() },
      { id: id(), title: 'Weekend Getaway', story: 'A tiny escape, a lot of laughter, and one perfect sunset.', image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80', date: subDays(new Date(), 38).toISOString() }
    ]
  }),
  initAuth: async () => {
    if (!supabase) return set({ loading: false })
    const { data } = await supabase.auth.getSession()
    set({ session: data.session, user: data.session?.user || null, loading: false })
    if (data.session?.user) get().loadCoupleData(data.session.user.id)
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user || null, loading: false })
      if (session?.user) get().loadCoupleData(session.user.id)
    })
  },
  loadCoupleData: async (userId) => {
    if (!supabase) return
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    if (!profile) return
    set({ coupleCode: profile.couple_code })
    if (!profile.couple_id) return
    const [{ data: couple }, { data: notes }, { data: memories }, { data: moods }, { data: images }, { data: doodles }] = await Promise.all([
      supabase.from('couples').select('*').eq('id', profile.couple_id).single(),
      supabase.from('notes').select('*').eq('couple_id', profile.couple_id).order('created_at'),
      supabase.from('memories').select('*').eq('couple_id', profile.couple_id).order('created_at', { ascending: false }),
      supabase.from('moods').select('*').eq('couple_id', profile.couple_id),
      supabase.from('shared_images').select('*').eq('couple_id', profile.couple_id).order('created_at', { ascending: false }),
      supabase.from('doodles').select('*').eq('couple_id', profile.couple_id).order('created_at', { ascending: false })
    ])
    const partnerId = couple.user1_id === userId ? couple.user2_id : couple.user1_id
    const { data: partner } = partnerId ? await supabase.from('profiles').select('*').eq('id', partnerId).single() : { data: null }
    set({ couple, isPaired: Boolean(partner), partner, notes: notes || [], memories: memories || [], sharedImages: images || [], doodles: doodles || [], myMood: moods?.find(m => m.user_id === userId) || null, partnerMood: moods?.find(m => m.user_id !== userId) || null })
  },
  pairWithCode: async (code) => {
    if (get().demoMode) return { ok: true, message: 'Demo connection is ready 💕' }
    if (!supabase) return { ok: false, message: 'Add Supabase keys before connecting.' }
    const { error } = await supabase.rpc('pair_with_code', { partner_code: code })
    if (error) return { ok: false, message: error.message }
    await get().loadCoupleData(get().user.id)
    return { ok: true, message: 'Connected with your partner 💕' }
  },
  signOut: async () => { if (supabase) await supabase.auth.signOut(); set({ user: null, session: null, demoMode: false, partner: null, couple: null, isPaired: false }) },
  addNote: async (note) => { const value = { id: id(), created_at: new Date().toISOString(), sender_id: get().user.id, sender_name: 'You', type: 'text', ...note }; set(s => ({ notes: [...s.notes, value] })); if (supabase && !get().demoMode) { const { sender_name, ...row } = value; await supabase.from('notes').insert({ ...row, couple_id: get().couple.id }) } },
  addMemory: async (memory) => { const value = { id: id(), created_at: new Date().toISOString(), ...memory }; set(s => ({ memories: [value, ...s.memories] })); if (supabase && !get().demoMode) await supabase.from('memories').insert({ ...value, couple_id: get().couple.id }) },
  setMyMood: async (mood) => { set({ myMood: mood }); if (supabase && !get().demoMode) await supabase.from('moods').upsert({ ...mood, user_id: get().user.id, couple_id: get().couple.id, updated_at: new Date().toISOString() }) },
  addSharedImage: async (img) => { const value = { id: id(), created_at: new Date().toISOString(), sender: 'You', ...img }; set(s => ({ sharedImages: [value, ...s.sharedImages] })); if (supabase && !get().demoMode) { const { sender, ...row } = value; await supabase.from('shared_images').insert({ ...row, sender_id: get().user.id, couple_id: get().couple.id }) } },
  addDoodle: async (doodle) => { const value = { id: id(), created_at: new Date().toISOString(), ...doodle }; set(s => ({ doodles: [value, ...s.doodles].slice(0, 20) })); if (supabase && !get().demoMode) await supabase.from('doodles').insert({ ...value, sender_id: get().user.id, couple_id: get().couple.id }) },
  setActiveWidgets: (widgets) => set({ activeWidgets: widgets }),
  addWidget: (widgetId) => set(s => ({ activeWidgets: s.activeWidgets.includes(widgetId) ? s.activeWidgets : [...s.activeWidgets, widgetId] })),
  removeWidget: (widgetId) => set(s => ({ activeWidgets: s.activeWidgets.filter(w => w !== widgetId) })),
  reorderWidgets: (widgets) => set({ activeWidgets: widgets }),
  mergeRealtime: (key, value) => set(s => ({ [key]: [...s[key].filter(x => x.id !== value.id), value] })),
  mergeRealtimeMood: (value) => set(s => value.user_id === s.user?.id ? { myMood: value } : { partnerMood: value }),
  setPresence: (online) => set({ partnerOnline: online }),
  setTyping: (typing) => set({ partnerTyping: typing }),
  updateStartDate: (start_date) => set(s => ({ couple: { ...s.couple, start_date } })),
  unpair: () => set({ partner: null, isPaired: false, partnerOnline: false })
}), { name: 'amour-store', partialize: s => ({ ...s, loading: false }) }))
