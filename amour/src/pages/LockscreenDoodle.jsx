import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Image as ImageIcon, Redo2, Type, Undo2 } from 'lucide-react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { useAppStore } from '../store/appStore'

const WidgetBridge = Capacitor.isNativePlatform() ? registerPlugin('WidgetBridge') : null
const COLORS = ['#ff0080', '#bf00ff', '#00ffff', '#ff6600', '#ffff00', '#00ff88', '#ffffff', '#ff6ab0', '#56e39f', '#e74c3c']
const SIZES = [2, 5, 10, 18]
const BG_KEY = 'amour_doodle_wallpaper'

export default function LockscreenDoodle() {
  const canvasRef = useRef(null)
  const activeStroke = useRef(null)
  const fileInput = useRef(null)
  const toolbarTimer = useRef(null)
  const nav = useNavigate()

  const user = useAppStore(s => s.user)
  const couple = useAppStore(s => s.couple)
  const partner = useAppStore(s => s.partner)
  const doodles = useAppStore(s => s.doodles)
  const addDoodle = useAppStore(s => s.addDoodle)

  // Drawing state
  const [strokes, setStrokes] = useState([])
  const [undone, setUndone] = useState([])
  const [color, setColor] = useState(COLORS[0])
  const [width, setWidth] = useState(5)
  const [tool, setTool] = useState('pen') // pen | marker | eraser
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [toast, setToast] = useState('')
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem(BG_KEY) || '')
  const [textMode, setTextMode] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [textPos, setTextPos] = useState(null)
  const [partnerDrawing, setPartnerDrawing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [tab, setTab] = useState('draw') // draw | history

  const coupleId = couple?.id
  const userId = user?.id

  // --- Realtime stroke sync ---
  useEffect(() => {
    if (!supabase || !coupleId) return
    const channel = supabase.channel(`doodle-live:${coupleId}`)

    channel
      .on('broadcast', { event: 'stroke' }, ({ payload }) => {
        if (payload.sender === userId) return
        setStrokes(prev => [...prev, payload.stroke])
        setPartnerDrawing(false)
      })
      .on('broadcast', { event: 'drawing' }, ({ payload }) => {
        if (payload.sender === userId) return
        setPartnerDrawing(true)
        setTimeout(() => setPartnerDrawing(false), 2000)
      })
      .on('broadcast', { event: 'clear' }, ({ payload }) => {
        if (payload.sender === userId) return
        setStrokes([])
      })
      .on('broadcast', { event: 'text' }, ({ payload }) => {
        if (payload.sender === userId) return
        setStrokes(prev => [...prev, payload.stroke])
      })
      .on('broadcast', { event: 'undo' }, ({ payload }) => {
        if (payload.sender === userId) return
        setStrokes(prev => prev.slice(0, -1))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [coupleId, userId])

  // Broadcast helper
  const broadcast = useCallback((event, payload) => {
    if (!supabase || !coupleId) return
    supabase.channel(`doodle-live:${coupleId}`).send({
      type: 'broadcast', event, payload: { sender: userId, ...payload }
    })
  }, [coupleId, userId])

  // --- Canvas drawing ---
  const draw = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#0d0118'
    ctx.fillRect(0, 0, c.width, c.height)

    const renderStrokes = () => {
      strokes.filter(Boolean).forEach(s => {
        if (s.type === 'text') {
          ctx.save()
          ctx.fillStyle = s.color
          ctx.font = `600 ${s.fontSize || 20}px sans-serif`
          ctx.shadowBlur = 8
          ctx.shadowColor = s.color
          ctx.fillText(s.text, s.x, s.y)
          ctx.restore()
          return
        }
        if (!s.points || s.points.length === 0) return
        ctx.beginPath()
        s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (s.tool === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out'
          ctx.lineWidth = s.width * 3
          ctx.stroke()
          ctx.globalCompositeOperation = 'source-over'
        } else {
          ctx.globalAlpha = s.tool === 'marker' ? 0.5 : 1
          ctx.strokeStyle = s.color
          ctx.lineWidth = s.tool === 'marker' ? s.width * 2.5 : s.width
          ctx.shadowBlur = s.tool === 'pen' ? 12 : 0
          ctx.shadowColor = s.color
          ctx.stroke()
          ctx.globalAlpha = 1
          ctx.shadowBlur = 0
        }
      })
    }

    if (wallpaper) {
      const img = new Image()
      img.onload = () => { ctx.drawImage(img, 0, 0, c.width, c.height); renderStrokes() }
      img.src = wallpaper
    } else {
      renderStrokes()
    }
  }, [wallpaper, strokes])

  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current
      if (!c) return
      c.width = innerWidth
      c.height = innerHeight
      draw()
    }
    resize()
    addEventListener('resize', resize)
    return () => removeEventListener('resize', resize)
  }, [draw])

  useEffect(draw, [draw])

  // --- Touch/mouse handlers ---
  const showToolbar = () => {
    setToolbarVisible(true)
    clearTimeout(toolbarTimer.current)
    toolbarTimer.current = setTimeout(() => setToolbarVisible(false), 5000)
  }

  const getPoint = (e) => {
    const p = e.touches?.[0] || e
    return { x: p.clientX, y: p.clientY }
  }

  const onStart = (e) => {
    e.preventDefault()
    if (textMode) {
      setTextPos(getPoint(e))
      return
    }
    showToolbar()
    activeStroke.current = { points: [getPoint(e)], color, width, tool }
    setStrokes(prev => [...prev, activeStroke.current])
    setUndone([])
    broadcast('drawing', {})
  }

  const onMove = (e) => {
    if (!activeStroke.current) return
    e.preventDefault()
    activeStroke.current.points.push(getPoint(e))
    setStrokes(prev => [...prev])
  }

  const onEnd = (e) => {
    e.preventDefault()
    if (!activeStroke.current) return
    const stroke = { ...activeStroke.current, points: [...activeStroke.current.points] }
    activeStroke.current = null
    broadcast('stroke', { stroke })
  }

  // --- Actions ---
  const undo = () => {
    setStrokes(prev => {
      if (prev.length === 0) return prev
      setUndone(u => [...u, prev[prev.length - 1]])
      broadcast('undo', {})
      return prev.slice(0, -1)
    })
  }

  const redo = () => {
    setUndone(u => {
      if (u.length === 0) return u
      const last = u[u.length - 1]
      setStrokes(prev => [...prev, last])
      broadcast('stroke', { stroke: last })
      return u.slice(0, -1)
    })
  }

  const clearCanvas = () => {
    setStrokes([])
    setUndone([])
    broadcast('clear', {})
  }

  const addText = () => {
    if (!textInput.trim() || !textPos) return
    const stroke = { type: 'text', text: textInput, x: textPos.x, y: textPos.y, color, fontSize: width * 4 + 12 }
    setStrokes(prev => [...prev, stroke])
    broadcast('text', { stroke })
    setTextMode(false)
    setTextInput('')
    setTextPos(null)
  }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const saveSnapshot = async () => {
    const data = canvasRef.current.toDataURL('image/png')
    addDoodle({ data })
    showToast('Saved & synced ✓')
  }

  const setAsLockscreen = async () => {
    const image = canvasRef.current.toDataURL('image/png')
    if (WidgetBridge) await WidgetBridge.setLockscreenWallpaper({ image }).catch(() => {})
    showToast('Lockscreen set ✓')
  }

  const pickWallpaper = () => fileInput.current?.click()
  const onWallpaperPicked = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      localStorage.setItem(BG_KEY, reader.result)
      setWallpaper(reader.result)
      showToast('Background set ✓')
    }
    reader.readAsDataURL(file)
  }

  const loadDoodle = (doodle) => {
    setWallpaper(doodle.data)
    setStrokes([])
    setTab('draw')
    showToast('Loaded as background')
  }

  // --- History tab ---
  if (tab === 'history') {
    return (
      <main className="fixed inset-0 z-50 overflow-auto bg-bg p-4">
        <header className="flex items-center gap-3 pb-4">
          <button onClick={() => setTab('draw')} className="tap rounded-full bg-white/5 p-2"><ArrowLeft size={18} /></button>
          <h1 className="display text-xl">Doodle History</h1>
        </header>
        {doodles.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted">No saved doodles yet. Draw something!</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {doodles.map(d => (
              <button key={d.id} onClick={() => loadDoodle(d)} className="tap overflow-hidden rounded-2xl border border-pink/15">
                <img src={d.data} className="aspect-[9/16] w-full object-cover" />
                <div className="bg-black/40 p-2 text-center text-[10px] text-muted">
                  {d.created_at ? format(new Date(d.created_at), 'MMM d, h:mm a') : 'Doodle'}
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    )
  }

  // --- Main canvas ---
  return (
    <main className="fixed inset-0 z-50 bg-black">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ touchAction: 'none' }}
        onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
        onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
      />

      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onWallpaperPicked} />

      {/* Toast */}
      {toast && <div className="lockscreen-toast">{toast}</div>}

      {/* Partner drawing indicator */}
      {partnerDrawing && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 animate-pulse rounded-full bg-pink/80 px-4 py-1.5 text-xs font-semibold text-white shadow-lg">
          {partner?.name?.split(' ')[0] || 'Partner'} is drawing...
        </div>
      )}

      {/* Text input overlay */}
      {textMode && textPos && (
        <div className="absolute left-4 right-4 top-1/3 rounded-2xl border border-pink/30 bg-black/80 p-4 backdrop-blur">
          <input
            autoFocus
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-xl bg-white/10 px-4 py-3 text-white placeholder:text-muted"
            onKeyDown={e => e.key === 'Enter' && addText()}
          />
          <div className="mt-3 flex gap-2">
            <button onClick={() => { setTextMode(false); setTextPos(null) }} className="secondary-btn flex-1 py-2 text-xs">Cancel</button>
            <button onClick={addText} className="primary-btn flex-1 py-2 text-xs">Place Text</button>
          </div>
        </div>
      )}

      {/* Toolbar toggle */}
      <button onClick={showToolbar} className="tap absolute right-3 top-3 rounded-full bg-white/10 p-2.5 text-white backdrop-blur">
        <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20"><circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/><circle cx="16" cy="10" r="2"/></svg>
      </button>

      {/* Toolbar */}
      <div className={`absolute inset-x-2 bottom-3 rounded-3xl border border-white/10 bg-black/70 p-3 backdrop-blur-xl transition-all duration-300 ${toolbarVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
        {/* Tools row */}
        <div className="flex items-center justify-center gap-1.5">
          {[['pen', '✏️'], ['marker', '🖌️'], ['eraser', '⬜']].map(([v, icon]) => (
            <button key={v} onClick={() => { setTool(v); setTextMode(false) }}
              className={`rounded-full px-3 py-1.5 text-xs ${tool === v && !textMode ? 'bg-pink text-white' : 'bg-white/10 text-white/70'}`}>
              {icon} {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={() => setTextMode(!textMode)}
            className={`rounded-full px-3 py-1.5 text-xs ${textMode ? 'bg-pink text-white' : 'bg-white/10 text-white/70'}`}>
            <Type size={13} className="mr-1 inline" />Text
          </button>
        </div>

        {/* Colors */}
        <div className="mt-2.5 flex justify-center gap-1.5">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full border-2 ${c === color ? 'border-white scale-110' : 'border-transparent'}`}
              style={{ background: c }} />
          ))}
        </div>

        {/* Brush size */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          <span className="text-[10px] text-muted">Size</span>
          {SIZES.map(s => (
            <button key={s} onClick={() => setWidth(s)}
              className={`flex h-7 w-7 items-center justify-center rounded-full ${width === s ? 'bg-pink' : 'bg-white/10'}`}>
              <span className="rounded-full bg-white" style={{ width: s + 2, height: s + 2 }} />
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          <button onClick={() => nav(-1)} className="secondary-btn p-2"><ArrowLeft size={15} /></button>
          <button onClick={undo} className="secondary-btn p-2"><Undo2 size={15} /></button>
          <button onClick={redo} className="secondary-btn p-2"><Redo2 size={15} /></button>
          <button onClick={clearCanvas} className="secondary-btn px-3 py-2 text-xs">Clear</button>
          <button onClick={pickWallpaper} className="secondary-btn p-2" title="Set background"><ImageIcon size={15} /></button>
          <button onClick={() => setTab('history')} className="secondary-btn p-2" title="History"><Clock size={15} /></button>
          <button onClick={saveSnapshot} className="primary-btn px-3 py-2 text-xs">💾 Save</button>
          <button onClick={setAsLockscreen} className="primary-btn px-3 py-2 text-xs">🔒 Lock</button>
        </div>
      </div>
    </main>
  )
}
