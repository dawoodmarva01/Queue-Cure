import { useState } from 'react'
import {
  Activity,
  ArrowRight,
  CalendarClock,
  Check,
  CircleCheck,
  Coffee,
  Mail,
  PhoneCall,
  Settings,
  SkipForward,
  Ticket,
  Undo2,
  UserPlus,
} from 'lucide-react'
import { ButtonLink, Avatar, DoctorStatus, Meter, Panel, SmartLink, TokenChip } from '../../components/ui.jsx'
import {
  CLINIC,
  NOW,
  clinicStats,
  doctorById,
  formatTime,
  lineFor,
  pad3,
  recallToken,
  servingFor,
  setDoctorStatus,
  useQueue,
  waitingFor,
} from '../../lib/queue.js'
import { AdminPage, ApptStatusBadge, EmptyState, PENDING_INVITE, adminButton, normalizeApptStatus } from './shared.jsx'

/** Tokens issued per doctor before the demo data starts (keeps capacity figures realistic). */
const EARLIER_TOKENS = { d1: 7, d2: 3, d3: 6, d4: 4, d5: 0, d6: 0 }

const statusDot = {
  consult: { label: 'In consult', className: 'bg-qc-teal' },
  available: { label: 'Available', className: 'bg-qc-sage' },
  break: { label: 'On break', className: 'bg-qc-amber' },
  off: { label: 'Off duty', className: 'bg-qc-line' },
}

/** Hourly check-ins today vs. a typical Tuesday (mock history). */
const HOURS = ['9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p']
const TODAY_VOLUME = [14, 22, 9, 0, 0, 0, 0, 0, 0]
const TYPICAL_VOLUME = [12, 24, 26, 18, 10, 14, 19, 16, 8]
const CURRENT_HOUR = Math.floor(NOW / 60) - 9

function clockLabel(minutes) {
  return formatTime(minutes).replace(/\s?[AP]M$/, '')
}

/** Minutes until a doctor's current line clears: rest of the current consult + everyone waiting. */
function clearsBy(state, doctor) {
  const serving = servingFor(state, doctor.id)
  const remaining = serving ? Math.max(0, serving.startedAt + doctor.avgConsult - NOW) : 0
  const breakPenalty = doctor.status === 'break' ? 10 : doctor.status === 'off' ? 30 : 0
  return NOW + remaining + lineFor(state, doctor.id).length * doctor.avgConsult + breakPenalty
}

function Stat({ label, value, unit, note, className = '' }) {
  return (
    <div className={`min-w-0 bg-qc-surface px-5 py-4 ${className}`}>
      <p className="text-[12px] font-medium text-qc-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1 font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] text-qc-ink tabular-nums">
        {value}
        {unit && <span className="text-sm font-bold tracking-normal text-qc-muted">{unit}</span>}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-qc-muted">{note}</p>
    </div>
  )
}

function LiveFloor({ state }) {
  return (
    <Panel
      title="Live floor"
      subtitle="Every doctor's queue, in real time"
      actions={
        <SmartLink href="/reception" className={adminButton('link', 'sm')}>
          Open reception desk
          <ArrowRight aria-hidden="true" />
        </SmartLink>
      }
    >
      <ul className="divide-y divide-qc-line">
        {state.doctors.map((doctor) => {
          const serving = servingFor(state, doctor.id)
          const waiting = waitingFor(state, doctor.id).length
          const issued = state.tokens.filter((tk) => tk.doctorId === doctor.id).length + (EARLIER_TOKENS[doctor.id] ?? 0)
          const dot = statusDot[doctor.status]
          return (
            <li key={doctor.id} className="flex flex-col gap-3 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="relative">
                  <Avatar initials={doctor.initials} tone="teal" />
                  <span
                    aria-label={dot.label}
                    className={`absolute -right-0.5 -bottom-0.5 inline-block size-2.5 rounded-full ring-2 ring-white ${dot.className}`}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-[15px] font-bold text-qc-ink">{doctor.name}</p>
                  <p className="truncate text-[13px] text-qc-muted">
                    {doctor.dept} · Room {doctor.room}
                  </p>
                </div>
                <DoctorStatus status={doctor.status} className="mt-0.5" />
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[auto_auto_auto_minmax(0,1fr)] sm:gap-x-8 sm:pl-12">
                <div>
                  <dt className="text-[11.5px] font-medium text-qc-muted">Now serving</dt>
                  <dd className="mt-1">
                    {serving ? (
                      <TokenChip prefix={serving.prefix} number={pad3(serving.number)} tone="dark" size="sm" />
                    ) : (
                      <span className="text-[13px] text-qc-muted">—</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-medium text-qc-muted">Waiting</dt>
                  <dd
                    className={`mt-1 font-display text-lg leading-6 font-extrabold tabular-nums ${
                      waiting >= 6 ? 'qc-attn' : 'text-qc-ink'
                    }`}
                  >
                    {waiting}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11.5px] font-medium text-qc-muted">Clears by</dt>
                  <dd className="mt-1 text-[13px] leading-6 font-semibold text-qc-text tabular-nums">
                    {waiting === 0 && !serving ? 'Clear now' : `~${formatTime(clearsBy(state, doctor))}`}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className="flex justify-between text-[11.5px] font-medium text-qc-muted">
                    <span>Daily capacity</span>
                    <span className="tabular-nums">
                      {issued}/{doctor.capacity}
                    </span>
                  </dt>
                  <dd className="mt-2.5">
                    <Meter
                      value={issued}
                      max={doctor.capacity}
                      label={`${doctor.name} capacity used`}
                      tone={issued / doctor.capacity >= 0.85 ? 'coral' : 'teal'}
                    />
                  </dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}

function NeedsAttention({ state }) {
  const [inviteSent, setInviteSent] = useState(false)
  const items = []

  state.doctors
    .filter((d) => d.status === 'break')
    .forEach((d) => {
      const n = lineFor(state, d.id).length
      items.push({
        key: `break-${d.id}`,
        Icon: Coffee,
        iconClass: 'bg-qc-amber/20 qc-attn',
        title: `${d.name} is on break`,
        body: `${n} patient${n === 1 ? '' : 's'} waiting in Room ${d.room}.`,
        action: { label: 'Mark available', onClick: () => setDoctorStatus(d.id, 'available') },
      })
    })

  state.tokens
    .filter((tk) => tk.status === 'skipped')
    .forEach((tk) => {
      items.push({
        key: `skip-${tk.id}`,
        Icon: SkipForward,
        iconClass: 'bg-qc-coral/15 text-qc-text [&_svg]:text-qc-coral',
        title: `${tk.prefix}-${pad3(tk.number)} skipped · ${tk.patient.name}`,
        body: `Not present when called at ${clockLabel(tk.calledAt ?? NOW)}`,
        action: { label: 'Recall', onClick: () => recallToken(tk.id) },
      })
    })

  const upcoming = state.appointments
    .filter((a) => normalizeApptStatus(a.status) === 'booked' && a.time > NOW && a.time <= NOW + 60)
    .sort((a, b) => a.time - b.time)
  if (upcoming.length > 0) {
    items.push({
      key: 'appts',
      Icon: CalendarClock,
      iconClass: 'bg-qc-teal/10 text-qc-teal',
      title: `${upcoming.length} appointment${upcoming.length === 1 ? '' : 's'} in the next hour`,
      body: upcoming.map((a) => `${a.patient} (${formatTime(a.time)})`).join(', '),
      action: { label: 'Review', href: '/admin/appointments' },
    })
  }

  items.push({
    key: 'invite',
    Icon: Mail,
    iconClass: 'bg-qc-teal/10 text-qc-teal',
    title: `Invite pending · ${PENDING_INVITE.name}`,
    body: inviteSent
      ? `Invite re-sent to ${PENDING_INVITE.email}.`
      : `${PENDING_INVITE.email} hasn't accepted yet.`,
    action: inviteSent
      ? { label: 'Sent', done: true }
      : { label: 'Resend', onClick: () => setInviteSent(true) },
  })

  return (
    <Panel title="Needs attention" subtitle={`${items.length} item${items.length === 1 ? '' : 's'}`}>
      <ul className="divide-y divide-qc-line">
        {items.map((item) => (
          <li key={item.key} className="flex items-start gap-3 px-5 py-3.5">
            <span
              className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full [&_svg]:size-4 ${item.iconClass}`}
            >
              <item.Icon aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-qc-ink">{item.title}</p>
              <p className="mt-0.5 line-clamp-2 text-[12.5px] text-qc-muted">{item.body}</p>
            </div>
            {item.action.href ? (
              <SmartLink href={item.action.href} className={adminButton('outlineTeal', 'xs')}>
                {item.action.label}
              </SmartLink>
            ) : item.action.done ? (
              <span className="inline-flex h-7 items-center gap-1 px-1 text-xs font-semibold text-qc-teal [&_svg]:size-3.5">
                <Check aria-hidden="true" />
                {item.action.label}
              </span>
            ) : (
              <button type="button" onClick={item.action.onClick} className={adminButton('outlineTeal', 'xs')}>
                {item.action.label}
              </button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function TodaysAppointments({ state }) {
  const sorted = [...state.appointments].sort((a, b) => a.time - b.time)
  const toArrive = sorted.filter((a) => normalizeApptStatus(a.status) === 'booked').length
  return (
    <Panel
      title="Today's appointments"
      subtitle={`${toArrive} still to arrive`}
      actions={
        <SmartLink href="/admin/appointments" className={adminButton('link', 'sm')}>
          View all
          <ArrowRight aria-hidden="true" />
        </SmartLink>
      }
    >
      <ul className="divide-y divide-qc-line">
        {sorted.slice(0, 5).map((a) => (
          <li key={a.id} className="flex items-center gap-3 px-5 py-3">
            <span className="w-16 shrink-0 text-[13px] font-semibold text-qc-ink tabular-nums">{formatTime(a.time)}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-medium text-qc-text">{a.patient}</p>
              <p className="truncate text-xs text-qc-muted">{doctorById(state, a.doctorId)?.name}</p>
            </div>
            <ApptStatusBadge status={a.status} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function VolumeChart() {
  const max = Math.max(...TODAY_VOLUME, ...TYPICAL_VOLUME)
  const soFar = TODAY_VOLUME.slice(0, CURRENT_HOUR).reduce((a, b) => a + b, 0)
  const typicalSoFar = TYPICAL_VOLUME.slice(0, CURRENT_HOUR).reduce((a, b) => a + b, 0)
  const busier = Math.round(((soFar - typicalSoFar) / typicalSoFar) * 100)
  const peakIdx = TYPICAL_VOLUME.slice(CURRENT_HOUR + 1).reduce(
    (best, v, i) => (v > TYPICAL_VOLUME[best] ? CURRENT_HOUR + 1 + i : best),
    CURRENT_HOUR + 1,
  )
  return (
    <Panel
      title="Patient volume by hour"
      subtitle="Today vs. typical Tuesday"
      actions={
        <div className="hidden items-center gap-4 text-xs text-qc-muted sm:flex">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-[2px] bg-qc-teal" aria-hidden="true" /> Today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 border-t-2 border-dashed border-qc-muted/60" aria-hidden="true" /> Typical
          </span>
        </div>
      }
    >
      <div className="px-5 pt-8 pb-4">
        <figure aria-label="Patients checked in per hour today, compared with a typical Tuesday" className="w-full">
          <div className="flex h-[170px] items-end gap-[3px] sm:gap-1.5">
            {HOURS.map((h, i) => (
              <div key={h} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
                <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 rounded-[4px] bg-qc-ink px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-qc-ivory group-hover:block">
                  {h}: {TODAY_VOLUME[i]} patients
                </span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 z-[1] border-t-2 border-dashed border-qc-muted/50"
                  style={{ bottom: `${(TYPICAL_VOLUME[i] / max) * 100}%` }}
                />
                <div
                  className={`w-full rounded-t-[3px] transition-[height] duration-500 ${
                    i < CURRENT_HOUR
                      ? 'bg-qc-teal group-hover:bg-qc-ink'
                      : i === CURRENT_HOUR
                        ? 'bg-qc-coral'
                        : 'bg-qc-ink/[0.07]'
                  }`}
                  style={{ height: `${(TODAY_VOLUME[i] / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-[3px] sm:gap-1.5">
            {HOURS.map((h) => (
              <span key={h} className="min-w-0 flex-1 truncate text-center text-[10.5px] text-qc-muted tabular-nums">
                {h}
              </span>
            ))}
          </div>
        </figure>
      </div>
      <p className="border-t border-qc-line px-5 py-3.5 text-[13px] text-qc-muted">
        <span className="font-semibold text-qc-ink">{soFar} patients</span> by {formatTime((9 + CURRENT_HOUR) * 60)},{' '}
        {Math.abs(busier)}% {busier >= 0 ? 'busier' : 'quieter'} than a typical Tuesday. Expect the next peak around{' '}
        <span className="font-semibold text-qc-ink">{formatTime((9 + peakIdx) * 60)}</span> (~{TYPICAL_VOLUME[peakIdx]}{' '}
        patients).
      </p>
    </Panel>
  )
}

const activityIcons = {
  issue: { Icon: Ticket, className: 'bg-qc-teal/10 text-qc-teal' },
  call: { Icon: PhoneCall, className: 'bg-qc-upcoming/15 qc-info' },
  done: { Icon: CircleCheck, className: 'bg-qc-completed/12 text-qc-muted' },
  skip: { Icon: SkipForward, className: 'bg-qc-coral/15 text-qc-coral' },
  recall: { Icon: Undo2, className: 'bg-qc-amber/20 qc-attn' },
  info: { Icon: Activity, className: 'bg-qc-ink/[0.06] text-qc-muted' },
}

function RecentActivity({ activity }) {
  return (
    <Panel title="Recent activity" subtitle="Queue changes from every desk">
      {activity.length === 0 ? (
        <EmptyState Icon={Activity} title="No activity yet">
          Tokens issued, calls and status changes will appear here as they happen.
        </EmptyState>
      ) : (
        <ul className="max-h-[360px] divide-y divide-qc-line overflow-y-auto">
          {activity.slice(0, 20).map((a) => {
            const { Icon, className } = activityIcons[a.kind] ?? activityIcons.info
            return (
              <li key={a.id} className="flex items-start gap-3 px-5 py-3">
                <span className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full [&_svg]:size-3.5 ${className}`}>
                  <Icon aria-hidden="true" />
                </span>
                <p className="min-w-0 flex-1 text-[13px] text-qc-text">{a.text}</p>
                <span className="shrink-0 text-[11.5px] text-qc-muted tabular-nums">{formatTime(a.at)}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}

export default function AdminOverview() {
  const state = useQueue()
  const stats = clinicStats(state)
  const waitingTokens = state.tokens.filter((tk) => tk.status === 'waiting' || tk.status === 'called')
  const avgWait = waitingTokens.length
    ? Math.round(waitingTokens.reduce((sum, tk) => sum + (NOW - tk.checkedInAt), 0) / waitingTokens.length)
    : 0
  const doctorsWithQueue = new Set(waitingTokens.map((tk) => tk.doctorId)).size
  const skipped = state.tokens.filter((tk) => tk.status === 'skipped').length
  const apptNoShows = state.appointments.filter((a) => normalizeApptStatus(a.status) === 'no-show').length

  return (
    <AdminPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-qc-teal uppercase">Tuesday, 24 June</p>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-qc-ink md:text-[28px]">
            Good morning, Nandini
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-qc-muted">
            Here's how {CLINIC.name} is running right now. Figures update live as the front desk works the queue.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ButtonLink href="/admin/settings" variant="secondary" size="md">
            <Settings aria-hidden="true" />
            Clinic settings
          </ButtonLink>
          <ButtonLink href="/admin/staff?invite=1" variant="dark" size="md">
            <UserPlus aria-hidden="true" />
            Invite staff
          </ButtonLink>
        </div>
      </div>

      <section aria-label="Today at a glance" className="overflow-hidden rounded-qc border border-qc-line">
        <div className="grid grid-cols-2 gap-px bg-qc-line lg:grid-cols-5">
          <Stat
            label="Patients today"
            value={stats.issued}
            note="tokens issued since 9:00 AM"
            className="col-span-2 lg:col-span-1"
          />
          <Stat
            label="Currently waiting"
            value={stats.waiting}
            note={`across ${doctorsWithQueue} doctor${doctorsWithQueue === 1 ? '' : 's'}`}
          />
          <Stat label="Avg. wait now" value={avgWait} unit="min" note={`longest ${stats.longestWait} min`} />
          <Stat
            label="Consults completed"
            value={stats.seen}
            note={
              <>
                <span className="font-semibold text-qc-teal">▲ 8%</span>vs last Tue
              </>
            }
          />
          <Stat
            label="No-shows"
            value={skipped + apptNoShows}
            note={`${skipped} skipped · ${apptNoShows} appt.`}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <LiveFloor state={state} />
        <div className="flex min-w-0 flex-col gap-6">
          <NeedsAttention state={state} />
          <TodaysAppointments state={state} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <VolumeChart />
        <RecentActivity activity={state.activity} />
      </div>
    </AdminPage>
  )
}
