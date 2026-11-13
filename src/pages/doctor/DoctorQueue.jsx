import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CircleCheck, Coffee, PhoneCall, RotateCcw, SkipForward, Stethoscope } from 'lucide-react'
import {
  NOW,
  callNext,
  completeToken,
  doctorById,
  doneFor,
  formatTime,
  lineFor,
  pad3,
  recallToken,
  servingFor,
  setDoctorStatus,
  sexLabel,
  skipToken,
  skippedFor,
  useQueue,
  waitingFor,
} from '../../lib/queue.js'
import { Button, ButtonLink, DoctorStatus, Field, Meter, Panel, Select, Segmented, Textarea, TokenChip } from '../../components/ui.jsx'
import { EARLIER_SEEN, PriorityBadge, VisitPill } from './doctorKit.jsx'

/** Shortcut hint inside a button (always visible, unlike the shared Kbd). */
function ButtonKbd({ children }) {
  return (
    <kbd className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-current/20 px-1 font-sans text-[10.5px] font-semibold opacity-70">
      {children}
    </kbd>
  )
}

/** Seconds the current patient has been in consult: (NOW − startedAt) plus real time since it appeared. */
function useConsultSeconds(token) {
  const [now, setNow] = useState(() => Date.now())
  const [anchor, setAnchor] = useState({ id: null, at: 0 })
  const tokenId = token?.id ?? null
  if (token && anchor.id !== token.id) setAnchor({ id: token.id, at: Date.now() })

  useEffect(() => {
    if (!tokenId) return undefined
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [tokenId])

  if (!token) return 0
  const live = anchor.id === token.id ? Math.max(0, Math.floor((now - anchor.at) / 1000)) : 0
  return (NOW - token.startedAt) * 60 + live
}

function formatClock(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const steps = [
  { label: 'Called', Icon: CircleCheck },
  { label: 'In consultation', Icon: Stethoscope },
  { label: 'Completed', Icon: CircleCheck },
]

function ConsultSteps({ current }) {
  return (
    <ol
      aria-label="Consultation status"
      className="flex items-center gap-2 border-b border-qc-line bg-qc-ivory/40 px-5 py-3 text-xs font-semibold"
    >
      {steps.map(({ label, Icon }, i) => {
        const tone =
          i < current ? 'text-qc-teal' : i === current ? 'bg-qc-ink text-qc-ivory' : 'text-qc-muted'
        return (
          <li key={label} className="flex items-center gap-2" aria-current={i === current ? 'step' : undefined}>
            <span className={`flex h-6 items-center gap-1.5 rounded-full px-2.5 [&_svg]:size-3.5 ${tone}`}>
              <Icon aria-hidden="true" />
              {label}
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={`h-px w-6 sm:w-10 ${i < current ? 'bg-qc-teal' : 'bg-qc-line'}`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default function DoctorQueue() {
  const state = useQueue()
  const [doctorId, setDoctorId] = useState('d1')
  const [notes, setNotes] = useState({})

  const doctor = doctorById(state, doctorId)
  const serving = servingFor(state, doctorId)
  const line = lineFor(state, doctorId)
  const waiting = waitingFor(state, doctorId)
  const skipped = skippedFor(state, doctorId)
  const done = doneFor(state, doctorId)
  const seconds = useConsultSeconds(serving)

  const elapsedMin = serving ? Math.floor(seconds / 60) : 0
  const remaining = serving ? Math.max(doctor.avgConsult - elapsedMin, 0) : 0
  const estimateAt = (lineIndex) => remaining + lineIndex * doctor.avgConsult
  const clearsAt = NOW + remaining + line.length * doctor.avgConsult

  const seen = done.length + (EARLIER_SEEN[doctorId] ?? 0)
  const durations = done.map((tk) => tk.endedAt - tk.startedAt)
  const avgConsult = durations.length
    ? Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length)
    : doctor.avgConsult
  const capacityUsed = seen + line.length + (serving ? 1 : 0)

  const note = serving ? (notes[serving.id] ?? '') : ''
  const onBreak = doctor.status === 'break'

  function complete(andCallNext) {
    if (!serving) return
    completeToken(serving.id, note.trim())
    if (andCallNext) callNext(doctorId)
  }

  function notPresent() {
    if (!serving) return
    skipToken(serving.id)
    callNext(doctorId)
  }

  // Keyboard shortcut: D completes the current consult, or calls the next patient when idle.
  const shortcut = useRef(() => {})
  shortcut.current = () => {
    if (serving) complete(false)
    else if (line.length > 0) callNext(doctorId)
  }
  useEffect(() => {
    function onKey(e) {
      if (e.key.toLowerCase() !== 'd' || e.metaKey || e.ctrlKey || e.altKey) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return
      e.preventDefault()
      shortcut.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-qc-teal uppercase">
            Room {doctor.room} · {doctor.dept}
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-qc-ink md:text-[28px]">
            {doctor.name}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="doc-switch">
            Viewing as (demo)
          </label>
          <div className="w-52">
            <Select id="doc-switch" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              {state.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </div>
          <Segmented
            label="My availability"
            value={onBreak ? 'break' : 'accepting'}
            onChange={(v) =>
              setDoctorStatus(doctorId, v === 'break' ? 'break' : serving ? 'consult' : 'available')
            }
            options={[
              { value: 'accepting', label: 'Accepting' },
              { value: 'break', label: 'Break', icon: Coffee },
            ]}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section
          aria-label="Current patient"
          className="flex min-w-0 flex-col overflow-hidden rounded-qc border border-qc-line bg-qc-surface"
        >
          <ConsultSteps current={serving ? 1 : -1} />

          {serving ? (
            <div className="flex flex-1 flex-col">
              <div className="grid gap-6 px-5 py-6 sm:grid-cols-[auto_1fr] sm:px-7">
                <span className="relative inline-flex h-24 shrink-0 items-center gap-3 self-start rounded-[6px] bg-qc-ink px-7 font-display text-6xl font-extrabold tracking-[-0.01em] text-qc-ivory tabular-nums [mask:radial-gradient(circle_at_0_50%,transparent_4px,#000_4.5px)_left/51%_100%_no-repeat,radial-gradient(circle_at_100%_50%,transparent_4px,#000_4.5px)_right/51%_100%_no-repeat]">
                  <span className="text-3xl font-bold opacity-60">{serving.prefix}</span>
                  <span>{pad3(serving.number)}</span>
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <VisitPill status="serving" size="md" />
                    <PriorityBadge priority={serving.priority} />
                    <span className="text-xs font-medium text-qc-muted">
                      {serving.kind === 'appt' ? 'Appointment' : 'Walk-in'}
                    </span>
                  </div>
                  <h2 className="mt-2 font-display text-[26px] leading-tight font-extrabold tracking-tight text-qc-ink">
                    {serving.patient.name}
                  </h2>
                  <p className="mt-0.5 text-sm text-qc-muted">
                    {[
                      serving.patient.age != null && `${serving.patient.age} yrs`,
                      serving.patient.sex && sexLabel(serving.patient.sex),
                      serving.patient.phone,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {serving.flags && <p className="mt-1 text-xs font-medium qc-attn">{serving.flags}</p>}
                  <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-xs text-qc-muted">Reason</dt>
                      <dd className="font-medium text-qc-ink">{serving.reason}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-qc-muted">Checked in</dt>
                      <dd className="font-medium text-qc-ink tabular-nums">{formatTime(serving.checkedInAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-qc-muted">In consult</dt>
                      <dd
                        className="font-display text-lg leading-tight font-extrabold text-qc-ink tabular-nums"
                        aria-live="off"
                      >
                        {formatClock(seconds)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="border-t border-qc-line px-5 py-4 sm:px-7">
                <Field
                  label="Consultation notes"
                  htmlFor="consult-notes"
                  aside="Optional"
                  hint="Saved to this visit. Visible to clinic staff only."
                >
                  <Textarea
                    id="consult-notes"
                    placeholder="Findings, prescription summary, follow-up…"
                    value={note}
                    onChange={(e) => setNotes((n) => ({ ...n, [serving.id]: e.target.value }))}
                  />
                </Field>
              </div>

              <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-qc-line bg-qc-ivory/40 px-5 py-4 sm:px-7">
                <Button variant="primary" size="lg" onClick={() => complete(true)} disabled={line.length === 0}>
                  <CircleCheck aria-hidden="true" /> Complete &amp; call next
                </Button>
                <Button variant="dark" size="lg" onClick={() => complete(false)}>
                  Complete <ButtonKbd>D</ButtonKbd>
                </Button>
                <Button variant="ghost" size="lg" className="sm:ml-auto" onClick={notPresent}>
                  <SkipForward aria-hidden="true" /> Not present
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-5 py-14 text-center sm:px-7">
              <span className="flex size-12 items-center justify-center rounded-full bg-qc-teal/12 text-qc-teal [&_svg]:size-6">
                {onBreak ? <Coffee aria-hidden="true" /> : <Stethoscope aria-hidden="true" />}
              </span>
              <div>
                <h2 className="font-display text-xl font-extrabold tracking-tight text-qc-ink">
                  {onBreak ? 'You’re on break' : 'No patient in consultation'}
                </h2>
                <p className="mt-1 text-sm text-qc-muted">
                  {line.length === 0
                    ? 'Nobody is waiting for you right now.'
                    : `Next up: ${line[0].prefix} ${pad3(line[0].number)} · ${line[0].patient.name}${
                        line[0].status === 'called' ? ' (already called)' : ''
                      }`}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="mt-1"
                disabled={line.length === 0}
                onClick={() => callNext(doctorId)}
              >
                <PhoneCall aria-hidden="true" /> {onBreak ? 'End break & call next' : 'Call next'}
                <ButtonKbd>D</ButtonKbd>
              </Button>
            </div>
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-5">
          <Panel
            title="Up next"
            subtitle={
              waiting.length
                ? `${waiting.length} waiting · clears around ${formatTime(clearsAt)}`
                : 'No one waiting'
            }
          >
            {waiting.length === 0 ? (
              <p className="px-5 py-6 text-sm text-qc-muted">New check-ins for you will appear here.</p>
            ) : (
              <ol>
                {waiting.map((tk, i) => {
                  const lineIndex = line.findIndex((l) => l.id === tk.id)
                  return (
                    <li
                      key={tk.id}
                      className={`flex items-center gap-3 border-b border-qc-line px-5 py-3 last:border-0 ${
                        i === 0 ? 'bg-qc-ivory/50' : ''
                      }`}
                    >
                      <TokenChip prefix={tk.prefix} number={pad3(tk.number)} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold text-qc-ink">{tk.patient.name}</span>
                          <PriorityBadge priority={tk.priority} />
                        </p>
                        <p className="truncate text-xs text-qc-muted">
                          {tk.patient.age}
                          {tk.patient.sex} · {tk.reason}
                        </p>
                      </div>
                      <span className="text-right text-xs text-qc-muted tabular-nums">
                        waiting
                        <span className="block font-semibold text-qc-ink">{NOW - tk.checkedInAt} min</span>
                      </span>
                      <span className="sr-only">Estimated {estimateAt(lineIndex)} minutes</span>
                    </li>
                  )
                })}
              </ol>
            )}
          </Panel>

          {skipped.length > 0 && (
            <Panel title="Skipped" subtitle="Not present when called">
              <ul>
                {skipped.map((tk) => (
                  <li
                    key={tk.id}
                    className="flex items-center gap-3 border-b border-qc-line px-5 py-2.5 last:border-0"
                  >
                    <TokenChip prefix={tk.prefix} number={pad3(tk.number)} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-qc-ink">{tk.patient.name}</span>
                    <button
                      type="button"
                      className="inline-flex h-7 shrink-0 items-center justify-center gap-2 rounded-qc-sm border border-qc-teal/35 bg-qc-surface px-2.5 text-xs font-semibold whitespace-nowrap text-qc-teal outline-none transition-[background-color,color,border-color,transform] duration-150 select-none hover:border-qc-teal hover:bg-qc-teal/5 focus-visible:ring-2 focus-visible:ring-qc-coral focus-visible:ring-offset-2 focus-visible:ring-offset-qc-ivory active:translate-y-px [&_svg]:size-4 [&_svg]:shrink-0"
                      onClick={() => recallToken(tk.id)}
                    >
                      <RotateCcw aria-hidden="true" /> Recall
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel title="Today" actions={<DoctorStatus status={doctor.status} />} bodyClassName="px-5 py-4">
            <dl className="grid grid-cols-3 gap-3">
              <div>
                <dt className="text-[11.5px] text-qc-muted">Seen</dt>
                <dd className="font-display text-xl font-extrabold text-qc-ink tabular-nums">{seen}</dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-qc-muted">Avg consult</dt>
                <dd className="font-display text-xl font-extrabold text-qc-ink tabular-nums">
                  {avgConsult}
                  <span className="text-xs font-bold text-qc-muted"> min</span>
                </dd>
              </div>
              <div>
                <dt className="text-[11.5px] text-qc-muted">Capacity</dt>
                <dd className="font-display text-xl font-extrabold text-qc-ink tabular-nums">
                  {capacityUsed}
                  <span className="text-xs font-bold text-qc-muted">/{doctor.capacity}</span>
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <Meter
                value={capacityUsed}
                max={doctor.capacity}
                label="Daily capacity used"
                tone={capacityUsed / doctor.capacity > 0.85 ? 'amber' : 'teal'}
              />
            </div>
          </Panel>
        </div>
      </div>

      <Panel
        title="Recent consultations"
        actions={
          <ButtonLink variant="ghost" size="sm" href="/doctor/history">
            Full history <ArrowRight aria-hidden="true" />
          </ButtonLink>
        }
      >
        {done.length === 0 ? (
          <p className="px-5 py-6 text-sm text-qc-muted">Completed consultations will show up here.</p>
        ) : (
          <ul className="divide-y divide-qc-line">
            {done.slice(0, 5).map((tk) => (
              <li
                key={tk.id}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-2.5 sm:grid-cols-[auto_1fr_140px_90px_auto]"
              >
                <TokenChip prefix={tk.prefix} number={pad3(tk.number)} size="sm" />
                <span className="min-w-0 truncate text-sm text-qc-ink">
                  <span className="font-medium">{tk.patient.name}</span>
                  <span className="text-qc-muted"> · {tk.reason}</span>
                </span>
                <span className="hidden text-xs text-qc-muted tabular-nums sm:block">
                  {formatTime(tk.startedAt)} – {formatTime(tk.endedAt)}
                </span>
                <span className="hidden text-xs font-semibold text-qc-ink tabular-nums sm:block">
                  {tk.endedAt - tk.startedAt} min
                </span>
                <VisitPill status="done" />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
