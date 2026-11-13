import { useState } from 'react'
import { Layers, Pencil, Plus } from 'lucide-react'
import { Button, DoctorStatus, Field, Input, Meter, Panel, Select, SmartLink } from '../../components/ui.jsx'
import { pad3, useQueue } from '../../lib/queue.js'
import { AdminHeader, AdminPage, Dialog, EmptyState, adminButton } from './shared.jsx'

const FLOORS = ['Ground', '1st', '2nd', '3rd']

/** Department layout. Doctors are matched to departments by their `dept` name in the store. */
const INITIAL_DEPARTMENTS = [
  { id: 'gm', name: 'General Medicine', prefix: 'GM', floor: '1st', rooms: ['104'] },
  { id: 'ca', name: 'Cardiology', prefix: 'CA', floor: '2nd', rooms: ['201'] },
  { id: 'pe', name: 'Pediatrics', prefix: 'PE', floor: '1st', rooms: ['108', '109'] },
  { id: 'or', name: 'Orthopedics', prefix: 'OR', floor: '2nd', rooms: ['204'] },
  { id: 'de', name: 'Dermatology', prefix: 'DE', floor: '3rd', rooms: ['302'] },
  { id: 'en', name: 'ENT', prefix: 'EN', floor: '3rd', rooms: ['305'] },
]

const emptyForm = { name: '', prefix: '', floor: '1st', rooms: '' }

function DepartmentDialog({ open, initial, onClose, onSave, takenPrefixes }) {
  const [form, setForm] = useState(initial ?? emptyForm)
  const [errors, setErrors] = useState({})
  const editing = Boolean(initial?.id)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: k === 'prefix' ? e.target.value.toUpperCase() : e.target.value }))

  function submit(e) {
    e.preventDefault()
    const next = {}
    const prefix = form.prefix.trim()
    const rooms = form.rooms
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean)
    if (!form.name.trim()) next.name = 'Enter a department name.'
    if (!/^[A-Z]{2}$/.test(prefix)) next.prefix = 'Use two letters, e.g. GM.'
    else if (takenPrefixes.includes(prefix)) next.prefix = `${prefix} is already used by another department.`
    if (rooms.length === 0) next.rooms = 'Add at least one consulting room.'
    setErrors(next)
    if (Object.keys(next).length) return
    onSave({ ...initial, name: form.name.trim(), prefix, floor: form.floor, rooms })
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? `Edit ${initial.name}` : 'Add department'}
      description="Departments group consulting rooms and set the token prefix patients see."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="dark" type="submit" form="dept-form">
            {editing ? 'Save changes' : 'Add department'}
          </Button>
        </>
      }
    >
      <form id="dept-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Department name" htmlFor="dp-name" error={errors.name} className="sm:col-span-2">
          <Input id="dp-name" value={form.name} onChange={set('name')} aria-invalid={!!errors.name} placeholder="e.g. Gynaecology" autoFocus />
        </Field>
        <Field label="Token prefix" htmlFor="dp-prefix" error={errors.prefix} hint="Shown before every token number.">
          <Input id="dp-prefix" maxLength={2} value={form.prefix} onChange={set('prefix')} aria-invalid={!!errors.prefix} className="uppercase" placeholder="GY" />
        </Field>
        <Field label="Floor" htmlFor="dp-floor">
          <Select id="dp-floor" value={form.floor} onChange={set('floor')}>
            {FLOORS.map((f) => (
              <option key={f} value={f}>
                {f === 'Ground' ? 'Ground floor' : `${f} floor`}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Consulting rooms" htmlFor="dp-rooms" error={errors.rooms} hint="Separate rooms with commas." className="sm:col-span-2">
          <Input id="dp-rooms" value={form.rooms} onChange={set('rooms')} aria-invalid={!!errors.rooms} placeholder="e.g. 110, 111" />
        </Field>
      </form>
    </Dialog>
  )
}

export default function AdminDepartments() {
  const state = useQueue()
  const [departments, setDepartments] = useState(INITIAL_DEPARTMENTS)
  const [editing, setEditing] = useState(null) // null | 'new' | department

  const roomCount = departments.reduce((n, d) => n + d.rooms.length, 0)

  function save(dept) {
    if (dept.id) setDepartments((list) => list.map((d) => (d.id === dept.id ? dept : d)))
    else setDepartments((list) => [...list, { ...dept, id: `dept${Date.now()}` }])
  }

  const dialogInitial =
    editing && editing !== 'new' ? { ...editing, rooms: editing.rooms.join(', ') } : null

  return (
    <AdminPage>
      <AdminHeader
        title="Departments"
        description="How your clinic is organised — floors, consulting rooms, and the doctors in each specialty."
        actions={
          <Button variant="dark" onClick={() => setEditing('new')}>
            <Plus aria-hidden="true" />
            Add department
          </Button>
        }
      />

      <Panel
        title="Departments"
        subtitle={`${departments.length} departments · ${roomCount} consulting room${roomCount === 1 ? '' : 's'}`}
      >
        <div className="hidden grid-cols-[minmax(0,1.4fr)_90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_40px] gap-4 border-b border-qc-line bg-qc-ivory/50 px-5 py-2.5 text-[11.5px] font-semibold tracking-[0.04em] text-qc-muted uppercase lg:grid">
          <span>Department</span>
          <span>Floor</span>
          <span>Rooms</span>
          <span>Doctors</span>
          <span>Today's load</span>
          <span className="sr-only">Actions</span>
        </div>
        {departments.length === 0 ? (
          <EmptyState Icon={Layers} title="No departments yet" />
        ) : (
          <ul>
            {departments.map((dept) => {
              const doctors = state.doctors.filter((d) => d.dept === dept.name)
              const ids = doctors.map((d) => d.id)
              const tokens = state.tokens.filter((tk) => ids.includes(tk.doctorId))
              const capacity = doctors.reduce((n, d) => n + d.capacity, 0)
              const waiting = tokens.filter((tk) => tk.status === 'waiting' || tk.status === 'called').length
              return (
                <li
                  key={dept.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 border-b border-qc-line px-5 py-4 last:border-b-0 lg:grid-cols-[minmax(0,1.4fr)_90px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_40px]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[8px] bg-qc-teal/10 font-display text-[13px] font-extrabold text-qc-teal">
                      {dept.prefix}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-qc-ink">{dept.name}</p>
                      <p className="truncate text-xs text-qc-muted lg:hidden">
                        {dept.floor === 'Ground' ? 'Ground floor' : `${dept.floor} floor`} · Room {dept.rooms.join(', ')}
                      </p>
                    </div>
                  </div>
                  <span className="hidden text-[13px] text-qc-text lg:block">
                    {dept.floor === 'Ground' ? 'Ground' : `${dept.floor} floor`}
                  </span>
                  <span className="hidden text-[13px] text-qc-text tabular-nums lg:block">{dept.rooms.join(', ')}</span>
                  <span className="col-span-2 min-w-0 truncate text-[13px] text-qc-text lg:col-span-1">
                    {doctors.length ? doctors.map((d) => d.name).join(', ') : <span className="text-qc-muted">No doctors yet</span>}
                  </span>
                  <div className="col-span-2 min-w-0 lg:col-span-1">
                    {capacity ? (
                      <>
                        <p className="flex justify-between text-[11.5px] text-qc-muted">
                          <span>{waiting} waiting</span>
                          <span className="tabular-nums">
                            {tokens.length}/{capacity}
                          </span>
                        </p>
                        <Meter
                          className="mt-1.5"
                          value={tokens.length}
                          max={capacity}
                          label={`${dept.name} load today`}
                          tone={tokens.length / capacity >= 0.85 ? 'coral' : 'teal'}
                        />
                      </>
                    ) : (
                      <span className="text-[13px] text-qc-muted">—</span>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`Edit ${dept.name}`}
                    onClick={() => setEditing(dept)}
                    className="col-start-2 row-start-1 flex size-8 items-center justify-center rounded-qc-sm text-qc-muted outline-none hover:bg-qc-ink/[0.06] hover:text-qc-text focus-visible:ring-2 focus-visible:ring-qc-coral lg:col-start-auto lg:row-start-auto"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <Panel
        title="Specialties & token prefixes"
        subtitle="Each doctor issues tokens with their own prefix so patients can spot their queue on the waiting room display."
        actions={
          <SmartLink href="/admin/settings#queue" className={adminButton('link', 'sm')}>
            Token format
          </SmartLink>
        }
      >
        <ul className="grid divide-y divide-qc-line md:grid-cols-2 md:divide-y-0">
          {state.doctors.map((d, i) => {
            const last = state.tokens
              .filter((tk) => tk.prefix === d.prefix)
              .reduce((max, tk) => Math.max(max, tk.number), 0)
            const lastRow = i >= state.doctors.length - (state.doctors.length % 2 === 0 ? 2 : 1)
            return (
              <li
                key={d.id}
                className={`flex items-center gap-4 px-5 py-3.5 md:border-b md:border-qc-line ${i % 2 === 0 ? 'md:border-r' : ''} ${
                  lastRow ? 'md:border-b-0' : ''
                }`}
              >
                <span className="relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border border-qc-line bg-qc-ivory px-2.5 font-display text-sm font-extrabold tracking-[-0.01em] text-qc-ink tabular-nums [mask:radial-gradient(circle_at_0_50%,transparent_4px,#000_4.5px)_left/51%_100%_no-repeat,radial-gradient(circle_at_100%_50%,transparent_4px,#000_4.5px)_right/51%_100%_no-repeat]">
                  <span className="text-[0.8em] font-bold opacity-60">{d.prefix}</span>
                  <span>001</span>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-qc-ink">{d.dept}</p>
                  <p className="truncate text-xs text-qc-muted">
                    {d.name} · Room {d.room}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[11.5px] text-qc-muted">Last issued</p>
                  <p className="text-[13px] font-semibold text-qc-ink tabular-nums">
                    {last ? `${d.prefix}-${pad3(last)}` : '—'}
                  </p>
                </div>
                <DoctorStatus status={d.status} className="hidden lg:inline-flex" />
              </li>
            )
          })}
        </ul>
      </Panel>

      {editing && (
        <DepartmentDialog
          key={editing === 'new' ? 'new' : editing.id}
          open
          initial={dialogInitial}
          onClose={() => setEditing(null)}
          onSave={save}
          takenPrefixes={departments.filter((d) => d.id !== dialogInitial?.id).map((d) => d.prefix)}
        />
      )}
    </AdminPage>
  )
}
