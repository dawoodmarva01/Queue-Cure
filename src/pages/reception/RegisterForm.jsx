import { useState } from 'react'
import { ArrowUp, Siren, Ticket } from 'lucide-react'
import { Button, Field, Input, Segmented, Select } from '../../components/ui.jsx'
import { issueToken, lineFor } from '../../lib/queue.js'

const emptyFields = { phone: '', name: '', age: '', sex: 'F', reason: '' }

function validate(f) {
  const errors = {}
  const digits = f.phone.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
  if (!digits) errors.phone = 'Enter a mobile number so we can text the tracking link.'
  else if (digits.length !== 10) errors.phone = 'Mobile number should be 10 digits.'
  if (!f.name.trim()) errors.name = 'Enter the patient’s name.'
  else if (f.name.trim().length < 2) errors.name = 'Name looks too short.'
  if (f.age.trim()) {
    const age = Number(f.age)
    if (!Number.isInteger(age) || age < 0 || age > 120) errors.age = 'Enter 0–120.'
  }
  return errors
}

function formatPhone(raw) {
  const digits = raw.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '')
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
}

/**
 * Register a walk-in or appointment patient and issue a queue token.
 * `doctorId` and `priority` are controlled by the page so the doctor list
 * and the Emergency button can preset them.
 */
export function RegisterForm({ state, doctorId, onDoctorChange, priority, onPriorityChange, onIssued, phoneRef, autoFocus = false }) {
  const [kind, setKind] = useState('walkin')
  const [fields, setFields] = useState(emptyFields)
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

  function update(key, value) {
    const next = { ...fields, [key]: value }
    setFields(next)
    if (submitted) setErrors(validate(next))
  }

  function onSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    const token = issueToken({
      doctorId,
      name: fields.name.trim(),
      age: fields.age,
      sex: fields.sex,
      phone: formatPhone(fields.phone),
      reason: fields.reason.trim(),
      kind: kind === 'appointment' ? 'appt' : 'walkin',
      priority,
    })
    setFields(emptyFields)
    setErrors({})
    setSubmitted(false)
    setKind('walkin')
    onPriorityChange('normal')
    onIssued?.(token)
  }

  const e = submitted ? errors : {}

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <Segmented
        label="Visit type"
        className="w-full"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'walkin', label: 'Walk-in' },
          { value: 'appointment', label: 'Appointment' },
        ]}
      />
      <Field label="Mobile number" htmlFor="qr-phone" hint="We'll text the live tracking link here." error={e.phone}>
        <Input
          id="qr-phone"
          ref={phoneRef}
          autoFocus={autoFocus}
          inputMode="tel"
          autoComplete="off"
          placeholder="98450 12345"
          value={fields.phone}
          aria-invalid={Boolean(e.phone)}
          onChange={(ev) => update('phone', ev.target.value)}
        />
      </Field>
      <Field label="Patient name" htmlFor="qr-patientName" error={e.name}>
        <Input
          id="qr-patientName"
          autoComplete="off"
          placeholder="Full name"
          value={fields.name}
          aria-invalid={Boolean(e.name)}
          onChange={(ev) => update('name', ev.target.value)}
        />
      </Field>
      <div className="grid grid-cols-[96px_1fr] gap-3">
        <Field label="Age" htmlFor="qr-age" error={e.age}>
          <Input
            id="qr-age"
            inputMode="numeric"
            placeholder="34"
            value={fields.age}
            aria-invalid={Boolean(e.age)}
            onChange={(ev) => update('age', ev.target.value)}
          />
        </Field>
        <Field label="Sex">
          <Segmented
            label="Sex"
            className="w-full"
            value={fields.sex}
            onChange={(v) => update('sex', v)}
            options={[
              { value: 'F', label: 'Female' },
              { value: 'M', label: 'Male' },
              { value: 'O', label: 'Other' },
            ]}
          />
        </Field>
      </div>
      <Field label="Doctor" htmlFor="qr-doctorId">
        <Select id="qr-doctorId" value={doctorId} onChange={(ev) => onDoctorChange(ev.target.value)}>
          {state.doctors.map((d) => {
            const waiting = lineFor(state, d.id).length
            return (
              <option key={d.id} value={d.id} disabled={d.status === 'off'}>
                {d.status === 'off'
                  ? `${d.name} — ${d.dept} · off duty`
                  : `${d.name} — ${d.dept} · ${waiting} waiting, ~${waiting * d.avgConsult} min`}
              </option>
            )
          })}
        </Select>
      </Field>
      <Field label="Reason for visit" htmlFor="qr-reason" aside="Optional">
        <Input
          id="qr-reason"
          placeholder="e.g. Fever, follow-up"
          value={fields.reason}
          onChange={(ev) => update('reason', ev.target.value)}
        />
      </Field>
      <Field label="Priority">
        <Segmented
          label="Priority"
          className="w-full"
          value={priority}
          onChange={onPriorityChange}
          options={[
            { value: 'normal', label: 'Normal' },
            { value: 'priority', label: 'Priority', icon: ArrowUp },
            { value: 'emergency', label: 'Emergency', icon: Siren },
          ]}
        />
      </Field>
      {priority === 'emergency' && (
        <p className="-mt-1 rounded-[8px] border border-qc-skipped/40 bg-qc-skipped/10 px-3 py-2 text-xs font-medium qc-alert">
          Emergency tokens go to the front of the line and alert the doctor.
        </p>
      )}
      <Button type="submit" variant="primary" size="lg" className="mt-1 w-full">
        <Ticket aria-hidden="true" /> Issue token
        <kbd className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-[4px] border border-qc-ink/30 px-1 font-sans text-[10.5px] font-semibold opacity-70">
          ↵
        </kbd>
      </Button>
    </form>
  )
}
