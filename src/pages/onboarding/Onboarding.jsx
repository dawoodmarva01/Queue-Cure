import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Pencil, Plus, Rocket, Trash2, UserPlus } from 'lucide-react'
import { Button, ButtonLink, Field, Input, Logo, Segmented, Select, Textarea, TokenChip } from '../../components/ui.jsx'

const STEPS = [
  { title: 'Create clinic', hint: 'Name and type of practice', intro: 'Tell us about your practice. You can change any of this later in Settings.' },
  { title: 'Clinic profile', hint: 'Address, contact, timezone', intro: 'Patients see these details on their token slip and tracking page.' },
  { title: 'Departments & doctors', hint: 'Who sees patients, and where', intro: 'Each department gets its own token prefix, so patients always know which line they are in.' },
  { title: 'Staff invitations', hint: 'Reception, doctors, admins', intro: 'Invite the people who will run the queue. They get an email to set up their login.' },
  { title: 'Hours & queue rules', hint: 'When and how tokens are issued', intro: 'Set when the clinic is open and how the queue should behave during the day.' },
  { title: 'Review & launch', hint: 'Check everything, go live', intro: 'Have a last look. Once you launch, reception can start issuing tokens right away.' },
]

const PRACTICE_TYPES = [
  { value: 'single', label: 'Single specialty', hint: 'One department, one or a few doctors sharing a queue.' },
  { value: 'multi', label: 'Multi-specialty', hint: 'Several departments with their own doctors, rooms and token prefixes.' },
  { value: 'opd', label: 'Hospital OPD', hint: 'Outpatient wing of a hospital with many departments and counters.' },
]

const ROLES = [
  { value: 'reception', label: 'Reception' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'admin', label: 'Admin' },
]

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const TIMEZONES = [
  { value: 'Asia/Kolkata', label: 'India Standard Time (UTC+5:30)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (UTC+4:00)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (UTC+8:00)' },
]

let rowId = 100
const newId = () => `r${(rowId += 1)}`

const initialData = {
  name: 'Lumen Multispecialty Clinic',
  type: 'multi',
  city: 'Bengaluru',
  address: '412, 12th Main Road, HAL 2nd Stage',
  area: 'Indiranagar',
  pincode: '560038',
  phone: '+91 80412 07788',
  email: 'frontdesk@lumenclinic.in',
  timezone: 'Asia/Kolkata',
  departments: [
    { id: 'dep1', dept: 'General Medicine', prefix: 'GM', doctor: 'Dr. Ananya Rao', room: '104' },
    { id: 'dep2', dept: 'Cardiology', prefix: 'CA', doctor: 'Dr. Vikram Mehta', room: '201' },
    { id: 'dep3', dept: 'Pediatrics', prefix: 'PE', doctor: 'Dr. Sarah Thomas', room: '108' },
    { id: 'dep4', dept: 'Orthopedics', prefix: 'OR', doctor: 'Dr. Karan Shah', room: '204' },
    { id: 'dep5', dept: 'Dermatology', prefix: 'DE', doctor: 'Dr. Meera Iyer', room: '302' },
    { id: 'dep6', dept: 'ENT', prefix: 'EN', doctor: 'Dr. Rahul Nair', room: '305' },
  ],
  invites: [
    { id: 'inv1', email: 'priya.menon@lumenclinic.in', role: 'reception' },
    { id: 'inv2', email: 'ananya.rao@lumenclinic.in', role: 'doctor' },
    { id: 'inv3', email: 'ops@lumenclinic.in', role: 'admin' },
  ],
  opensAt: '09:00',
  closesAt: '18:00',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  avgConsult: '10',
  dailyLimit: '40',
  alertAhead: '2',
  intake: 'both',
  seniorPriority: true,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(step, d) {
  const e = {}
  if (step === 0) {
    if (!d.name.trim()) e.name = 'Enter the clinic name.'
    if (!d.city.trim()) e.city = 'Enter the city.'
  }
  if (step === 1) {
    if (!d.address.trim()) e.address = 'Enter the street address.'
    if (!/^\d{6}$/.test(d.pincode.trim())) e.pincode = 'Use a 6-digit PIN code.'
    if (d.phone.replace(/\D/g, '').length < 10) e.phone = 'Enter a phone number with at least 10 digits.'
    if (!EMAIL_RE.test(d.email.trim())) e.email = 'Enter a valid email address.'
  }
  if (step === 2) {
    if (d.departments.length === 0) e.departments = 'Add at least one department.'
    const seen = new Set()
    d.departments.forEach((row) => {
      const prefix = row.prefix.trim().toUpperCase()
      if (!row.dept.trim()) e[`${row.id}.dept`] = 'Required'
      if (!/^[A-Z]{2}$/.test(prefix)) e[`${row.id}.prefix`] = '2 letters'
      else if (seen.has(prefix)) e[`${row.id}.prefix`] = 'Already used'
      seen.add(prefix)
      if (!row.doctor.trim()) e[`${row.id}.doctor`] = 'Required'
      if (!row.room.trim()) e[`${row.id}.room`] = 'Required'
    })
  }
  if (step === 3) {
    d.invites.forEach((row) => {
      if (!EMAIL_RE.test(row.email.trim())) e[`${row.id}.email`] = 'Enter a valid email.'
    })
  }
  if (step === 4) {
    if (d.days.length === 0) e.days = 'Pick at least one working day.'
    if (!d.opensAt || !d.closesAt || d.closesAt <= d.opensAt) e.closesAt = 'Closing time must be after opening time.'
    const avg = Number(d.avgConsult)
    if (!Number.isFinite(avg) || avg < 3 || avg > 60) e.avgConsult = 'Between 3 and 60 minutes.'
    const limit = Number(d.dailyLimit)
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) e.dailyLimit = 'Between 1 and 200 tokens.'
  }
  return e
}

function formatClock(value) {
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h)) return value
  const h12 = ((h + 11) % 12) + 1
  return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [reached, setReached] = useState(0)
  const [data, setData] = useState(initialData)
  const [errors, setErrors] = useState({})
  const headingRef = useRef(null)
  const firstRender = useRef(true)

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    headingRef.current?.focus()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

  const update = (patch) => setData((d) => ({ ...d, ...patch }))
  const isLast = step === STEPS.length - 1

  function goTo(next) {
    setErrors({})
    setStep(next)
  }

  function handleContinue() {
    const found = validate(step, data)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    if (isLast) {
      navigate('/reception')
      return
    }
    const next = step + 1
    setReached((r) => Math.max(r, next))
    goTo(next)
  }

  const current = STEPS[step]

  return (
    <div className="qc-root flex min-h-screen flex-col">
      <header className="border-b border-qc-line bg-qc-ivory">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Logo />
          <ButtonLink variant="ghost" size="sm" href="/">
            Save &amp; exit
          </ButtonLink>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[16rem_1fr] lg:gap-14 lg:py-12">
        <nav aria-label="Setup steps" className="hidden lg:block">
          <p className="text-xs font-semibold tracking-[0.1em] text-qc-teal uppercase">Clinic setup</p>
          <ol className="mt-5">
            {STEPS.map((s, i) => {
              const isCurrent = i === step
              const isDone = i < reached && !isCurrent
              const enabled = i <= reached
              return (
                <li key={s.title} className="relative pb-6 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className={`absolute top-8 bottom-1 left-[13px] w-px ${i < reached ? 'bg-qc-teal/40' : 'bg-qc-line'}`}
                    />
                  )}
                  <button
                    type="button"
                    disabled={!enabled}
                    aria-current={isCurrent ? 'step' : undefined}
                    onClick={() => goTo(i)}
                    className="group flex w-full items-start gap-3 rounded-qc-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-qc-coral disabled:cursor-default"
                  >
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-full border font-display text-xs font-extrabold tabular-nums ${
                        isCurrent
                          ? 'border-qc-ink bg-qc-ink text-qc-ivory'
                          : isDone
                            ? 'border-qc-teal bg-qc-teal text-qc-ivory'
                            : 'border-qc-line bg-qc-surface text-qc-muted'
                      }`}
                    >
                      {isDone ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
                    </span>
                    <span className="min-w-0 pt-0.5">
                      <span
                        className={`block text-sm font-semibold ${
                          isCurrent ? 'text-qc-ink' : isDone ? 'text-qc-text group-hover:text-qc-ink' : 'text-qc-muted'
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="block text-xs text-qc-muted">{s.hint}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <main className="min-w-0">
          <div className="mb-6 lg:hidden">
            <div className="mb-2 flex items-baseline justify-between text-xs">
              <span className="font-semibold text-qc-teal">
                Step {step + 1} of {STEPS.length}
              </span>
              <span className="text-qc-muted">{isLast ? 'Last step' : `Next: ${STEPS[step + 1].title}`}</span>
            </div>
            <div
              role="meter"
              aria-label="Setup progress"
              aria-valuenow={step + 1}
              aria-valuemin={0}
              aria-valuemax={STEPS.length}
              className="h-1.5 w-full overflow-hidden rounded-full bg-qc-ink/[0.07]"
            >
              <div
                className="h-full rounded-full bg-qc-teal transition-[width] duration-500"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-[0.08em] text-qc-muted uppercase tabular-nums">
              {String(step + 1).padStart(2, '0')} / {String(STEPS.length).padStart(2, '0')}
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="mt-1 font-display text-3xl font-extrabold tracking-[-0.03em] text-qc-ink outline-none sm:text-[34px]"
            >
              {current.title}
            </h1>
            <p className="mt-1.5 text-[15px] text-qc-muted">{current.intro}</p>

            <div key={step} className="mt-8">
              {step === 0 && <StepCreate data={data} update={update} errors={errors} />}
              {step === 1 && <StepProfile data={data} update={update} errors={errors} />}
              {step === 2 && <StepDepartments data={data} update={update} errors={errors} />}
              {step === 3 && <StepStaff data={data} update={update} errors={errors} />}
              {step === 4 && <StepHours data={data} update={update} errors={errors} />}
              {step === 5 && <StepReview data={data} onEdit={goTo} />}
            </div>

            {Object.keys(errors).length > 0 && (
              <p role="alert" className="mt-6 rounded-qc-sm border border-qc-skipped/40 bg-qc-skipped/10 px-3 py-2 text-[13px] font-medium qc-alert">
                Please fix the highlighted fields to continue.
              </p>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-qc-line pt-6">
              <Button variant="ghost" size="md" disabled={step === 0} onClick={() => goTo(step - 1)}>
                <ArrowLeft aria-hidden="true" /> Back
              </Button>
              {isLast ? (
                <Button variant="primary" size="lg" onClick={handleContinue}>
                  <Rocket aria-hidden="true" /> Launch clinic
                </Button>
              ) : (
                <Button variant="dark" size="lg" onClick={handleContinue}>
                  Continue <ArrowRight aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

/* ---------- Step 1: Create clinic ---------- */

function StepCreate({ data, update, errors }) {
  const type = PRACTICE_TYPES.find((t) => t.value === data.type)
  return (
    <div className="grid gap-5">
      <Field label="Clinic name" htmlFor="name" hint="Shown on tokens, SMS and the lobby display." error={errors.name}>
        <Input
          id="name"
          className="h-12 text-[15px]"
          value={data.name}
          aria-invalid={!!errors.name}
          onChange={(e) => update({ name: e.target.value })}
        />
      </Field>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-qc-text">Type of practice</span>
        <Segmented
          label="Type of practice"
          options={PRACTICE_TYPES}
          value={data.type}
          onChange={(type) => update({ type })}
          className="w-full max-sm:flex-col"
        />
        <p className="text-xs text-qc-muted">{type.hint}</p>
      </div>
      <Field label="City" htmlFor="city" error={errors.city}>
        <Input id="city" value={data.city} aria-invalid={!!errors.city} onChange={(e) => update({ city: e.target.value })} />
      </Field>
    </div>
  )
}

/* ---------- Step 2: Clinic profile ---------- */

function StepProfile({ data, update, errors }) {
  return (
    <div className="grid gap-5">
      <Field label="Street address" htmlFor="address" error={errors.address}>
        <Textarea
          id="address"
          rows={2}
          value={data.address}
          aria-invalid={!!errors.address}
          onChange={(e) => update({ address: e.target.value })}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Area / locality" htmlFor="area" hint="Shown under the clinic name, e.g. on the tracking page.">
          <Input id="area" value={data.area} onChange={(e) => update({ area: e.target.value })} />
        </Field>
        <Field label="PIN code" htmlFor="pincode" error={errors.pincode}>
          <Input
            id="pincode"
            inputMode="numeric"
            maxLength={6}
            value={data.pincode}
            aria-invalid={!!errors.pincode}
            onChange={(e) => update({ pincode: e.target.value })}
          />
        </Field>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Reception phone" htmlFor="phone" hint="Patients can tap to call from their tracking page." error={errors.phone}>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            aria-invalid={!!errors.phone}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </Field>
        <Field label="Contact email" htmlFor="email" error={errors.email}>
          <Input
            id="email"
            type="email"
            value={data.email}
            aria-invalid={!!errors.email}
            onChange={(e) => update({ email: e.target.value })}
          />
        </Field>
      </div>
      <Field label="Timezone" htmlFor="timezone" hint="Used for opening hours, wait estimates and daily reports.">
        <Select id="timezone" value={data.timezone} onChange={(e) => update({ timezone: e.target.value })}>
          {TIMEZONES.map((tz) => (
            <option key={tz.value} value={tz.value}>
              {tz.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  )
}

/* ---------- Step 3: Departments & doctors ---------- */

function StepDepartments({ data, update, errors }) {
  const rows = data.departments
  const setRow = (id, patch) => update({ departments: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const removeRow = (id) => update({ departments: rows.filter((r) => r.id !== id) })
  const addRow = () => update({ departments: [...rows, { id: newId(), dept: '', prefix: '', doctor: '', room: '' }] })

  return (
    <div className="flex flex-col gap-3">
      {errors.departments && <p className="text-xs font-medium qc-alert">{errors.departments}</p>}
      <ul className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <li key={row.id} className="rounded-qc border border-qc-line bg-qc-surface p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <TokenChip prefix={row.prefix.toUpperCase() || '··'} number="001" tone="light" size="sm" />
                <span className="truncate text-sm font-semibold text-qc-ink">{row.dept || `Department ${i + 1}`}</span>
              </div>
              <Button
                variant="ghost"
                size="iconSm"
                aria-label={`Remove ${row.dept || `department ${i + 1}`}`}
                onClick={() => removeRow(row.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_6rem]">
              <Field label="Department" htmlFor={`${row.id}-dept`} error={errors[`${row.id}.dept`]}>
                <Input
                  id={`${row.id}-dept`}
                  placeholder="e.g. General Medicine"
                  value={row.dept}
                  aria-invalid={!!errors[`${row.id}.dept`]}
                  onChange={(e) => setRow(row.id, { dept: e.target.value })}
                />
              </Field>
              <Field label="Prefix" htmlFor={`${row.id}-prefix`} error={errors[`${row.id}.prefix`]}>
                <Input
                  id={`${row.id}-prefix`}
                  maxLength={2}
                  placeholder="GM"
                  className="font-display font-bold uppercase"
                  value={row.prefix}
                  aria-invalid={!!errors[`${row.id}.prefix`]}
                  onChange={(e) => setRow(row.id, { prefix: e.target.value.toUpperCase() })}
                />
              </Field>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_6rem]">
              <Field label="Doctor" htmlFor={`${row.id}-doctor`} error={errors[`${row.id}.doctor`]}>
                <Input
                  id={`${row.id}-doctor`}
                  placeholder="Dr. Full Name"
                  value={row.doctor}
                  aria-invalid={!!errors[`${row.id}.doctor`]}
                  onChange={(e) => setRow(row.id, { doctor: e.target.value })}
                />
              </Field>
              <Field label="Room" htmlFor={`${row.id}-room`} error={errors[`${row.id}.room`]}>
                <Input
                  id={`${row.id}-room`}
                  placeholder="104"
                  value={row.room}
                  aria-invalid={!!errors[`${row.id}.room`]}
                  onChange={(e) => setRow(row.id, { room: e.target.value })}
                />
              </Field>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="md" className="self-start" onClick={addRow}>
        <Plus aria-hidden="true" /> Add department
      </Button>
    </div>
  )
}

/* ---------- Step 4: Staff invitations ---------- */

function StepStaff({ data, update, errors }) {
  const rows = data.invites
  const setRow = (id, patch) => update({ invites: rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const removeRow = (id) => update({ invites: rows.filter((r) => r.id !== id) })
  const addRow = () => update({ invites: [...rows, { id: newId(), email: '', role: 'reception' }] })

  return (
    <div className="flex flex-col gap-4">
      {rows.length === 0 ? (
        <p className="rounded-qc border border-dashed border-qc-line bg-qc-surface px-4 py-6 text-center text-sm text-qc-muted">
          No invitations yet. You can skip this and invite your team later from Settings.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((row, i) => (
            <li key={row.id} className="grid items-start gap-3 sm:grid-cols-[1fr_9rem_auto]">
              <Field
                label={i === 0 ? 'Email' : undefined}
                htmlFor={`${row.id}-email`}
                error={errors[`${row.id}.email`]}
              >
                <Input
                  id={`${row.id}-email`}
                  type="email"
                  aria-label={i === 0 ? undefined : `Email ${i + 1}`}
                  placeholder="name@clinic.in"
                  value={row.email}
                  aria-invalid={!!errors[`${row.id}.email`]}
                  onChange={(e) => setRow(row.id, { email: e.target.value })}
                />
              </Field>
              <Field label={i === 0 ? 'Role' : undefined} htmlFor={`${row.id}-role`}>
                <Select
                  id={`${row.id}-role`}
                  aria-label={i === 0 ? undefined : `Role ${i + 1}`}
                  value={row.role}
                  onChange={(e) => setRow(row.id, { role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                variant="ghost"
                size="icon"
                className={i === 0 ? 'sm:mt-[26px]' : ''}
                aria-label={`Remove ${row.email || `invitation ${i + 1}`}`}
                onClick={() => removeRow(row.id)}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="secondary" size="md" className="self-start" onClick={addRow}>
        <UserPlus aria-hidden="true" /> Add teammate
      </Button>
      <dl className="grid gap-3 rounded-qc border border-qc-line bg-qc-surface p-4 text-[13px] sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-qc-ink">Reception</dt>
          <dd className="mt-0.5 text-qc-muted">Issues tokens, checks in appointments, calls patients.</dd>
        </div>
        <div>
          <dt className="font-semibold text-qc-ink">Doctor</dt>
          <dd className="mt-0.5 text-qc-muted">Sees their own line, calls next, adds notes.</dd>
        </div>
        <div>
          <dt className="font-semibold text-qc-ink">Admin</dt>
          <dd className="mt-0.5 text-qc-muted">Manages settings, staff, billing and reports.</dd>
        </div>
      </dl>
    </div>
  )
}

/* ---------- Step 5: Hours & queue rules ---------- */

function StepHours({ data, update, errors }) {
  const toggleDay = (day) =>
    update({ days: data.days.includes(day) ? data.days.filter((d) => d !== day) : DAYS.filter((d) => d === day || data.days.includes(d)) })

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-qc-text">Working days</span>
        <div role="group" aria-label="Working days" className="flex flex-wrap gap-2">
          {DAYS.map((day) => {
            const on = data.days.includes(day)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                onClick={() => toggleDay(day)}
                className={`h-9 min-w-12 rounded-[8px] border px-3 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-qc-coral ${
                  on ? 'border-qc-ink bg-qc-ink text-qc-ivory' : 'border-qc-line bg-qc-surface text-qc-muted hover:text-qc-text'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>
        {errors.days && <p className="text-xs font-medium qc-alert">{errors.days}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Opens at" htmlFor="opensAt">
          <Input id="opensAt" type="time" value={data.opensAt} onChange={(e) => update({ opensAt: e.target.value })} />
        </Field>
        <Field label="Closes at" htmlFor="closesAt" error={errors.closesAt}>
          <Input
            id="closesAt"
            type="time"
            value={data.closesAt}
            aria-invalid={!!errors.closesAt}
            onChange={(e) => update({ closesAt: e.target.value })}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Average consult"
          htmlFor="avgConsult"
          aside="minutes"
          hint="Starting point for wait estimates. We learn each doctor's pace."
          error={errors.avgConsult}
        >
          <Input
            id="avgConsult"
            type="number"
            min={3}
            max={60}
            value={data.avgConsult}
            aria-invalid={!!errors.avgConsult}
            onChange={(e) => update({ avgConsult: e.target.value })}
          />
        </Field>
        <Field
          label="Daily tokens per doctor"
          htmlFor="dailyLimit"
          hint="Reception is warned when a doctor's line is full."
          error={errors.dailyLimit}
        >
          <Input
            id="dailyLimit"
            type="number"
            min={1}
            max={200}
            value={data.dailyLimit}
            aria-invalid={!!errors.dailyLimit}
            onChange={(e) => update({ dailyLimit: e.target.value })}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-qc-text">Tokens are issued for</span>
        <Segmented
          label="Tokens are issued for"
          options={[
            { value: 'both', label: 'Walk-ins & appointments' },
            { value: 'walkin', label: 'Walk-ins only' },
            { value: 'appt', label: 'Appointments only' },
          ]}
          value={data.intake}
          onChange={(intake) => update({ intake })}
          className="w-full max-sm:flex-col"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-qc-text">Text patients when this many are ahead</span>
        <Segmented
          label="SMS alert threshold"
          options={['1', '2', '3', '5'].map((n) => ({ value: n, label: `${n} ahead` }))}
          value={data.alertAhead}
          onChange={(alertAhead) => update({ alertAhead })}
          className="w-full sm:w-auto"
        />
        <p className="text-xs text-qc-muted">Patients also get a message the moment they are called.</p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-qc border border-qc-line bg-qc-surface p-4">
        <input
          type="checkbox"
          checked={data.seniorPriority}
          onChange={(e) => update({ seniorPriority: e.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-qc-teal"
        />
        <span>
          <span className="block text-sm font-semibold text-qc-ink">Priority for senior citizens</span>
          <span className="mt-0.5 block text-[13px] text-qc-muted">
            Patients aged 65+ are placed ahead of regular walk-ins. Emergencies always go first.
          </span>
        </span>
      </label>
    </div>
  )
}

/* ---------- Step 6: Review & launch ---------- */

function ReviewSection({ title, step, onEdit, children }) {
  return (
    <section className="rounded-qc border border-qc-line bg-qc-surface">
      <header className="flex items-center justify-between gap-3 border-b border-qc-line px-4 py-3">
        <h2 className="font-display text-[15px] font-bold tracking-tight text-qc-ink">{title}</h2>
        <Button variant="ghost" size="xs" onClick={() => onEdit(step)}>
          <Pencil aria-hidden="true" /> Edit
        </Button>
      </header>
      <div className="px-4 py-3.5 text-sm">{children}</div>
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="grid gap-0.5 py-1.5 sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="text-[13px] text-qc-muted">{label}</dt>
      <dd className="m-0 text-qc-text">{children}</dd>
    </div>
  )
}

function StepReview({ data, onEdit }) {
  const type = PRACTICE_TYPES.find((t) => t.value === data.type)
  const tz = TIMEZONES.find((t) => t.value === data.timezone)
  const intake = { both: 'Walk-ins & appointments', walkin: 'Walk-ins only', appt: 'Appointments only' }[data.intake]
  return (
    <div className="flex flex-col gap-4">
      <ReviewSection title="Clinic" step={0} onEdit={onEdit}>
        <dl>
          <Row label="Name">{data.name}</Row>
          <Row label="Type">{type.label}</Row>
          <Row label="Address">
            {data.address}, {data.area}, {data.city} {data.pincode}
          </Row>
          <Row label="Contact">
            {data.phone} · {data.email}
          </Row>
          <Row label="Timezone">{tz.label}</Row>
        </dl>
      </ReviewSection>

      <ReviewSection title={`Departments (${data.departments.length})`} step={2} onEdit={onEdit}>
        <ul className="divide-y divide-qc-line">
          {data.departments.map((row) => (
            <li key={row.id} className="flex items-center gap-3 py-2">
              <TokenChip prefix={row.prefix} number="001" tone="light" size="sm" />
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-qc-ink">{row.dept}</span>
                <span className="text-qc-muted"> · {row.doctor}</span>
              </span>
              <span className="shrink-0 text-[13px] text-qc-muted">Room {row.room}</span>
            </li>
          ))}
        </ul>
      </ReviewSection>

      <ReviewSection title={`Staff invitations (${data.invites.length})`} step={3} onEdit={onEdit}>
        {data.invites.length === 0 ? (
          <p className="text-qc-muted">No one invited yet.</p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {data.invites.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">{row.email}</span>
                <span className="shrink-0 rounded-full bg-qc-ink/[0.06] px-2 py-0.5 text-xs font-semibold text-qc-text">
                  {ROLES.find((r) => r.value === row.role).label}
                </span>
              </li>
            ))}
          </ul>
        )}
      </ReviewSection>

      <ReviewSection title="Hours & queue rules" step={4} onEdit={onEdit}>
        <dl>
          <Row label="Open">
            {data.days.join(', ')} · {formatClock(data.opensAt)} – {formatClock(data.closesAt)}
          </Row>
          <Row label="Average consult">{data.avgConsult} min</Row>
          <Row label="Daily limit">{data.dailyLimit} tokens per doctor</Row>
          <Row label="Intake">{intake}</Row>
          <Row label="SMS alert">When {data.alertAhead} patients are ahead</Row>
          <Row label="Senior priority">{data.seniorPriority ? 'On' : 'Off'}</Row>
        </dl>
      </ReviewSection>

      <p className="flex items-start gap-2.5 rounded-qc bg-qc-teal/10 px-4 py-3 text-[13px] text-qc-teal">
        <Check className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Everything looks ready. Launching opens the reception desk so you can issue the first token.
      </p>
    </div>
  )
}
