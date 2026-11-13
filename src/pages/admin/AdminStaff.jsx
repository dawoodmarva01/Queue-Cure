import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Check, Mail, RotateCcw, Send, UserPlus, Users, X } from 'lucide-react'
import { Avatar, Button, DoctorStatus, Field, Input, Panel, Segmented, Select } from '../../components/ui.jsx'
import { useQueue } from '../../lib/queue.js'
import { AdminHeader, AdminPage, Dialog, EmptyState, PENDING_INVITE, SearchInput, adminButton } from './shared.jsx'

/** Consulting schedule + email per doctor (the store keeps live status only). */
const DOCTOR_PROFILE = {
  d1: { email: 'ananya.rao@lumenclinic.in', schedule: 'Mon–Sat · 9:00 AM – 1:30 PM' },
  d2: { email: 'vikram.mehta@lumenclinic.in', schedule: 'Mon, Wed, Fri · 10:00 AM – 2:00 PM' },
  d3: { email: 'sarah.thomas@lumenclinic.in', schedule: 'Mon–Fri · 9:00 AM – 5:00 PM' },
  d4: { email: 'karan.shah@lumenclinic.in', schedule: 'Tue, Thu, Sat · 9:30 AM – 1:00 PM' },
  d5: { email: 'meera.iyer@lumenclinic.in', schedule: 'Mon–Sat · 11:00 AM – 7:00 PM' },
  d6: { email: 'rahul.nair@lumenclinic.in', schedule: 'Wed, Sat · 4:00 PM – 7:00 PM' },
}

const INITIAL_STAFF = [
  { id: 's1', name: 'Farhan Ali', initials: 'FA', email: 'farhan@lumenclinic.in', role: 'reception', detail: 'Front desk · Morning shift', status: 'active', lastActive: 'Active now' },
  { id: 's2', name: 'Kavitha Shenoy', initials: 'KS', email: 'kavitha@lumenclinic.in', role: 'reception', detail: 'Front desk · Evening shift', status: 'active', lastActive: 'Yesterday, 7:12 PM' },
  { id: 's3', name: PENDING_INVITE.name, initials: 'DH', email: PENDING_INVITE.email, role: 'reception', detail: 'Invited 2 days ago', status: 'pending' },
  { id: 's4', name: 'Nandini Rao', initials: 'NR', email: 'nandini@lumenclinic.in', role: 'admin', detail: 'Clinic admin · Owner', status: 'active', lastActive: 'Active now', isYou: true },
]

const roleLabels = { doctor: 'Doctor', reception: 'Reception', admin: 'Admin' }

function initialsOf(name) {
  return name
    .replace(/^Dr\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function AccessBadge({ status }) {
  const styles = {
    active: { label: 'Active', className: 'bg-qc-teal/12 text-qc-teal', Icon: Check },
    pending: { label: 'Invite pending', className: 'bg-qc-amber/22 qc-attn', Icon: Mail },
    disabled: { label: 'Access removed', className: 'bg-qc-ink/[0.06] text-qc-muted', Icon: X },
  }
  const { label, className, Icon } = styles[status]
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5 ${className}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}

const emptyInvite = { name: '', email: '', role: 'reception', dept: 'General Medicine' }

function InviteDialog({ open, onClose, onInvite, existingEmails, departments }) {
  const [form, setForm] = useState(emptyInvite)
  const [errors, setErrors] = useState({})
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function close() {
    setErrors({})
    onClose()
  }

  function submit(e) {
    e.preventDefault()
    const next = {}
    const email = form.email.trim().toLowerCase()
    if (!form.name.trim()) next.name = 'Enter their full name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    else if (existingEmails.includes(email)) next.email = 'Someone with this email already has access.'
    setErrors(next)
    if (Object.keys(next).length) return
    onInvite({ ...form, name: form.name.trim(), email })
    setForm(emptyInvite)
    close()
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Invite staff"
      description="They'll get an email link to set a password and join Lumen Clinic."
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button variant="dark" type="submit" form="invite-form">
            <Send aria-hidden="true" />
            Send invite
          </Button>
        </>
      }
    >
      <form id="invite-form" onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label="Full name" htmlFor="inv-name" error={errors.name}>
          <Input id="inv-name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} autoFocus />
        </Field>
        <Field label="Work email" htmlFor="inv-email" error={errors.email}>
          <Input
            id="inv-email"
            type="email"
            placeholder="name@lumenclinic.in"
            value={form.email}
            onChange={set('email')}
            aria-invalid={!!errors.email}
          />
        </Field>
        <Field label="Role" hint={
          form.role === 'doctor'
            ? 'Doctors see their own queue and consultation history.'
            : form.role === 'reception'
              ? 'Reception can issue tokens, manage queues and check in appointments.'
              : 'Admins can change clinic settings, staff and reports.'
        }>
          <Segmented
            label="Role"
            className="w-full"
            value={form.role}
            onChange={(role) => setForm((f) => ({ ...f, role }))}
            options={[
              { value: 'reception', label: 'Reception' },
              { value: 'doctor', label: 'Doctor' },
              { value: 'admin', label: 'Admin' },
            ]}
          />
        </Field>
        {form.role === 'doctor' && (
          <Field label="Department" htmlFor="inv-dept">
            <Select id="inv-dept" value={form.dept} onChange={set('dept')}>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </Select>
          </Field>
        )}
      </form>
    </Dialog>
  )
}

export default function AdminStaff() {
  const state = useQueue()
  const [params, setParams] = useSearchParams()
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [doctorAccess, setDoctorAccess] = useState({})
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [resent, setResent] = useState({})
  const [notice, setNotice] = useState(null)
  const inviteOpen = params.get('invite') === '1'

  function setInviteOpen(open) {
    const next = new URLSearchParams(params)
    if (open) next.set('invite', '1')
    else next.delete('invite')
    setParams(next, { replace: true })
  }

  const doctors = state.doctors.map((d) => ({
    id: d.id,
    name: d.name,
    initials: d.initials,
    email: DOCTOR_PROFILE[d.id]?.email ?? '',
    role: 'doctor',
    detail: `${d.dept} · Room ${d.room}`,
    schedule: DOCTOR_PROFILE[d.id]?.schedule,
    status: doctorAccess[d.id] ?? 'active',
    liveStatus: d.status,
  }))
  const everyone = [...doctors, ...staff]

  const counts = {
    all: everyone.length,
    doctor: everyone.filter((p) => p.role === 'doctor').length,
    reception: everyone.filter((p) => p.role === 'reception').length,
    admin: everyone.filter((p) => p.role === 'admin').length,
    pending: everyone.filter((p) => p.status === 'pending').length,
  }

  const term = q.trim().toLowerCase()
  const visible = everyone.filter(
    (p) =>
      (filter === 'all' || (filter === 'pending' ? p.status === 'pending' : p.role === filter)) &&
      (!term || p.name.toLowerCase().includes(term) || p.email.toLowerCase().includes(term)),
  )

  function setAccess(person, status) {
    if (person.role === 'doctor') setDoctorAccess((m) => ({ ...m, [person.id]: status }))
    else setStaff((list) => list.map((s) => (s.id === person.id ? { ...s, status } : s)))
  }

  function revoke(person) {
    setStaff((list) => list.filter((s) => s.id !== person.id))
    setNotice(`Invite for ${person.email} revoked.`)
  }

  function invite(form) {
    const name = form.role === 'doctor' && !/^Dr\.?\s/i.test(form.name) ? `Dr. ${form.name}` : form.name
    setStaff((list) => [
      ...list,
      {
        id: `s${Date.now()}`,
        name,
        initials: initialsOf(name),
        email: form.email,
        role: form.role,
        detail: form.role === 'doctor' ? `${form.dept} · Invited just now` : 'Invited just now',
        status: 'pending',
      },
    ])
    setNotice(`Invite sent to ${form.email}. They'll appear as active once they accept.`)
  }

  const filterLabel = (label, count) => (
    <>
      {label}
      <span className="text-[11px] text-qc-muted tabular-nums">{count}</span>
    </>
  )

  return (
    <AdminPage>
      <AdminHeader
        title="Staff & doctors"
        description="Manage who can access Queue Cure, their roles, and each doctor's consulting schedule."
        actions={
          <Button variant="dark" onClick={() => setInviteOpen(true)}>
            <UserPlus aria-hidden="true" />
            Invite staff
          </Button>
        }
      />

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
        <div className="flex flex-col gap-3 border-b border-qc-line p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="-mx-1 overflow-x-auto px-1">
            <Segmented
              label="Filter staff"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: filterLabel('All', counts.all) },
                { value: 'doctor', label: filterLabel('Doctors', counts.doctor) },
                { value: 'reception', label: filterLabel('Reception', counts.reception) },
                { value: 'admin', label: filterLabel('Admins', counts.admin) },
                { value: 'pending', label: filterLabel('Pending invites', counts.pending) },
              ]}
            />
          </div>
          <SearchInput
            className="lg:w-72"
            aria-label="Search staff"
            placeholder="Search name or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState Icon={Users} title="No one matches">
            Try a different name or email, or invite them to the clinic.
          </EmptyState>
        ) : (
          <ul>
            {visible.map((p) => (
              <li
                key={p.id}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-qc-line px-4 py-3.5 last:border-b-0 ${
                  p.status === 'disabled' ? 'opacity-60' : ''
                }`}
              >
                <Avatar
                  initials={p.initials}
                  tone={p.status === 'pending' ? 'light' : p.role === 'doctor' ? 'teal' : 'ink'}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-qc-ink">
                    {p.name}
                    {p.isYou && (
                      <span className="rounded-[4px] bg-qc-ink/[0.06] px-1.5 text-[10.5px] font-bold tracking-wide text-qc-muted uppercase">
                        You
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-qc-muted">{p.email}</p>
                </div>
                <div className="hidden w-56 min-w-0 md:block">
                  <p className="truncate text-[13px] font-medium text-qc-text">{p.detail}</p>
                  <p className="truncate text-xs text-qc-muted">
                    {p.schedule ?? (p.status === 'pending' ? 'Waiting for them to accept' : p.lastActive)}
                  </p>
                </div>
                <span className="hidden w-20 text-[13px] text-qc-text sm:block">{roleLabels[p.role]}</span>
                <div className="flex items-center gap-2 max-sm:basis-full max-sm:pl-[52px] sm:w-[300px] sm:justify-end">
                  {p.role === 'doctor' && p.status === 'active' && (
                    <DoctorStatus status={p.liveStatus} className="hidden lg:inline-flex" />
                  )}
                  <AccessBadge status={p.status} />
                  {p.status === 'pending' &&
                    (resent[p.id] ? (
                      <span className="inline-flex h-7 items-center gap-1 px-1 text-xs font-semibold text-qc-teal [&_svg]:size-3.5">
                        <Check aria-hidden="true" />
                        Sent
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setResent((r) => ({ ...r, [p.id]: true }))}
                        className={adminButton('outlineTeal', 'xs')}
                      >
                        Resend
                      </button>
                    ))}
                  {p.status === 'pending' && (
                    <Button variant="ghost" size="xs" onClick={() => revoke(p)}>
                      Revoke
                    </Button>
                  )}
                  {p.status === 'active' && !p.isYou && (
                    <Button variant="ghost" size="xs" onClick={() => setAccess(p, 'disabled')}>
                      Remove access
                    </Button>
                  )}
                  {p.status === 'disabled' && (
                    <Button variant="ghost" size="xs" onClick={() => setAccess(p, 'active')}>
                      <RotateCcw aria-hidden="true" />
                      Restore
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <InviteDialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={invite}
        existingEmails={everyone.map((p) => p.email.toLowerCase())}
        departments={[...new Set(state.doctors.map((d) => d.dept))]}
      />
    </AdminPage>
  )
}
