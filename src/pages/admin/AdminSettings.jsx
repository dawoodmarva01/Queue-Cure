import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { BellRing, Building2, CalendarOff, Check, Clock, ListOrdered, Plus, Trash2 } from 'lucide-react'
import { Button, Field, Input, Panel, Segmented, Select, Textarea, TokenChip } from '../../components/ui.jsx'
import { CLINIC } from '../../lib/queue.js'
import { AdminHeader, AdminPage, Switch, adminButton } from './shared.jsx'

const SECTIONS = [
  { id: 'profile', label: 'Clinic profile', Icon: Building2 },
  { id: 'hours', label: 'Operating hours', Icon: Clock },
  { id: 'queue', label: 'Queue settings', Icon: ListOrdered },
  { id: 'notifications', label: 'Notifications', Icon: BellRing },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const VARIABLES = ['patient', 'token', 'doctor', 'room', 'wait', 'ahead', 'clinic', 'link']

const TEMPLATES = [
  { key: 'issued', label: 'Token issued', hint: 'Sent when reception registers the patient.' },
  { key: 'nearlyUp', label: 'Almost your turn', hint: 'Sent when the patient is N places away.' },
  { key: 'called', label: 'Called to room', hint: 'Sent the moment the doctor calls the token.' },
  { key: 'skipped', label: 'Skipped', hint: "Sent when a patient isn't present after the grace period." },
]

const INITIAL = {
  profile: {
    name: CLINIC.fullName,
    branch: CLINIC.branch,
    phone: '+91 80 4120 7788',
    email: 'frontdesk@lumenclinic.in',
    address: '212, 100 Feet Road, Indiranagar, Bengaluru 560038',
    tz: 'Asia/Kolkata (GMT+5:30)',
  },
  hours: Object.fromEntries(
    DAYS.map((d) => [d, { open: d !== 'Sunday', from: '09:00', to: d === 'Saturday' ? '14:00' : '19:00' }]),
  ),
  lunch: { open: true, from: '13:30', to: '14:15' },
  closures: [
    { id: 'c1', date: '2025-08-15', label: 'Independence Day' },
    { id: 'c2', date: '2025-10-20', label: 'Deepavali' },
  ],
  queue: {
    prefix: 'specialty',
    digits: 3,
    resetDaily: true,
    walkIns: true,
    emergency: true,
    maxWalkIns: '25',
    autoSkip: '3',
    recallLimit: '2',
    notifyAhead: '3',
    sms: true,
    whatsapp: true,
    display: true,
  },
  templates: {
    issued: 'Hi {patient}, your token at {clinic} is {token} for {doctor}. Estimated wait: {wait}. Track live: {link}',
    nearlyUp: "{token}: you're {ahead} away from {doctor}. Please be near Room {room}. About {wait} to go.",
    called: '{token}, please proceed to Room {room} — {doctor} is ready to see you.',
    skipped: "{token}, we called you but couldn't find you. Please see the front desk to rejoin the queue.",
  },
}

const sizedInput =
  'min-w-0 rounded-[8px] border border-qc-line bg-qc-surface px-3 text-sm text-qc-text outline-none transition-[border-color,box-shadow] placeholder:text-qc-muted/80 hover:border-qc-muted/40 focus:border-qc-teal focus:ring-3 focus:ring-qc-teal/15 h-10'

function formatClosure(iso) {
  const d = new Date(`${iso}T00:00:00`)
  const weekday = d.toLocaleDateString('en-GB', { weekday: 'short' })
  const month = d.toLocaleDateString('en-GB', { month: 'short' })
  return `${weekday}, ${d.getDate()} ${month}, ${d.getFullYear()}`
}

function tokenParts(queue, number) {
  const prefix = queue.prefix === 'specialty' ? 'GM' : queue.prefix === 'room' ? '104' : 'A'
  return { prefix, number: String(number).padStart(queue.digits, '0') }
}

function Section({ id, title, description, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32 lg:scroll-mt-24">
      <Panel
        title={<span id={`${id}-h`}>{title}</span>}
        subtitle={description}
        bodyClassName="px-5 py-5"
      >
        {children}
      </Panel>
    </section>
  )
}

function TimeRange({ label, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        className={`${sizedInput} w-[120px]`}
        type="time"
        aria-label={`${label} from`}
        value={value.from}
        onChange={(e) => onChange({ ...value, from: e.target.value })}
      />
      <span className="text-[13px] text-qc-muted">to</span>
      <input
        className={`${sizedInput} w-[120px]`}
        type="time"
        aria-label={`${label} to`}
        value={value.to}
        onChange={(e) => onChange({ ...value, to: e.target.value })}
      />
    </div>
  )
}

function NumberField({ id, label, value, onChange, suffix, hint }) {
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex items-center gap-2">
        <input
          id={id}
          className={`${sizedInput} w-24 tabular-nums`}
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <span className="text-[13px] text-qc-muted">{suffix}</span>
      </div>
    </Field>
  )
}

function TemplateEditor({ template, value, onChange, sample }) {
  const ref = useRef(null)
  const preview = VARIABLES.reduce((text, v) => text.replaceAll(`{${v}}`, sample[v]), value)
  const sms = Math.max(1, Math.ceil(preview.length / 160))

  function insert(variable) {
    const el = ref.current
    const token = `{${variable}}`
    const start = el ? el.selectionStart : value.length
    const end = el ? el.selectionEnd : value.length
    onChange(value.slice(0, start) + token + value.slice(end))
    requestAnimationFrame(() => {
      if (!el) return
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  return (
    <div className="grid gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
      <div className="flex flex-col gap-1.5">
        <label htmlFor={`t-${template.key}`} className="flex items-baseline justify-between text-[13px] font-medium text-qc-text">
          {template.label}
        </label>
        <Textarea ref={ref} id={`t-${template.key}`} rows={3} value={value} onChange={(e) => onChange(e.target.value)} />
        <div className="flex flex-wrap gap-1.5" aria-label="Insert variable">
          {VARIABLES.map((v) => {
            const used = value.includes(`{${v}}`)
            return (
              <button
                key={v}
                type="button"
                onClick={() => insert(v)}
                className={`inline-flex h-6 items-center rounded-full border px-2 font-mono text-[11.5px] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-qc-coral ${
                  used
                    ? 'border-qc-teal/30 bg-qc-teal/8 text-qc-teal'
                    : 'border-qc-line bg-qc-surface text-qc-muted hover:border-qc-teal/40 hover:text-qc-teal'
                }`}
              >
                {`{${v}}`}
              </button>
            )
          })}
        </div>
        <p className="text-xs text-qc-muted">{template.hint}</p>
      </div>
      <div className="min-w-0">
        <p className="mb-1.5 flex justify-between text-[13px] font-medium text-qc-text">
          Preview
          <span className="text-xs font-normal text-qc-muted tabular-nums">
            {preview.length} chars · {sms} SMS
          </span>
        </p>
        <p className="rounded-[12px] rounded-tl-[4px] bg-qc-ivory px-3.5 py-2.5 text-[13px] leading-relaxed break-words text-qc-text">
          {preview}
        </p>
      </div>
    </div>
  )
}

export default function AdminSettings() {
  const location = useLocation()
  const [settings, setSettings] = useState(INITIAL)
  const [saved, setSaved] = useState(INITIAL)
  const [justSaved, setJustSaved] = useState(false)
  const [active, setActive] = useState('profile')
  const [closure, setClosure] = useState({ date: '', label: '' })
  const [closureError, setClosureError] = useState('')
  const dirty = JSON.stringify(settings) !== JSON.stringify(saved)

  const update = (group) => (patch) => setSettings((s) => ({ ...s, [group]: { ...s[group], ...patch } }))
  const setProfile = update('profile')
  const setQueue = update('queue')

  // Jump to #section links (e.g. /admin/settings#queue from Departments).
  useEffect(() => {
    const id = location.hash.replace('#', '')
    if (!id) return
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ block: 'start' })
      setActive(id)
    }
  }, [location.hash])

  // Highlight the section currently in view.
  useEffect(() => {
    function onScroll() {
      let current = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= 160) current = s.id
      }
      setActive(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!justSaved) return
    const t = setTimeout(() => setJustSaved(false), 2500)
    return () => clearTimeout(t)
  }, [justSaved])

  function save() {
    setSaved(settings)
    setJustSaved(true)
  }

  function addClosure() {
    if (!closure.date) return setClosureError('Pick a date.')
    if (!closure.label.trim()) return setClosureError('Add a label so staff know why the clinic is closed.')
    if (settings.closures.some((c) => c.date === closure.date)) return setClosureError('That date is already closed.')
    setSettings((s) => ({
      ...s,
      closures: [...s.closures, { id: `c${Date.now()}`, date: closure.date, label: closure.label.trim() }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    }))
    setClosure({ date: '', label: '' })
    setClosureError('')
  }

  const { queue } = settings
  const preview = tokenParts(queue, 16)
  const code = (n) => {
    const t = tokenParts(queue, n)
    return `${t.prefix}-${t.number}`
  }
  const sample = {
    patient: 'Priya',
    token: code(16),
    doctor: 'Dr. Ananya Rao',
    room: '104',
    wait: '18 min',
    ahead: `${settings.queue.notifyAhead || 3} patients`,
    clinic: CLINIC.name,
    link: `qcure.in/t/${code(16).replace('-', '')}`,
  }

  return (
    <AdminPage>
      <AdminHeader
        title="Clinic settings"
        description={`Configure how ${CLINIC.name} runs its queues, hours and patient notifications.`}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <nav
          aria-label="Settings sections"
          className="sticky top-16 z-20 -mx-4 overflow-x-auto border-b border-qc-line bg-qc-ivory/95 px-4 backdrop-blur md:-mx-6 md:px-6 lg:top-24 lg:mx-0 lg:w-56 lg:shrink-0 lg:border-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none"
        >
          <ul className="flex gap-1 lg:flex-col">
            {SECTIONS.map(({ id, label, Icon }) => {
              const current = active === id
              return (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    aria-current={current ? 'true' : undefined}
                    onClick={(e) => {
                      e.preventDefault()
                      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      setActive(id)
                    }}
                    className={`relative flex h-11 items-center gap-2.5 px-3 text-[13.5px] font-medium whitespace-nowrap outline-none focus-visible:ring-2 focus-visible:ring-qc-coral lg:h-10 lg:rounded-[8px] [&_svg]:size-4 ${
                      current ? 'text-qc-ink lg:bg-qc-ink/[0.06]' : 'text-qc-muted hover:text-qc-text'
                    }`}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                    {current && (
                      <span aria-hidden="true" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-qc-ink lg:hidden" />
                    )}
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Section
            id="profile"
            title="Clinic profile"
            description="Shown to patients on SMS messages, tracking pages and the waiting room display."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Clinic name" htmlFor="p-name">
                <Input id="p-name" value={settings.profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
              </Field>
              <Field label="Branch" htmlFor="p-branch" aside="Optional">
                <Input id="p-branch" value={settings.profile.branch} onChange={(e) => setProfile({ branch: e.target.value })} />
              </Field>
              <Field label="Front desk phone" htmlFor="p-phone">
                <Input id="p-phone" type="tel" value={settings.profile.phone} onChange={(e) => setProfile({ phone: e.target.value })} />
              </Field>
              <Field label="Email" htmlFor="p-email">
                <Input id="p-email" type="email" value={settings.profile.email} onChange={(e) => setProfile({ email: e.target.value })} />
              </Field>
              <Field label="Address" htmlFor="p-address" className="md:col-span-2">
                <Textarea
                  id="p-address"
                  rows={2}
                  value={settings.profile.address}
                  onChange={(e) => setProfile({ address: e.target.value })}
                />
              </Field>
              <Field label="Time zone" htmlFor="p-tz">
                <Select id="p-tz" value={settings.profile.tz} onChange={(e) => setProfile({ tz: e.target.value })}>
                  <option>Asia/Kolkata (GMT+5:30)</option>
                  <option>Asia/Dubai (GMT+4:00)</option>
                  <option>Asia/Singapore (GMT+8:00)</option>
                  <option>Europe/London (GMT+0:00)</option>
                </Select>
              </Field>
            </div>
          </Section>

          <Section
            id="hours"
            title="Operating hours"
            description="Tokens can only be issued while the clinic is open. Patients are told when you reopen."
          >
            <ul className="-mt-2 divide-y divide-qc-line">
              {DAYS.map((day) => {
                const h = settings.hours[day]
                const setDay = (patch) =>
                  setSettings((s) => ({ ...s, hours: { ...s.hours, [day]: { ...s.hours[day], ...patch } } }))
                return (
                  <li key={day} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-6">
                    <div className="sm:w-44">
                      <Switch label={day} checked={h.open} onChange={(open) => setDay({ open })} />
                    </div>
                    {h.open ? (
                      <TimeRange label={day} value={h} onChange={setDay} />
                    ) : (
                      <p className="text-[13px] text-qc-muted">Closed</p>
                    )}
                  </li>
                )
              })}
              <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-6">
                <div className="sm:w-44">
                  <Switch
                    label="Lunch break"
                    checked={settings.lunch.open}
                    onChange={(open) => setSettings((s) => ({ ...s, lunch: { ...s.lunch, open } }))}
                  />
                </div>
                {settings.lunch.open ? (
                  <div className="flex flex-col gap-1">
                    <TimeRange
                      label="Lunch break"
                      value={settings.lunch}
                      onChange={(lunch) => setSettings((s) => ({ ...s, lunch }))}
                    />
                    <p className="text-xs text-qc-muted">Wait estimates pause during the break.</p>
                  </div>
                ) : (
                  <p className="text-[13px] text-qc-muted">No break — doctors consult straight through</p>
                )}
              </li>
            </ul>

            <div className="mt-6 border-t border-qc-line pt-5">
              <h3 className="font-display text-sm font-bold text-qc-ink">Holiday closures</h3>
              <p className="mt-0.5 text-[13px] text-qc-muted">The clinic is closed all day; appointment booking is blocked.</p>
              {settings.closures.length > 0 && (
                <ul className="mt-3 divide-y divide-qc-line rounded-qc border border-qc-line">
                  {settings.closures.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-3.5 py-2.5">
                      <CalendarOff className="size-4 shrink-0 text-qc-muted" aria-hidden="true" />
                      <span className="w-36 shrink-0 text-[13px] font-semibold text-qc-ink tabular-nums">
                        {formatClosure(c.date)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] text-qc-text">{c.label}</span>
                      <Button
                        variant="ghost"
                        size="iconSm"
                        aria-label={`Remove ${c.label}`}
                        onClick={() => setSettings((s) => ({ ...s, closures: s.closures.filter((x) => x.id !== c.id) }))}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
                <Input
                  className="sm:w-44"
                  type="date"
                  aria-label="Closure date"
                  value={closure.date}
                  onChange={(e) => setClosure((c) => ({ ...c, date: e.target.value }))}
                />
                <Input
                  className="sm:flex-1"
                  aria-label="Closure label"
                  placeholder="e.g. Ganesh Chaturthi"
                  value={closure.label}
                  onChange={(e) => setClosure((c) => ({ ...c, label: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addClosure()}
                />
                <button type="button" onClick={addClosure} className={adminButton('outlineTeal', 'md')}>
                  <Plus aria-hidden="true" />
                  Add closure
                </button>
              </div>
              {closureError && <p className="mt-1.5 text-xs font-medium qc-alert">{closureError}</p>}
            </div>
          </Section>

          <Section
            id="queue"
            title="Queue settings"
            description="How tokens are numbered and how the queue behaves when patients aren't present."
          >
            <div className="flex flex-col gap-6">
              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                <div className="flex flex-col gap-4">
                  <Field label="Token prefix">
                    <Segmented
                      label="Token prefix"
                      className="w-full sm:w-auto"
                      value={queue.prefix}
                      onChange={(prefix) => setQueue({ prefix })}
                      options={[
                        { value: 'specialty', label: 'Specialty code' },
                        { value: 'room', label: 'Room number' },
                        { value: 'letter', label: 'Single letter' },
                      ]}
                    />
                  </Field>
                  <Field label="Number length">
                    <Segmented
                      label="Number length"
                      className="self-start"
                      value={queue.digits}
                      onChange={(digits) => setQueue({ digits })}
                      options={[
                        { value: 2, label: '2 digits' },
                        { value: 3, label: '3 digits' },
                        { value: 4, label: '4 digits' },
                      ]}
                    />
                  </Field>
                </div>
                <div className="flex flex-col items-start gap-2 rounded-qc border border-dashed border-qc-line bg-qc-ivory/60 px-5 py-4 md:items-center">
                  <p className="text-[11.5px] font-semibold tracking-[0.06em] text-qc-muted uppercase">Live preview</p>
                  <TokenChip prefix={preview.prefix} number={preview.number} tone="dark" />
                  <p className="text-xs text-qc-muted tabular-nums">
                    Next: {code(17)} · {code(18)}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-qc-line pt-5">
                <Switch
                  label="Reset token numbers daily"
                  description="Every doctor's numbering starts again at 1 when the clinic opens."
                  checked={queue.resetDaily}
                  onChange={(resetDaily) => setQueue({ resetDaily })}
                />
                <Switch
                  label="Allow walk-ins"
                  description="Reception can issue tokens to patients without an appointment."
                  checked={queue.walkIns}
                  onChange={(walkIns) => setQueue({ walkIns })}
                />
                <Switch
                  label="Emergency override"
                  description="Emergency tokens jump to the front of any doctor's queue."
                  checked={queue.emergency}
                  onChange={(emergency) => setQueue({ emergency })}
                />
              </div>

              <div className="grid gap-4 border-t border-qc-line pt-5 sm:grid-cols-2">
                <NumberField
                  id="q-walkins"
                  label="Max walk-ins per doctor"
                  suffix="per day"
                  value={queue.maxWalkIns}
                  onChange={(maxWalkIns) => setQueue({ maxWalkIns })}
                />
                <NumberField
                  id="q-autoskip"
                  label="Auto-skip if not present after"
                  suffix="minutes"
                  value={queue.autoSkip}
                  onChange={(autoSkip) => setQueue({ autoSkip })}
                />
                <NumberField
                  id="q-recall"
                  label="Recall limit"
                  suffix="times per token"
                  hint="After this, the patient must re-register."
                  value={queue.recallLimit}
                  onChange={(recallLimit) => setQueue({ recallLimit })}
                />
                <NumberField
                  id="q-ahead"
                  label="Notify patient when"
                  suffix="patients ahead"
                  value={queue.notifyAhead}
                  onChange={(notifyAhead) => setQueue({ notifyAhead })}
                />
              </div>

              <div className="flex flex-col gap-4 border-t border-qc-line pt-5">
                <Switch
                  label="SMS notifications"
                  description="Token confirmation and turn alerts by text message."
                  checked={queue.sms}
                  onChange={(sms) => setQueue({ sms })}
                />
                <Switch
                  label="WhatsApp notifications"
                  description="Richer updates with a live tracking link."
                  checked={queue.whatsapp}
                  onChange={(whatsapp) => setQueue({ whatsapp })}
                />
                <Switch
                  label="Waiting room display"
                  description="Show now-serving tokens on the lobby TV."
                  checked={queue.display}
                  onChange={(display) => setQueue({ display })}
                />
              </div>
            </div>
          </Section>

          <Section
            id="notifications"
            title="Notifications"
            description="Message templates sent to patients. Click a variable to insert it at the cursor."
          >
            <div className="flex flex-col divide-y divide-qc-line">
              {TEMPLATES.map((t) => (
                <TemplateEditor
                  key={t.key}
                  template={t}
                  sample={sample}
                  value={settings.templates[t.key]}
                  onChange={(text) => setSettings((s) => ({ ...s, templates: { ...s.templates, [t.key]: text } }))}
                />
              ))}
            </div>
          </Section>

          <div
            className={`sticky bottom-20 z-20 flex flex-wrap items-center justify-between gap-3 rounded-qc border px-4 py-3 shadow-qc-pop transition-colors md:bottom-4 ${
              dirty ? 'border-qc-ink bg-qc-ink text-qc-ivory' : 'border-qc-line bg-qc-surface text-qc-text'
            }`}
          >
            <p role="status" className="flex items-center gap-2 text-[13.5px] font-medium">
              {dirty ? (
                <>
                  <span className="size-2 rounded-full bg-qc-coral" aria-hidden="true" />
                  You have unsaved changes
                </>
              ) : justSaved ? (
                <>
                  <Check className="size-4 text-qc-teal" aria-hidden="true" />
                  Saved — changes apply to every desk right away
                </>
              ) : (
                <span className="text-qc-muted">All changes saved</span>
              )}
            </p>
            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  type="button"
                  onClick={() => setSettings(saved)}
                  className="inline-flex h-10 items-center rounded-[8px] px-4 text-sm font-semibold text-qc-ivory outline-none hover:bg-qc-ivory/10 focus-visible:ring-2 focus-visible:ring-qc-coral"
                >
                  Discard
                </button>
              )}
              <Button variant={dirty ? 'primary' : 'secondary'} onClick={() => dirty && save()} disabled={!dirty && !justSaved}>
                {justSaved && !dirty ? (
                  <>
                    <Check aria-hidden="true" />
                    Saved
                  </>
                ) : (
                  'Save changes'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AdminPage>
  )
}
