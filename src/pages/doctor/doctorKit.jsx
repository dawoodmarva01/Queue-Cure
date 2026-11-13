import { ArrowUp, CircleCheck, Hourglass, PhoneCall, Siren, SkipForward, Stethoscope } from 'lucide-react'
import { NOW, tokenCode } from '../../lib/queue.js'

/** Consultations completed earlier today, before the shared demo data starts (Dr. Ananya Rao). */
const earlier = [
  [7, 'Neha Joshi', 33, 'F', '+91 98450 31877', 'Follow-up: BP review', 'walkin', 9 * 60 + 26],
  [6, 'Imran Siddiqui', 39, 'M', '+91 99001 72310', 'Fever, 3 days', 'appt', 9 * 60 + 17],
  [5, 'Lakshmi Menon', 57, 'F', '+91 98860 41922', 'Acidity, nausea', 'walkin', 9 * 60 + 8],
  [4, 'Rohan Das', 26, 'M', '+91 97400 18834', 'Body ache & fatigue', 'walkin', 8 * 60 + 59],
  [3, 'Fatima Khan', 48, 'F', '+91 98440 50271', 'Diabetes review', 'appt', 8 * 60 + 50],
  [2, 'Arjun Kapoor', 31, 'M', '+91 98861 66019', 'Persistent cough', 'walkin', 8 * 60 + 41],
  [1, 'Priya Sharma', 44, 'F', '+91 99020 23455', 'Follow-up: BP review', 'walkin', 8 * 60 + 32],
]

export const EARLIER_VISITS = earlier.map(([number, name, age, sex, phone, reason, kind, checkedInAt]) => ({
  id: `early-${number}`,
  prefix: 'GM',
  number,
  doctorId: 'd1',
  patient: { name, age, sex, phone },
  reason,
  kind,
  priority: 'normal',
  status: 'done',
  checkedInAt,
  calledAt: checkedInAt + 4,
  startedAt: checkedInAt + 4,
  endedAt: checkedInAt + 13,
  note: '',
}))

/** Number of consultations each doctor finished before the demo data starts. */
export const EARLIER_SEEN = { d1: EARLIER_VISITS.length, d2: 6, d3: 5, d4: 4, d5: 3, d6: 0 }

/** Every visit for a doctor today (store tokens + earlier mock visits), latest check-in first. */
export function visitsFor(state, doctorId) {
  const extra = EARLIER_VISITS.filter((v) => v.doctorId === doctorId)
  return [...state.tokens.filter((tk) => tk.doctorId === doctorId), ...extra].sort(
    (a, b) => b.checkedInAt - a.checkedInAt,
  )
}

/** Minutes from check-in to consult (or so far, while still in line). null when not applicable. */
export function visitWait(tk) {
  if (tk.status === 'waiting' || tk.status === 'called') return NOW - tk.checkedInAt
  if (tk.startedAt != null) return tk.startedAt - tk.checkedInAt
  return null
}

export function consultMinutes(tk) {
  return tk.status === 'done' && tk.startedAt != null ? tk.endedAt - tk.startedAt : null
}

export function matchesSearch(tk, term) {
  const q = term.trim().toLowerCase()
  if (!q) return true
  const compact = q.replace(/[\s-]/g, '')
  return (
    tk.patient.name.toLowerCase().includes(q) ||
    tokenCode(tk).toLowerCase().replace('-', '').includes(compact) ||
    (tk.patient.phone ?? '').replace(/\s/g, '').includes(compact)
  )
}

const pills = {
  waiting: { label: 'Waiting', Icon: Hourglass, className: 'bg-qc-waiting/20 qc-attn' },
  called: { label: 'Called', Icon: PhoneCall, className: 'bg-qc-upcoming/15 qc-info' },
  serving: { label: 'In consult', Icon: Stethoscope, className: 'bg-qc-serving text-qc-surface' },
  done: { label: 'Done', Icon: CircleCheck, className: 'bg-qc-completed/12 text-qc-text [&_svg]:text-qc-completed' },
  skipped: { label: 'Skipped', Icon: SkipForward, className: 'bg-qc-skipped/14 qc-alert' },
}

/** Visit status pill. size "md" is the larger pill used on the current patient card. */
export function VisitPill({ status, size = 'sm' }) {
  const { label, Icon, className } = pills[status]
  const sizes = { sm: 'h-5 px-2 text-[11px] [&_svg]:size-3', md: 'h-6 px-2.5 text-xs [&_svg]:size-3.5' }
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${sizes[size]} ${className}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}

const flags = {
  emergency: { label: 'Emergency', Icon: Siren, className: 'border border-qc-skipped/50 bg-qc-skipped/15 qc-alert' },
  priority: { label: 'Priority', Icon: ArrowUp, className: 'bg-qc-coral/15 text-qc-text [&_svg]:text-qc-coral' },
}

/** Priority / emergency badge shown next to a patient name. Renders nothing for normal priority. */
export function PriorityBadge({ priority }) {
  const flag = flags[priority]
  if (!flag) return null
  const { label, Icon, className } = flag
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center gap-1 rounded-[4px] px-1.5 text-[10.5px] font-bold tracking-wide uppercase [&_svg]:size-3 ${className}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}
