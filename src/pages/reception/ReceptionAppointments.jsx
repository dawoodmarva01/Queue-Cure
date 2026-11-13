import { useMemo, useState } from 'react'
import { Ban, CalendarDays, CircleCheck, Plus, RotateCcw, Search, Ticket, UserX } from 'lucide-react'
import {
  Button,
  Field,
  Input,
  PageHeader,
  Segmented,
  Select,
  TokenChip,
} from '../../components/ui.jsx'
import {
  NOW,
  doctorById,
  formatTime,
  issueToken,
  lineFor,
  pad3,
  setAppointmentStatus,
  tokenCode,
  useQueue,
} from '../../lib/queue.js'
import { ActionMenu, Dialog, ToastRegion, menuItemClass, useToasts } from './shared.jsx'

/* Patient details for the store's appointments (the store keeps only name, time and doctor). */
const storeDetails = {
  a1: { phone: '+91 98450 31877', reason: 'Knee pain review', age: 47, sex: 'M' },
  a2: { phone: '+91 99001 62340', reason: 'Hypertension follow-up', age: 58, sex: 'F' },
  a3: { phone: '+91 98860 44129', reason: 'Fever, 2 days', age: 33, sex: 'M' },
  a4: { phone: '+91 97400 18852', reason: 'Vaccination – 5 yr booster', age: 5, sex: 'F' },
  a5: { phone: '+91 98455 90217', reason: 'Acne follow-up', age: 26, sex: 'F' },
  a6: { phone: '+91 99860 27741', reason: 'Diabetes review', age: 52, sex: 'M' },
  a7: { phone: '+91 98861 73305', reason: 'ECG follow-up', age: 61, sex: 'F' },
}

/* Visits that aren't in the shared store: earlier today, tomorrow and later this week. */
const localAppointments = [
  { id: 'l1', day: 0, time: 9 * 60 + 15, patient: 'Imran Siddiqui', doctorId: 'd1', status: 'completed', phone: '+91 98440 51290', reason: 'Thyroid report review', age: 39, sex: 'M' },
  { id: 'l2', day: 0, time: 9 * 60 + 45, patient: 'Nisha Bhatt', doctorId: 'd5', status: 'cancelled', phone: '+91 99020 40318', reason: 'Pigmentation', age: 31, sex: 'F' },
  { id: 'l3', day: 1, time: 9 * 60 + 30, patient: 'Arvind Swamy', doctorId: 'd2', status: 'booked', phone: '+91 98450 11920', reason: 'Stress test results', age: 63, sex: 'M' },
  { id: 'l4', day: 1, time: 10 * 60, patient: 'Gayatri Iyengar', doctorId: 'd1', status: 'booked', phone: '+91 97391 55021', reason: 'Follow-up: BP review', age: 57, sex: 'F' },
  { id: 'l5', day: 1, time: 10 * 60 + 45, patient: 'Kiran Bhat', doctorId: 'd4', status: 'booked', phone: '+91 98861 30447', reason: 'Shoulder physiotherapy plan', age: 44, sex: 'M' },
  { id: 'l6', day: 1, time: 11 * 60 + 30, patient: 'Aanya Kapoor', doctorId: 'd3', status: 'booked', phone: '+91 99459 72018', reason: 'Growth check-up', age: 3, sex: 'F' },
  { id: 'l7', day: 1, time: 16 * 60, patient: 'Deepak Chawla', doctorId: 'd6', status: 'booked', phone: '+91 98455 64102', reason: 'Sinus congestion', age: 41, sex: 'M' },
  { id: 'l8', day: 2, time: 9 * 60 + 45, patient: 'Ritu Malhotra', doctorId: 'd5', status: 'booked', phone: '+91 98450 87731', reason: 'Eczema review', age: 35, sex: 'F' },
  { id: 'l9', day: 3, time: 11 * 60, patient: 'Sanjay Hegde', doctorId: 'd2', status: 'booked', phone: '+91 99001 30985', reason: 'Cholesterol review', age: 55, sex: 'M' },
  { id: 'l10', day: 3, time: 12 * 60 + 15, patient: 'Pallavi Naik', doctorId: 'd1', status: 'booked', phone: '+91 97400 66213', reason: 'Recurring headaches', age: 29, sex: 'F' },
  { id: 'l11', day: 4, time: 15 * 60 + 30, patient: 'Yusuf Pathan', doctorId: 'd4', status: 'booked', phone: '+91 98861 29450', reason: 'Knee pain', age: 48, sex: 'M' },
]

const dayLabels = ['Today', 'Tomorrow', 'Thu', 'Fri', 'Sat']

/* The store uses 'noshow' / 'checkedin'; the filter uses the reference's hyphenated values. */
const statuses = {
  booked: { label: 'Booked', filter: 'booked', Icon: CalendarDays, className: 'bg-qc-upcoming/15 qc-info' },
  checkedin: { label: 'Checked in', filter: 'checked-in', Icon: Ticket, className: 'bg-qc-teal/12 text-qc-teal' },
  noshow: { label: 'No-show', filter: 'no-show', Icon: UserX, className: 'bg-qc-skipped/12 qc-alert' },
  cancelled: { label: 'Cancelled', filter: 'cancelled', Icon: Ban, className: 'bg-qc-ink/[0.06] text-qc-muted' },
  completed: { label: 'Completed', filter: 'completed', Icon: CircleCheck, className: 'bg-qc-completed/12 text-qc-muted' },
}

function AppointmentStatus({ status }) {
  const { label, Icon, className } = statuses[status]
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[11.5px] font-semibold whitespace-nowrap [&_svg]:size-3 ${className}`}>
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}

function NewAppointmentForm({ state, onCreate }) {
  const [f, setF] = useState({ name: '', phone: '', doctorId: 'd1', day: '0', time: '15:00', reason: '' })
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const errs = {}
    if (!f.name.trim()) errs.name = 'Enter the patient’s name.'
    const digits = f.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
    if (digits.length !== 10) errs.phone = 'Mobile number should be 10 digits.'
    const [h, m] = f.time.split(':').map(Number)
    const minutes = h * 60 + m
    if (Number.isNaN(minutes)) errs.time = 'Pick a time.'
    else if (f.day === '0' && minutes <= NOW) errs.time = `Pick a time after ${formatTime(NOW)}.`
    else if (minutes < 8 * 60 || minutes > 20 * 60) errs.time = 'Clinic hours are 8:00 AM – 8:00 PM.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onCreate({
      id: `n${Date.now()}`,
      day: Number(f.day),
      time: minutes,
      patient: f.name.trim(),
      doctorId: f.doctorId,
      status: 'booked',
      phone: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`,
      reason: f.reason.trim() || 'General consultation',
    })
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Patient name" htmlFor="na-name" error={errors.name}>
        <Input id="na-name" autoFocus autoComplete="off" placeholder="Full name" value={f.name} aria-invalid={Boolean(errors.name)} onChange={set('name')} />
      </Field>
      <Field label="Mobile number" htmlFor="na-phone" hint="We'll text a reminder an hour before." error={errors.phone}>
        <Input id="na-phone" inputMode="tel" autoComplete="off" placeholder="98450 12345" value={f.phone} aria-invalid={Boolean(errors.phone)} onChange={set('phone')} />
      </Field>
      <Field label="Doctor" htmlFor="na-doctor">
        <Select id="na-doctor" value={f.doctorId} onChange={set('doctorId')}>
          {state.doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} — {d.dept}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Day" htmlFor="na-day">
          <Select id="na-day" value={f.day} onChange={set('day')}>
            {dayLabels.map((label, i) => (
              <option key={label} value={String(i)}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Time" htmlFor="na-time" error={errors.time}>
          <Input id="na-time" type="time" step="900" value={f.time} aria-invalid={Boolean(errors.time)} onChange={set('time')} />
        </Field>
      </div>
      <Field label="Reason for visit" htmlFor="na-reason" aside="Optional">
        <Input id="na-reason" placeholder="e.g. Follow-up, test results" value={f.reason} onChange={set('reason')} />
      </Field>
      <Button type="submit" variant="dark" size="lg" className="mt-1 w-full">
        <CalendarDays aria-hidden="true" /> Book appointment
      </Button>
    </form>
  )
}

export default function ReceptionAppointments() {
  const state = useQueue()
  const [range, setRange] = useState('today')
  const [doctorFilter, setDoctorFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [local, setLocal] = useState(localAppointments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [toasts, notify] = useToasts()

  /** Store appointments (today) merged with local ones. */
  const all = useMemo(
    () => [
      ...state.appointments.map((a) => ({ ...a, ...storeDetails[a.id], day: 0, fromStore: true })),
      ...local,
    ],
    [state.appointments, local],
  )

  const inRange = all.filter((a) => (range === 'today' ? a.day === 0 : range === 'tomorrow' ? a.day === 1 : true))
  const term = query.trim().toLowerCase()
  const shown = inRange
    .filter((a) => doctorFilter === 'all' || a.doctorId === doctorFilter)
    .filter((a) => statusFilter === 'all' || statuses[a.status].filter === statusFilter)
    .filter(
      (a) =>
        !term ||
        a.patient.toLowerCase().includes(term) ||
        (a.reason ?? '').toLowerCase().includes(term) ||
        (a.phone ?? '').replace(/\s/g, '').includes(term.replace(/\s/g, '')),
    )
    .sort((a, b) => a.day - b.day || a.time - b.time)

  const count = (s) => inRange.filter((a) => a.status === s).length

  function updateStatus(appt, status) {
    if (appt.fromStore) setAppointmentStatus(appt.id, status)
    else setLocal((list) => list.map((a) => (a.id === appt.id ? { ...a, status } : a)))
  }

  function checkIn(appt) {
    const doctor = doctorById(state, appt.doctorId)
    if (doctor.status === 'off') {
      notify(`${doctor.name} is off duty — reassign before checking in`, 'alert')
      return
    }
    const token = issueToken({
      doctorId: appt.doctorId,
      name: appt.patient,
      age: appt.age,
      sex: appt.sex,
      phone: appt.phone,
      reason: appt.reason,
      kind: 'appt',
    })
    updateStatus(appt, 'checkedin')
    notify(`${appt.patient} checked in · token ${tokenCode(token)}`)
  }

  /** Token issued at check-in, matched by patient name for appointment tokens. */
  function tokenFor(appt) {
    return state.tokens.find((tk) => tk.kind === 'appt' && tk.patient.name === appt.patient && tk.doctorId === appt.doctorId)
  }

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-6">
      <PageHeader
        eyebrow="Front desk"
        title="Appointments"
        actions={
          <Button variant="dark" onClick={() => setDialogOpen(true)}>
            <Plus aria-hidden="true" />
            New appointment
          </Button>
        }
      >
        <p className="mt-1.5 max-w-2xl text-sm text-qc-muted">
          Booked visits across all doctors. Check patients in to issue a queue token instantly.
        </p>
      </PageHeader>

      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-qc-line py-3.5">
        {[
          ['Total', inRange.length],
          ['Booked', count('booked')],
          ['Checked in', count('checkedin')],
          ['No-shows', count('noshow')],
          ['Cancelled', count('cancelled')],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-2">
            <dt className="text-[13px] text-qc-muted">{label}</dt>
            <dd className="font-display text-lg font-extrabold text-qc-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex min-w-0 flex-col rounded-qc border border-qc-line bg-qc-surface">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 border-b border-qc-line p-4 lg:flex-row lg:items-center">
            <Segmented
              label="Date range"
              className="w-full sm:w-auto"
              value={range}
              onChange={setRange}
              options={[
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'week', label: 'This week' },
              ]}
            />
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_1.4fr] lg:ml-auto lg:max-w-[640px]">
              <Select aria-label="Filter by doctor" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
                <option value="all">All doctors</option>
                {state.doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="booked">Booked</option>
                <option value="checked-in">Checked in</option>
                <option value="no-show">No-show</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </Select>
              <div className="relative col-span-2 flex items-center sm:col-span-1">
                <span className="pointer-events-none absolute left-3 flex text-qc-muted [&_svg]:size-4">
                  <Search aria-hidden="true" />
                </span>
                <Input
                  type="search"
                  className="pl-9"
                  aria-label="Search appointments"
                  placeholder="Patient, phone or reason"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {shown.length} appointments shown
          </p>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <CalendarDays className="size-6 text-qc-muted" aria-hidden="true" />
              <p className="text-sm font-semibold text-qc-ink">No appointments match these filters</p>
              <p className="text-[13px] text-qc-muted">Try another doctor, status or date range.</p>
            </div>
          ) : (
            <ul aria-label="Appointments">
              {shown.map((appt) => {
                const doctor = doctorById(state, appt.doctorId)
                const token = appt.status === 'checkedin' ? tokenFor(appt) : null
                const late = appt.day === 0 && appt.status === 'booked' && appt.time < NOW
                const waiting = lineFor(state, appt.doctorId).length
                return (
                  <li
                    key={appt.id}
                    className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-qc-line px-4 py-3.5 last:border-b-0 md:grid-cols-[64px_minmax(0,1.3fr)_minmax(0,1fr)_120px_auto] md:gap-x-6"
                  >
                    <div>
                      <p className="font-display text-sm font-extrabold text-qc-ink tabular-nums">
                        {formatTime(appt.time).replace(/ (AM|PM)$/, '')}
                      </p>
                      <p className="text-[11px] text-qc-muted">
                        {range === 'week' ? dayLabels[appt.day] : formatTime(appt.time).slice(-2)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-x-2">
                        <span className="truncate text-sm font-semibold text-qc-ink">{appt.patient}</span>
                        {late && <span className="text-[11px] font-semibold qc-attn">Running late</span>}
                      </p>
                      <p className="truncate text-xs text-qc-muted">
                        {appt.reason} · {appt.phone}
                      </p>
                      <p className="truncate text-xs text-qc-muted md:hidden">{doctor.name}</p>
                    </div>
                    <div className="hidden min-w-0 md:block">
                      <p className="truncate text-[13px] font-medium text-qc-text">{doctor.name}</p>
                      <p className="truncate text-xs text-qc-muted">
                        {doctor.dept} · {doctor.status === 'off' ? 'off duty' : `${waiting} waiting`}
                      </p>
                    </div>
                    <div className="hidden md:block">
                      {token ? (
                        <TokenChip prefix={token.prefix} number={pad3(token.number)} tone="dark" size="sm" />
                      ) : (
                        <AppointmentStatus status={appt.status} />
                      )}
                    </div>
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="md:hidden">
                        {token ? (
                          <TokenChip prefix={token.prefix} number={pad3(token.number)} tone="dark" size="sm" />
                        ) : (
                          <AppointmentStatus status={appt.status} />
                        )}
                      </span>
                      {appt.day === 0 && (appt.status === 'booked' || appt.status === 'noshow') && (
                        <Button variant="teal" size="sm" className="max-sm:hidden" onClick={() => checkIn(appt)}>
                          <Ticket aria-hidden="true" /> Check in
                        </Button>
                      )}
                      <ActionMenu label={`Actions for ${appt.patient}`}>
                        {(close) => {
                          const run = (fn) => () => {
                            fn()
                            close()
                          }
                          const canCheckIn = appt.day === 0 && (appt.status === 'booked' || appt.status === 'noshow')
                          return (
                            <>
                              {canCheckIn && (
                                <button type="button" role="menuitem" className={menuItemClass} onClick={run(() => checkIn(appt))}>
                                  <Ticket aria-hidden="true" /> Check in &amp; issue token
                                </button>
                              )}
                              {appt.status === 'booked' && appt.day === 0 && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className={menuItemClass}
                                  onClick={run(() => {
                                    updateStatus(appt, 'noshow')
                                    notify(`${appt.patient} marked as no-show`)
                                  })}
                                >
                                  <UserX aria-hidden="true" /> Mark as no-show
                                </button>
                              )}
                              {(appt.status === 'cancelled' || appt.status === 'noshow') && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className={menuItemClass}
                                  onClick={run(() => {
                                    updateStatus(appt, 'booked')
                                    notify(`${appt.patient}’s booking restored`)
                                  })}
                                >
                                  <RotateCcw aria-hidden="true" /> Restore booking
                                </button>
                              )}
                              {appt.status === 'booked' && (
                                <button
                                  type="button"
                                  role="menuitem"
                                  className={`${menuItemClass} qc-alert [&_svg]:text-qc-skipped!`}
                                  onClick={run(() => {
                                    updateStatus(appt, 'cancelled')
                                    notify(`${appt.patient}’s appointment cancelled`)
                                  })}
                                >
                                  <Ban aria-hidden="true" /> Cancel appointment
                                </button>
                              )}
                              {!canCheckIn && appt.status !== 'booked' && appt.status !== 'cancelled' && (
                                <p className="px-2.5 py-2 text-[13px] text-qc-muted">No actions for this visit.</p>
                              )}
                            </>
                          )
                        }}
                      </ActionMenu>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="New appointment"
        subtitle="Book a visit. The patient gets an SMS confirmation."
      >
        <NewAppointmentForm
          state={state}
          onCreate={(appt) => {
            setLocal((list) => [...list, appt])
            setDialogOpen(false)
            notify(`Booked ${appt.patient} · ${dayLabels[appt.day]} ${formatTime(appt.time)}`)
          }}
        />
      </Dialog>

      <ToastRegion toasts={toasts} />
    </div>
  )
}
