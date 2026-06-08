import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon, RotateCcw, Save, Send, Settings, Trash2 } from 'lucide-react'
import { Capacitor, registerPlugin } from '@capacitor/core'
import { differenceInCalendarDays } from 'date-fns'
import { useAppStore } from '../store/appStore'

const WidgetBridge = Capacitor.isNativePlatform() ? registerPlugin('WidgetBridge') : null
const colors = ['#ff0080', '#bf00ff', '#00ffff', '#ff6600', '#ffff00', '#00ff88', '#ffffff']
const sizes = [3, 7, 13]
const BG_KEY = 'amour_doodle_wallpaper'

export default function LockscreenDoodle() {
  const canvas = useRef(null)
  const active = useRef(null)
  const timer = useRef(null)
  const fileInput = useRef(null)
  const nav = useNavigate()
  const location = useLocation()
  const { addDoodle, couple } = useAppStore()
  const [strokes, setStrokes] = useState([])
  const [visible, setVisible] = useState(false)
  const [color, setColor] = useState(colors[0])
  const [width, setWidth] = useState(3)
  const [tool, setTool] = useState('pen')
  const [saved, setSaved] = useState('')
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem(BG_KEY) || '')
  const passedBg = location.state?.imageData || new URLSearchParams(location.search).get('imageData')
  const background = passedBg || wallpaper
  const days = couple?.start_date ? differenceInCalendarDays(new Date(), new Date(couple.start_date)) : 0

  const draw = useCallback(() => {
    const c = canvas.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.clearRect(0, 0, c.width, c.height)
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, c.width, c.height)

    const render = () => {
      strokes.filter(Boolean).forEach((s) => {
        if (s.tool === 'stamp') {
          ctx.save()
          ctx.textAlign = 'center'
          ctx.shadowBlur = 16
          ctx.shadowColor = '#ff0080'
          ctx.fillStyle = '#f0e6ff'
          ctx.font = '700 42px serif'
          ctx.fillText(s.label, s.x, s.y)
          ctx.fillStyle = '#ff6ab0'
          ctx.font = '600 16px sans-serif'
          ctx.fillText(s.sub, s.x, s.y + 26)
          ctx.restore()
          return
        }
        if (s.tool === 'sparkle') {
          s.points.forEach((p, i) => {
            if (i % 3) return
            ctx.save()
            ctx.translate(p.x, p.y)
            ctx.strokeStyle = colors[i % 3]
            ctx.shadowBlur = 18
            ctx.shadowColor = ctx.strokeStyle
            ctx.beginPath()
            ctx.moveTo(-7, 0)
            ctx.lineTo(7, 0)
            ctx.moveTo(0, -7)
            ctx.lineTo(0, 7)
            ctx.stroke()
            ctx.restore()
          })
          return
        }
        ctx.beginPath()
        s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = s.tool === 'marker' ? 0.6 : 1
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.tool === 'marker' ? s.width * 2 : s.width
        ctx.shadowBlur = 18
        ctx.shadowColor = s.color
        ctx.stroke()
        ctx.globalAlpha = 1
      })
    }

    if (background) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, c.width, c.height)
        render()
      }
      img.src = background
    } else {
      render()
    }
  }, [background, strokes])

  useEffect(() => {
    const resize = () => {
      canvas.current.width = innerWidth
      canvas.current.height = innerHeight
      draw()
    }
    resize()
    addEventListener('resize', resize)
    return () => removeEventListener('resize', resize)
  }, [draw])

  useEffect(draw, [draw])

  const show = () => {
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 4000)
  }
  const point = (e) => {
    const p = e.touches?.[0] || e
    return { x: p.clientX, y: p.clientY }
  }
  const start = (e) => {
    e.preventDefault()
    show()
    active.current = { points: [point(e)], color, width, tool }
    setStrokes((prev) => [...prev, active.current])
  }
  const move = (e) => {
    if (!active.current) return
    e.preventDefault()
    active.current.points.push(point(e))
    setStrokes((prev) => [...prev])
  }
  const end = (e) => {
    e.preventDefault()
    active.current = null
  }
  const toast = (msg) => {
    setSaved(msg)
    setTimeout(() => setSaved(''), 1800)
  }

  // Save doodle to doodles table (syncs to partner via Realtime)
  const save = () => {
    const data = canvas.current.toDataURL('image/png')
    addDoodle({ data })
    toast('Saved & sent to partner ✓')
  }

  // Send to partner + set their lockscreen
  const sendToPartner = async () => {
    const data = canvas.current.toDataURL('image/png')
    addDoodle({ data })
    if (WidgetBridge) await WidgetBridge.setLockscreenWallpaper({ image: data }).catch(() => {})
    toast('Sent & set as lockscreen ✓')
  }

  const stampDays = () => {
    setStrokes((s) => [...s, { tool: 'stamp', x: innerWidth / 2, y: 110, label: `${days}`, sub: 'days together' }])
  }

  const setMyLockscreen = async () => {
    const image = canvas.current.toDataURL('image/png')
    if (WidgetBridge) await WidgetBridge.setLockscreenWallpaper({ image })
    toast('Lockscreen set ✓')
  }

  // Pick a permanent wallpaper background
  const pickWallpaper = () => fileInput.current?.click()
  const onWallpaperPicked = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result
      localStorage.setItem(BG_KEY, data)
      setWallpaper(data)
      setStrokes([])
      toast('Wallpaper set ✓')
    }
    reader.readAsDataURL(file)
  }

  return (
    <main className="fixed inset-0 z-50 bg-black">
      <canvas ref={canvas} className="h-full w-full" style={{ touchAction: 'none' }} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
      <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onWallpaperPicked} />
      {saved && <div className="lockscreen-toast">{saved}</div>}
      <button onClick={show} className="tap absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white"><Settings size={18} /></button>
      <div onClick={show} className={`absolute inset-x-3 bottom-5 rounded-3xl border border-white/15 bg-black/65 p-3 text-white backdrop-blur-xl transition-opacity duration-500 ${visible ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="flex justify-center gap-2">{colors.map((c) => <button key={c} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full border-2 ${c === color ? 'border-white' : 'border-transparent'}`} style={{ background: c }} />)}</div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {[['pen', 'Pen'], ['marker', 'Marker'], ['sparkle', 'Sparkle']].map(([v, l]) => <button key={v} onClick={() => setTool(v)} className={`rounded-full px-3 py-1 text-xs ${tool === v ? 'bg-pink' : 'bg-white/10'}`}>{l}</button>)}
          {sizes.map((s) => <button key={s} onClick={() => setWidth(s)} className={`rounded-full px-3 py-1 text-xs ${width === s ? 'bg-purple' : 'bg-white/10'}`}>{s === 3 ? 'Thin' : s === 7 ? 'Medium' : 'Thick'}</button>)}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <button onClick={() => nav(-1)} className="secondary-btn p-2"><ArrowLeft size={16} /></button>
          <button onClick={() => setStrokes((s) => s.slice(0, -1))} className="secondary-btn p-2"><RotateCcw size={16} /></button>
          <button onClick={() => setStrokes([])} className="secondary-btn p-2"><Trash2 size={16} /></button>
          <button onClick={pickWallpaper} className="secondary-btn p-2" title="Set wallpaper"><ImageIcon size={16} /></button>
          <button onClick={stampDays} className="secondary-btn px-3 py-2 text-xs">Days</button>
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button onClick={save} className="primary-btn px-3 py-2 text-xs"><Save size={14} /> Save</button>
          <button onClick={sendToPartner} className="primary-btn px-3 py-2 text-xs"><Send size={14} /> Send</button>
          <button onClick={setMyLockscreen} className="primary-btn px-3 py-2 text-xs">Set Lock</button>
        </div>
      </div>
    </main>
  )
}
