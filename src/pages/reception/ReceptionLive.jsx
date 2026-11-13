import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleDot,
  Coffee,
  ExternalLink,
  Moon,
  PhoneCall,
  RotateCcw,
  Search,
  SkipForward,
  Siren,
  Trash2,
  UserPlus,
} from 'lucide-react'
import {
  Avatar,
  Button,
  DoctorStatus,
  Flag,
  Input,
  Kbd,
  PageHeader,
  Panel,
  SmartLink,
  StatStrip,
  StatusPill,
  TokenChip,
  buttonClass,
} from '../../components/ui.jsx'
import { WorkspacePage } from '../../components/AppShell.jsx'
import {
  NOW,
  callNext,
  cancelToken,
  clinicStats,
  doctorById,
  formatTime,
  lineFor,
  pad3,
  recallToken,
  servingFor,
  setDoctorStatus,
  setPriority,
  skipToken,
  skippedFor,
  tokenCode,
  useQueue,
} from '../../lib/queue.js'
import { RegisterForm } from './RegisterForm.jsx'
import {
  ActionMenu,
  Dialog,
  MenuLabel,
  MenuSeparator,
  MidTokenChip,
  ToastRegion,
  menuItemClass,
  seenToday,
  shortTime,
  useMediaQuery,
  useToasts,
} from './shared.jsx'

const statusDots = {
  consult: 'bg-qc-teal',
  available: 'bg-qc-sage',
  break: 'bg-qc-amber',
  off: 'bg-qc-line',
}
const statusLabels = { consult: 'In consult', available: 'Available', break: 'On break', off: 'Off duty' }

const availabilityOptions = [
  { value: 'available', label: 'Available', Icon: CircleDot },
  { value: 'break', label: 'On break', Icon: Coffee },
  { value: 'off', label: 'Off duty', Icon: Moon },
]

function isTyping(target) {
  const tag = target?.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable
}

/* ---------- doctors on duty ---------- */

function DoctorRow({ state, doctor, selected, onSelect, notify }) {
  const serving = servingFor(state, doctor.id)
  const line = lineFor(state, doctor.id)
  const next = line[0]
  const eta = line.length * doctor.avgConsult

  return (
    <li role="option" aria-selected={selected}>
      <div
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onSelect()
          }
        }}
        className={`group grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 rounded-[8px] px-3 py-2.5 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-qc-coral sm:grid-cols-[minmax(0,1.6fr)_88px_88px_64px_auto] ${
          selected ? 'bg-qc-ivory ring-1 ring-qc-ink/15' : 'hover:bg-qc-ivory/60'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative">
            <Avatar initials={doctor.initials} tone={selected ? 'ink' : 'teal'} />
            <span
              aria-label={statusLabels[doctor.status]}
              className={`absolute -right-0.5 -bottom-0.5 inline-block size-2.5 rounded-full ring-2 ring-white ${statusDots[doctor.status]}`}
            />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-qc-ink">{doctor.name}</span>
            </span>
            <span className="flex items-center gap-2 text-xs text-qc-muted">
              <span className="truncate">
                {doctor.dept} · Rm {doctor.room}
              </span>
              <span className="hidden md:inline">·</span>
              <DoctorStatus status={doctor.status} className="max-md:hidden" />
            </span>
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-qc-muted uppercase">Serving</p>
          {serving ? (
            <TokenChip prefix={serving.prefix} number={pad3(serving.number)} tone="dark" size="sm" />
          ) : (
            <span className="text-xs text-qc-muted">—</span>
          )}
        </div>
        <div className="hidden sm:block">
          <p className="mb-1 text-[10.5px] font-semibold tracking-wide text-qc-muted uppercase">Next</p>
          {next ? (
            <TokenChip prefix={next.prefix} number={pad3(next.number)} tone="light" size="sm" />
          ) : (
            <span className="text-xs text-qc-muted">—</span>
          )}
        </div>
        <div className="hidden text-right sm:block">
          <p className="font-display text-lg leading-none font-extrabold text-qc-ink tabular-nums">{line.length}</p>
          <p className="mt-1 text-[11px] text-qc-muted tabular-nums">~{eta} min</p>
        </div>
        <div className="flex items-center gap-2 justify-self-end">
          <span className="text-right sm:hidden">
            <span className="block font-display text-base font-extrabold text-qc-ink tabular-nums">{line.length}</span>
            <span className="block text-[11px] text-qc-muted">waiting</span>
          </span>
          <ActionMenu label={`Availability for ${doctor.name}`}>
            {(close) => (
              <>
                <MenuLabel>Availability</MenuLabel>
                {availabilityOptions.map(({ value, label, Icon }) => {
                  const current = doctor.status === value || (value === 'available' && doctor.status === 'consult')
                  return (
                    <button
                      key={value}
                      type="button"
                      role="menuitemradio"
                      aria-checked={current}
                      className={menuItemClass}
                      onClick={() => {
                        if (!current) {
                          setDoctorStatus(doctor.id, value)
                          notify(`${doctor.name} marked ${label.toLowerCase()}`)
                        }
                        close()
                      }}
                    >
                      <Icon aria-hidden="true" />
                      <span className="flex-1">{label}</span>
                      {current && <Check aria-hidden="true" className="text-qc-teal!" />}
                    </button>
                  )
                })}
              </>
            )}
          </ActionMenu>
        </div>
      </div>
    </li>
  )
}

/* ---------- selected doctor's queue ---------- */

function QueueRow({ state, token, index, doctor, notify }) {
  const code = tokenCode(token)
  const called = token.status === 'called'
  const line = lineFor(state, doctor.id)
  const position = line.findIndex((tk) => tk.id === token.id)
  const eta = position * doctor.avgConsult + 5
  const emergency = token.priority === 'emergency'

  return (
    <li
      className={`relative grid grid-cols-[28px_auto_1fr_auto] items-center gap-x-3 gap-y-1 border-b border-qc-line px-5 py-3 last:border-0 md:grid-cols-[28px_76px_minmax(0,1fr)_110px_96px_auto] ${
        called ? 'bg-qc-upcoming/[0.06]' : emergency ? 'bg-qc-skipped/[0.06]' : ''
      }`}
    >
      <span className="font-display text-sm font-bold text-qc-muted tabular-nums">{index + 1}</span>
      <TokenChip prefix={token.prefix} number={pad3(token.number)} tone={called ? 'dark' : 'light'} size="sm" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="truncate text-sm font-semibold text-qc-ink">{token.patient.name}</span>
          {token.patient.age != null && (
            <span className="text-xs text-qc-muted">
              {token.patient.age}
              {token.patient.sex}
            </span>
          )}
          {token.kind === 'appt' && (
            <span className="rounded-[4px] bg-qc-ink/[0.06] px-1.5 text-[10.5px] font-semibold text-qc-muted">APPT</span>
          )}
          {token.priority !== 'normal' && <Flag type={token.priority} />}
        </p>
        <p className="truncate text-xs text-qc-muted">
          {token.reason}
          {token.flags ? ` · ${token.flags}` : ''}
        </p>
      </div>
      <div className="hidden md:block">
        <StatusPill status={token.status} />
      </div>
      <div className="hidden text-right text-xs md:block">
        <p className="font-semibold text-qc-ink tabular-nums">{called ? 'Now' : `~${eta} min`}</p>
        <p className="text-qc-muted tabular-nums">in since {formatTime(token.checkedInAt)}</p>
      </div>
      <ActionMenu label={`Actions for ${code}`}>
        {(close) => {
          const act = (fn, message) => () => {
            fn()
            notify(message)
            close()
          }
          return (
            <>
              <MenuLabel>
                {code} · {token.patient.name}
              </MenuLabel>
              {!emergency && (
                <button type="button" role="menuitem" className={menuItemClass} onClick={act(() => setPriority(token.id, 'emergency'), `${code} marked as emergency`)}>
                  <Siren aria-hidden="true" /> Mark as emergency
                </button>
              )}
              {token.priority === 'normal' ? (
                <button type="button" role="menuitem" className={menuItemClass} onClick={act(() => setPriority(token.id, 'priority'), `${code} moved up as priority`)}>
                  <ArrowUp aria-hidden="true" /> Mark as priority
                </button>
              ) : (
                <button type="button" role="menuitem" className={menuItemClass} onClick={act(() => setPriority(token.id, 'normal'), `${code} back to normal priority`)}>
                  <ArrowDown aria-hidden="true" /> Remove {token.priority}
                </button>
              )}
              <button type="button" role="menuitem" className={menuItemClass} onClick={act(() => skipToken(token.id), `${code} skipped — not present`)}>
                <SkipForward aria-hidden="true" /> Skip — not present
              </button>
              <SmartLink href={`/track/${code}`} role="menuitem" className={menuItemClass} onClick={close}>
                <ExternalLink aria-hidden="true" /> Open tracking page
              </SmartLink>
              <MenuSeparator />
              <button
                type="button"
                role="menuitem"
                className={`${menuItemClass} qc-alert [&_svg]:text-qc-skipped!`}
                onClick={act(() => cancelToken(token.id), `${code} cancelled`)}
              >
                <Trash2 aria-hidden="true" /> Cancel token
              </button>
            </>
          )
        }}
      </ActionMenu>
    </li>
  )
}

function DoctorQueue({ state, doctor, notify }) {
  const [filter, setFilter] = useState('')
  const serving = servingFor(state, doctor.id)
  const line = lineFor(state, doctor.id)
  const skipped = skippedFor(state, doctor.id)
  const term = filter.trim().toLowerCase()
  const visible = term
    ? line.filter(
        (tk) =>
          tk.patient.name.toLowerCase().includes(term) ||
          tokenCode(tk).toLowerCase().includes(term.replace(/\s/g, '')) ||
          (tk.patient.phone ?? '').replace(/\s/g, '').includes(term.replace(/\s/g, '')),
      )
    : line

  function onCallNext() {
    const next = line[0]
    callNext(doctor.id)
    notify(next ? `${tokenCode(next)} called to Room ${doctor.room}` : `${doctor.name} has no one waiting`)
  }

  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          {doctor.name}
          <span className="font-sans text-[13px] font-medium text-qc-muted">· Room {doctor.room}</span>
        </span>
      }
      subtitle={`${line.length} in line · ${seenToday(state, doctor.id)} seen today · avg ${doctor.avgConsult} min per consult`}
      actions={
        <Button
          variant="dark"
          size="sm"
          onClick={onCallNext}
          disabled={doctor.status === 'off' || (line.length === 0 && !serving)}
        >
          <PhoneCall aria-hidden="true" /> Call next
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-qc-line bg-qc-ivory/40 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-semibold tracking-wide text-qc-muted uppercase">Now serving</span>
          {serving ? (
            <>
              <MidTokenChip prefix={serving.prefix} number={pad3(serving.number)} />
              <span className="text-sm font-medium text-qc-ink">{serving.patient.name}</span>
              <span className="text-xs text-qc-muted tabular-nums">for {NOW - serving.startedAt} min</span>
            </>
          ) : (
            <span className="text-sm text-qc-muted">No one in consultation</span>
          )}
        </div>
        <DoctorStatus status={doctor.status} className="ml-auto" />
      </div>

      <div className="flex items-center gap-2 border-b border-qc-line px-5 py-2.5">
        <div className="relative flex max-w-xs flex-1 items-center">
          <span className="pointer-events-none absolute left-3 flex text-qc-muted [&_svg]:size-4">
            <Search aria-hidden="true" />
          </span>
          <Input
            className="pl-9"
            aria-label="Filter this queue"
            placeholder="Filter by name, token or phone"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {line.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-qc-muted">
          No one is waiting for {doctor.name}. New tokens will appear here.
        </p>
      ) : visible.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-qc-muted">No one in this queue matches “{filter}”.</p>
      ) : (
        <ol aria-label={`Queue for ${doctor.name}`}>
          {visible.map((token) => (
            <QueueRow
              key={token.id}
              state={state}
              token={token}
              index={line.indexOf(token)}
              doctor={doctor}
              notify={notify}
            />
          ))}
        </ol>
      )}

      {skipped.length > 0 && (
        <details className="group border-t border-qc-line">
          <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3 text-[13px] font-semibold text-qc-text marker:hidden hover:bg-qc-ivory/50 [&_svg]:size-4">
            <SkipForward aria-hidden="true" />
            Skipped ({skipped.length})
            <span className="ml-auto text-xs font-normal text-qc-muted group-open:hidden">Show</span>
          </summary>
          <ul>
            {skipped.map((tk) => (
              <li key={tk.id} className="flex items-center gap-3 border-t border-qc-line/70 px-5 py-2.5">
                <TokenChip prefix={tk.prefix} number={pad3(tk.number)} tone="light" size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-qc-ink">{tk.patient.name}</span>
                  <span className="block text-xs text-qc-muted">
                    Not present when called at {shortTime(tk.calledAt ?? tk.checkedInAt)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    recallToken(tk.id)
                    notify(`${tokenCode(tk)} recalled to the front of the line`)
                  }}
                  className={buttonClass({
                    variant: 'secondary',
                    size: 'sm',
                    className: 'border-qc-teal/35! text-qc-teal! hover:border-qc-teal! hover:bg-qc-teal/5!',
                  })}
                >
                  <RotateCcw aria-hidden="true" /> Recall
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </Panel>
  )
}

/* ---------- page ---------- */

export default function ReceptionLive() {
  const state = useQueue()
  const isXl = useMediaQuery('(min-width: 1280px)')
  const [selectedId, setSelectedId] = useState(state.doctors[0].id)
  const [formDoctorId, setFormDoctorId] = useState(state.doctors[0].id)
  const [priority, setPriorityPreset] = useState('normal')
  const [dialogOpen, setDialogOpen] = useState(false)
  const phoneRef = useRef(null)
  const [toasts, notify] = useToasts()

  const doctor = doctorById(state, selectedId)
  const stats = clinicStats(state)

  const openRegister = useCallback(
    (preset) => {
      if (preset) setPriorityPreset(preset)
      if (isXl) {
        phoneRef.current?.focus()
        phoneRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      } else {
        setDialogOpen(true)
      }
    },
    [isXl],
  )

  useEffect(() => {
    function onKey(e) {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      const key = e.key.toLowerCase()
      if (key === 'n') {
        e.preventDefault()
        openRegister()
      } else if (key === 'e') {
        e.preventDefault()
        openRegister('emergency')
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openRegister])

  function selectDoctor(id) {
    setSelectedId(id)
    if (doctorById(state, id).status !== 'off') setFormDoctorId(id)
  }

  function onIssued(token) {
    const d = doctorById(state, token.doctorId)
    setDialogOpen(false)
    setSelectedId(token.doctorId)
    notify(`${tokenCode(token)} issued to ${token.patient.name} for ${d.name}`, token.priority === 'emergency' ? 'alert' : 'default')
  }

  const onDuty = stats.onDuty
  const longestAlert = stats.longestWait >= 30

  const form = (autoFocus) => (
    <RegisterForm
      state={state}
      doctorId={formDoctorId}
      onDoctorChange={setFormDoctorId}
      priority={priority}
      onPriorityChange={setPriorityPreset}
      onIssued={onIssued}
      phoneRef={phoneRef}
      autoFocus={autoFocus}
    />
  )

  const shortcutHint = (
    <span className="inline-flex items-center gap-1.5">
      Press{' '}
      <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-current/20 px-1 font-sans text-[10.5px] font-semibold opacity-70">
        N
      </kbd>{' '}
      from anywhere on this screen
    </span>
  )

  return (
    <WorkspacePage>
      <PageHeader
        eyebrow={`Front desk · ${formatTime(NOW)}`}
        title="Live queues"
        actions={
          <>
            <Button variant="danger" onClick={() => openRegister('emergency')}>
              <Siren aria-hidden="true" /> Emergency<Kbd>E</Kbd>
            </Button>
            <Button variant="dark" className="xl:hidden" onClick={() => openRegister()}>
              <UserPlus aria-hidden="true" /> Register patient<Kbd>N</Kbd>
            </Button>
          </>
        }
      />

      <StatStrip
        stats={[
          { label: 'Waiting now', value: stats.waiting, note: 'across all doctors' },
          { label: 'In consultation', value: stats.serving, note: `${onDuty} doctors on duty` },
          {
            label: 'Longest wait',
            value: stats.longestWait,
            unit: 'min',
            note: longestAlert ? 'Check in with this patient' : 'Within target',
            noteClassName: longestAlert ? 'qc-attn font-medium' : undefined,
          },
          { label: 'Seen today', value: seenToday(state), note: 'consultations completed' },
          {
            label: 'Emergencies',
            value: stats.emergencies,
            note: stats.emergencies ? 'Call these patients first' : 'None in queue',
            noteClassName: stats.emergencies ? 'qc-alert font-medium' : undefined,
          },
        ]}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title="Doctors on duty" subtitle={`${onDuty} of ${state.doctors.length} doctors in today`} bodyClassName="p-1.5">
            <ul role="listbox" aria-label="Doctor queues" className="flex flex-col gap-0.5">
              {state.doctors.map((d) => (
                <DoctorRow
                  key={d.id}
                  state={state}
                  doctor={d}
                  selected={d.id === selectedId}
                  onSelect={() => selectDoctor(d.id)}
                  notify={notify}
                />
              ))}
            </ul>
          </Panel>

          <DoctorQueue key={doctor.id} state={state} doctor={doctor} notify={notify} />
        </div>

        <aside className="hidden xl:block">
          <div className="sticky top-[84px]">
            <Panel title="Register patient" subtitle={shortcutHint} bodyClassName="p-5">
              {isXl && form(false)}
            </Panel>
          </div>
        </aside>
      </div>

      <Dialog
        open={dialogOpen && !isXl}
        onClose={() => setDialogOpen(false)}
        title="Register patient"
        subtitle="Issue a token and text the patient their live tracking link."
      >
        {form(true)}
      </Dialog>

      <ToastRegion toasts={toasts} />
    </WorkspacePage>
  )
}
