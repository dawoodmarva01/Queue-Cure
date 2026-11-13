import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Ellipsis, X } from 'lucide-react'
import { buttonClass } from '../../components/ui.jsx'
import { doneFor } from '../../lib/queue.js'

/* ---------- media query ---------- */

export function useMediaQuery(query) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', cb)
      return () => mql.removeEventListener('change', cb)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/* ---------- small helpers ---------- */

/** "10:21" — clock time without the AM/PM suffix. */
export function shortTime(minutes) {
  const h = ((Math.floor(minutes / 60) + 11) % 12) + 1
  return `${h}:${String(Math.round(minutes % 60)).padStart(2, '0')}`
}

const chipMask =
  '[mask:radial-gradient(circle_at_0_50%,transparent_4px,#000_4.5px)_left/51%_100%_no-repeat,radial-gradient(circle_at_100%_50%,transparent_4px,#000_4.5px)_right/51%_100%_no-repeat]'

/** Mid-size token chip (between TokenChip sm and lg), used in "Now serving". */
export function MidTokenChip({ prefix, number, dark = true }) {
  return (
    <span
      className={`relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] px-2.5 font-display text-sm font-extrabold tracking-[-0.01em] tabular-nums ${chipMask} ${
        dark ? 'bg-qc-ink text-qc-ivory' : 'border border-qc-line bg-qc-ivory text-qc-ink'
      }`}
    >
      <span className="text-[0.8em] font-bold opacity-60">{prefix}</span>
      <span>{number}</span>
    </span>
  )
}

/* ---------- popover menu ---------- */

export const menuItemClass =
  'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-medium text-qc-text outline-none hover:bg-qc-ivory focus-visible:bg-qc-ivory disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:text-qc-muted'

/** Ellipsis button that opens a small menu. `children(close)` renders the items. */
export function ActionMenu({ label, children, className = '' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <span ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={buttonClass({ variant: 'ghost', size: 'iconSm', className: 'rounded-qc-sm' })}
      >
        <Ellipsis aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-full right-0 z-40 mt-1 min-w-52 rounded-qc border border-qc-line bg-qc-surface p-1.5 text-qc-text shadow-qc-pop"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </span>
  )
}

export function MenuLabel({ children }) {
  return (
    <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-qc-muted uppercase">
      {children}
    </p>
  )
}

export function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-qc-line" />
}

/* ---------- dialog ---------- */

/** Bottom sheet on mobile, centered dialog from sm up. */
export function Dialog({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-qc-ink/40" onClick={onClose} />
      <div className="relative flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-qc bg-qc-surface shadow-qc-pop sm:rounded-qc">
        <header className="flex items-start justify-between gap-4 border-b border-qc-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-qc-ink">{title}</h2>
            {subtitle && <div className="mt-0.5 text-[13px] text-qc-muted">{subtitle}</div>}
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className={buttonClass({ variant: 'ghost', size: 'iconSm' })}>
            <X aria-hidden="true" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

/* ---------- toasts ---------- */

export function useToasts() {
  const [toasts, setToasts] = useState([])
  const push = useCallback((text, tone = 'default') => {
    const id = `${Date.now()}${Math.random()}`
    setToasts((list) => [...list, { id, text, tone }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 4000)
  }, [])
  return [toasts, push]
}

export function ToastRegion({ toasts }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 md:right-6 md:bottom-6 md:left-auto md:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto max-w-sm rounded-qc px-4 py-3 text-[13px] font-medium shadow-qc-pop ${
            t.tone === 'alert' ? 'bg-qc-skipped text-white' : 'bg-qc-ink text-qc-ivory'
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  )
}

/* ---------- consultations completed before the live demo data ---------- */

const earlierNames = [
  'Rohan Das', 'Fatima Khan', 'Lakshmi Menon', 'Imran Siddiqui', 'Neha Joshi', 'Vivek Rao',
  'Anjali Deshpande', 'Harini Krishnan', 'Nikhil Jain', 'Zara Fernandes', 'Kiran Bhat', 'Sameer Kohli',
  'Bhavna Trivedi', 'Arvind Swamy', 'Gayatri Iyengar', 'Deepak Chawla', 'Ritu Malhotra', 'Sanjay Hegde',
  'Pallavi Naik', 'Yusuf Pathan',
]
const earlierReasons = {
  d1: ['Fever, 3 days', 'Diabetes review', 'Body ache & fatigue', 'Persistent cough', 'Follow-up: BP review'],
  d2: ['Post-angioplasty follow-up', 'Palpitations', 'Chest discomfort on exertion'],
  d3: ['Vaccination – 4 yr booster', 'Growth check-up', 'Ear pain', 'Fever & cold'],
  d4: ['Knee pain', 'Lower back pain', 'Fracture follow-up – wrist'],
}

/**
 * Consults each doctor finished before the first token in the store
 * (GM-001…007, CA-001…003, PE-001…006, OR-001…004), built backwards from
 * when that doctor's first stored consult started.
 */
export function earlierVisits(state) {
  const rows = []
  let nameIdx = 0
  for (const doctor of state.doctors) {
    const reasons = earlierReasons[doctor.id]
    if (!reasons) continue
    const own = state.tokens.filter((tk) => tk.doctorId === doctor.id && tk.prefix === doctor.prefix)
    if (own.length === 0) continue
    const first = own.reduce((a, b) => (a.number < b.number ? a : b))
    const firstStart = first.startedAt ?? first.checkedInAt + 20
    for (let n = 1; n < first.number; n += 1) {
      const startedAt = firstStart - (first.number - n) * doctor.avgConsult
      rows.push({
        id: `early-${doctor.id}-${n}`,
        prefix: doctor.prefix,
        number: n,
        doctorId: doctor.id,
        patient: { name: earlierNames[nameIdx % earlierNames.length] },
        reason: reasons[n % reasons.length],
        kind: n % 3 === 0 ? 'appt' : 'walkin',
        priority: 'normal',
        status: 'done',
        checkedInAt: startedAt - 4,
        startedAt,
        endedAt: startedAt + doctor.avgConsult,
      })
      nameIdx += 1
    }
  }
  return rows
}

/** Consultations completed today for a doctor (or the whole clinic when doctorId is omitted). */
export function seenToday(state, doctorId) {
  const early = earlierVisits(state)
  if (!doctorId) return state.tokens.filter((tk) => tk.status === 'done').length + early.length
  return doneFor(state, doctorId).length + early.filter((r) => r.doctorId === doctorId).length
}
