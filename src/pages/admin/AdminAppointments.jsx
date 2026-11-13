import { useMemo, useState } from 'react'
import { CalendarDays, Check, LogIn, Plus, Undo2, UserX, X } from 'lucide-react'
import { Button, Field, Input, Panel, Segmented, Select, TokenChip } from '../../components/ui.jsx'
import {
  NOW,
  doctorById,
  formatTime,
  issueToken,
  pad3,
  setAppointmentStatus,
  useQueue,
} from '../../lib/queue.js'
import {
  AdminHeader,
  AdminPage,
  ApptStatusBadge,
  Dialog,
  EmptyState,
  SearchInput,
  adminButton,
  apptStatusOptions,
  normalizeApptStatus,
} from './shared.jsx'

/** Patient details for the store's appointments (the store only keeps names). */
const DETAILS = {
  a1: { phone: '+91 98450 33120', reason: 'Knee pain follow-up', age: 47, sex: 'M' },
  a2: { phone: '+91 99001 87412', reason: 'ECG review', age: 58, sex: 'F' },
  a3: { phone: '+91 98860 44017', reason: 'Thyroid report review', age: 39, sex: 'M' },
  a4: { phone: '+91 97400 26591', reason: 'Vaccination (MMR)', age: 3, sex: 'F' },
  a5: { phone: '+91 98455 61204', reason: 'Acne review', age: 26, sex: 'F' },
  a6: { phone: '+91 99860 70318', reason: 'Annual health check', age: 44, sex: 'M' },
  a7: { phone: '+91 98861 15530', reason: 'BP medication review', age: 63, sex: 'F' },
}

/** Earlier today, kept locally: one completed, one cancelled. */
const EXTRA_TODAY = [
  { id: 'x1', time: 9 * 60 + 30, patient: 'Neha Sinha', doctorId: 'd5', status: 'completed', phone: '+91 98455 77310', reason: 'Acne review', age: 24, sex: 'F' },
  { id: 'x2', time: 10 * 60, patient: 'Arvind Bose', doctorId: 'd6', status: 'cancelled', phone: '+91 97391 20844', reason: 'Sinus congestion', age: 52, sex: 'M' },
]

const TOMORROW = [
  { id: 'y1', time: 9 * 60 + 15, patient: 'Lakshmi Narayan', doctorId: 'd2', reason: 'Echo follow-up', phone: '+91 99001 22871' },
  { id: 'y2', time: 9 * 60 + 45, patient: 'Rohan Desai', doctorId: 'd1', reason: 'Fever, 2 days', phone: '+91 98450 70213' },
  { id: 'y3', time: 10 * 60 + 30, patient: 'Aanya Iyer', doctorId: 'd3', reason: 'Growth check', phone: '+91 97400 81139' },
  { id: 'y4', time: 11 * 60, patient: 'Bhavna Kothari', doctorId: 'd5', reason: 'Pigmentation', phone: '+91 98861 30922' },
  { id: 'y5', time: 12 * 60 + 15, patient: 'Imran Sheikh', doctorId: 'd4', reason: 'Shoulder pain', phone: '+91 99860 45127' },
  { id: 'y6', time: 15 * 60, patient: 'Gopal Rao', doctorId: 'd6', reason: 'Hearing check', phone: '+91 98455 92610' },
].map((a) => ({ ...a, status: 'booked', day: 'Wed, 25 Jun' }))

const LATER_THIS_WEEK = [
  { id: 'z1', day: 'Thu, 26 Jun', time: 9 * 60 + 30, patient: 'Swati Kulkarni', doctorId: 'd1', reason: 'Diabetes review', phone: '+91 98450 11873' },
  { id: 'z2', day: 'Thu, 26 Jun', time: 11 * 60 + 30, patient: 'Tarun Bhatia', doctorId: 'd2', reason: 'Chest pain on exertion', phone: '+91 99001 63390' },
  { id: 'z3', day: 'Fri, 27 Jun', time: 10 * 60, patient: 'Ritika Ghosh', doctorId: 'd5', reason: 'Hair fall', phone: '+91 97391 52018' },
  { id: 'z4', day: 'Fri, 27 Jun', time: 16 * 60, patient: 'Kiran Mathew', doctorId: 'd4', reason: 'Back pain', phone: '+91 98860 38471' },
  { id: 'z5', day: 'Sat, 28 Jun', time: 9 * 60 + 15, patient: 'Zoya Mirza', doctorId: 'd3', reason: 'Vaccination', phone: '+91 99020 64405' },
].map((a) => ({ ...a, status: 'booked' }))

const emptyForm = { patient: '', phone: '', doctorId: 'd1', time: '15:00', reason: '' }

function NewAppointmentDialog({ open, onClose, doctors, onCreate }) {
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.patient.trim()) next.patient = 'Enter the patient’s name.'
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a 10-digit mobile number.'
    const [h, m] = form.time.split(':').map(Number)
    const minutes = h * 60 + m
    if (Number.isNaN(minutes)) next.time = 'Pick a time.'
    else if (minutes <= NOW) next.time = `Pick a time after ${formatTime(NOW)}.`
    setErrors(next)
    if (Object.keys(next).length) return
    onCreate({ ...form, patient: form.patient.trim(), time: minutes })
    setForm(emptyForm)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New appointment"
      description="Book a visit for later today. The patient gets an SMS confirmation."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="dark" type="submit" form="new-appt">
            Book appointment
          </Button>
        </>
      }
    >
      <form id="new-appt" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Patient name" htmlFor="na-name" error={errors.patient} className="sm:col-span-2">
          <Input id="na-name" value={form.patient} onChange={set('patient')} aria-invalid={!!errors.patient} autoFocus />
        </Field>
        <Field label="Mobile number" htmlFor="na-phone" error={errors.phone}>
          <Input
            id="na-phone"
            type="tel"
            inputMode="tel"
            placeholder="+91 98450 00000"
            value={form.phone}
            onChange={set('phone')}
            aria-invalid={!!errors.phone}
          />
        </Field>
        <Field label="Time" htmlFor="na-time" error={errors.time}>
          <Input id="na-time" type="time" value={form.time} onChange={set('time')} aria-invalid={!!errors.time} />
        </Field>
        <Field label="Doctor" htmlFor="na-doctor" className="sm:col-span-2">
          <Select id="na-doctor" value={form.doctorId} onChange={set('doctorId')}>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} · {d.dept}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Reason for visit" htmlFor="na-reason" aside="Optional" className="sm:col-span-2">
          <Input id="na-reason" value={form.reason} onChange={set('reason')} placeholder="e.g. Follow-up: BP review" />
        </Field>
      </form>
    </Dialog>
  )
}

export default function AdminAppointments() {
  const state = useQueue()
  const [range, setRange] = useState('today')
  const [doctor, setDoctor] = useState('all')
  const [status, setStatus] = useState('all')
  const [q, setQ] = useState('')
  const [local, setLocal] = useState(EXTRA_TODAY)
  const [tokensByAppt, setTokensByAppt] = useState({})
  const [dialog, setDialog] = useState(false)
  const [notice, setNotice] = useState(null)

  const today = useMemo(
    () =>
      [
        ...state.appointments.map((a) => ({ ...DETAILS[a.id], ...a, store: true })),
        ...local,
      ].sort((a, b) => a.time - b.time),
    [state.appointments, local],
  )

  const list =
    range === 'today'
      ? today
      : range === 'tomorrow'
        ? TOMORROW
        : [...today.map((a) => ({ ...a, day: 'Today' })), ...TOMORROW, ...LATER_THIS_WEEK]

  const counts = {
    total: list.length,
    booked: list.filter((a) => normalizeApptStatus(a.status) === 'booked').length,
    checkedIn: list.filter((a) => normalizeApptStatus(a.status) === 'checked-in').length,
    noShow: list.filter((a) => normalizeApptStatus(a.status) === 'no-show').length,
    cancelled: list.filter((a) => normalizeApptStatus(a.status) === 'cancelled').length,
  }

  const term = q.trim().toLowerCase()
  const filtered = list.filter(
    (a) =>
      (doctor === 'all' || a.doctorId === doctor) &&
      (status === 'all' || normalizeApptStatus(a.status) === status) &&
      (!term ||
        a.patient.toLowerCase().includes(term) ||
        (a.reason ?? '').toLowerCase().includes(term) ||
        (a.phone ?? '').replace(/\s/g, '').includes(term.replace(/\s/g, ''))),
  )

  function updateStatus(appt, next) {
    if (appt.store) setAppointmentStatus(appt.id, next === 'no-show' ? 'noshow' : next)
    else setLocal((l) => l.map((a) => (a.id === appt.id ? { ...a, status: next } : a)))
  }

  function checkIn(appt) {
    const token = issueToken({
      doctorId: appt.doctorId,
      name: appt.patient,
      age: appt.age,
      sex: appt.sex ?? 'O',
      phone: appt.phone,
      reason: appt.reason,
      kind: 'appt',
    })
    setTokensByAppt((m) => ({ ...m, [appt.id]: token }))
    updateStatus(appt, 'checked-in')
    setNotice(`${appt.patient} checked in · token ${token.prefix}-${pad3(token.number)} for ${doctorById(state, appt.doctorId).name}`)
  }

  function create(form) {
    const appt = { id: `n${Date.now()}`, status: 'booked', ...form }
    setLocal((l) => [...l, appt])
    setRange('today')
    setNotice(`Appointment booked for ${appt.patient} at ${formatTime(appt.time)}.`)
  }

  const summary = [
    ['Total', counts.total],
    ['Booked', counts.booked],
    ['Checked in', counts.checkedIn],
    ['No-shows', counts.noShow],
    ['Cancelled', counts.cancelled],
  ]

  return (
    <AdminPage>
      <AdminHeader
        title="Appointments"
        description="Booked visits across all doctors. Check patients in to issue a queue token instantly."
        actions={
          <Button variant="dark" onClick={() => setDialog(true)}>
            <Plus aria-hidden="true" />
            New appointment
          </Button>
        }
      />

      <dl className="flex flex-wrap gap-x-8 gap-y-3 border-y border-qc-line py-3.5">
        {summary.map(([label, value]) => (
          <div key={label} className="flex items-baseline gap-2">
            <dt className="text-[13px] text-qc-muted">{label}</dt>
            <dd className="font-display text-lg font-extrabold text-qc-ink tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {notice && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-qc border border-qc-teal/30 bg-qc-teal/8 px-4 py-3 text-[13.5px] text-qc-text"
        >
          <Check className="size-4 shrink-0 text-qc-teal" aria-hidden="true" />
          <span className="min-w-0 flex-1">{notice}</span>
          <button
            type="button"
            aria-label="Dismiss"
            onClick={() => setNotice(null)}
            className="flex size-7 items-center justify-center rounded-[6px] text-qc-muted hover:bg-qc-ink/[0.06]"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <Panel>
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
            <Select aria-label="Filter by doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)}>
              <option value="all">All doctors</option>
              {state.doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All statuses</option>
              {apptStatusOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
            <SearchInput
              className="col-span-2 sm:col-span-1"
              aria-label="Search appointments"
              placeholder="Patient, phone or reason"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState Icon={CalendarDays} title="No appointments match">
            Try another doctor, status or search term.
          </EmptyState>
        ) : (
          <ul>
            {filtered.map((a) => {
              const st = normalizeApptStatus(a.status)
              const doc = doctorById(state, a.doctorId)
              const token = tokensByAppt[a.id]
              const actionable = range === 'today' && st === 'booked'
              return (
                <li
                  key={`${a.day ?? 'today'}-${a.id}`}
                  className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-qc-line px-4 py-3.5 last:border-b-0"
                >
                  <div className="w-16 shrink-0">
                    {a.day && <p className="text-[11px] font-semibold text-qc-muted">{a.day}</p>}
                    <p className="text-[13px] font-semibold text-qc-ink tabular-nums">{formatTime(a.time)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-qc-ink">{a.patient}</p>
                    <p className="truncate text-xs text-qc-muted">
                      {a.phone}
                      {a.reason && ` · ${a.reason}`}
                    </p>
                  </div>
                  <div className="hidden w-44 min-w-0 md:block">
                    <p className="truncate text-[13px] font-medium text-qc-text">{doc?.name}</p>
                    <p className="truncate text-xs text-qc-muted">
                      {doc?.dept} · Room {doc?.room}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 max-md:basis-full max-md:pl-[88px] md:w-auto md:justify-end">
                    {token && <TokenChip prefix={token.prefix} number={pad3(token.number)} size="sm" />}
                    <ApptStatusBadge status={a.status} />
                    {actionable && (
                      <>
                        <button type="button" onClick={() => checkIn(a)} className={adminButton('outlineTeal', 'xs')}>
                          <LogIn aria-hidden="true" />
                          Check in
                        </button>
                        {a.time < NOW && (
                          <button
                            type="button"
                            onClick={() => updateStatus(a, 'no-show')}
                            className={adminButton('outlineTeal', 'xs')}
                          >
                            <UserX aria-hidden="true" />
                            No-show
                          </button>
                        )}
                        <Button variant="ghost" size="xs" onClick={() => updateStatus(a, 'cancelled')}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {range === 'today' && (st === 'no-show' || st === 'cancelled') && (
                      <Button variant="ghost" size="xs" onClick={() => updateStatus(a, 'booked')}>
                        <Undo2 aria-hidden="true" />
                        Rebook
                      </Button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <NewAppointmentDialog open={dialog} onClose={() => setDialog(false)} doctors={state.doctors} onCreate={create} />
    </AdminPage>
  )
}
