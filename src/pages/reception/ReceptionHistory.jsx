import { useState } from 'react'
import { History, Search } from 'lucide-react'
import { Flag, Input, PageHeader, Segmented, Select, StatusPill, TokenChip } from '../../components/ui.jsx'
import { CLINIC, NOW, doctorById, formatTime, lineFor, pad3, tokenCode, useQueue } from '../../lib/queue.js'
import { earlierVisits } from './shared.jsx'

const statusOptions = [
  { value: 'all', label: 'All' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'called', label: 'Called' },
  { value: 'serving', label: 'In consult' },
  { value: 'done', label: 'Done' },
  { value: 'skipped', label: 'Skipped' },
]

/** Wait and consult durations for a visit, as display values. */
function timings(tk) {
  const inQueue = tk.status === 'waiting' || tk.status === 'called'
  let wait = null
  if (inQueue) wait = NOW - tk.checkedInAt
  else if (tk.startedAt != null) wait = tk.startedAt - tk.checkedInAt
  const consult = tk.status === 'done' && tk.startedAt != null ? tk.endedAt - tk.startedAt : null
  return {
    wait: wait == null ? '—' : `${wait} min`,
    waitSoFar: inQueue,
    consult: consult == null ? '—' : `${consult} min`,
  }
}

const th =
  'border-b border-qc-line bg-qc-ivory/50 px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap text-qc-muted uppercase'
const td = 'border-b border-qc-line px-4 py-3 align-middle'

export default function ReceptionHistory() {
  const state = useQueue()
  const [status, setStatus] = useState('all')
  const [doctorFilter, setDoctorFilter] = useState('all')
  const [query, setQuery] = useState('')

  const visits = [...state.tokens, ...earlierVisits(state)].sort(
    (a, b) => b.checkedInAt - a.checkedInAt || b.number - a.number,
  )

  const done = visits.filter((tk) => tk.status === 'done')
  const avgWait = done.length
    ? Math.round(done.reduce((sum, tk) => sum + (tk.startedAt - tk.checkedInAt), 0) / done.length)
    : 0
  const stillInQueue = state.doctors.reduce((sum, d) => sum + lineFor(state, d.id).length, 0)

  const term = query.trim().toLowerCase().replace(/\s/g, '')
  const shown = visits
    .filter((tk) => status === 'all' || tk.status === status)
    .filter((tk) => doctorFilter === 'all' || tk.doctorId === doctorFilter)
    .filter(
      (tk) =>
        !term ||
        tk.patient.name.toLowerCase().replace(/\s/g, '').includes(term) ||
        tokenCode(tk).toLowerCase().replace('-', '').includes(term.replace('-', '')) ||
        (tk.patient.phone ?? '').replace(/\s/g, '').includes(term),
    )

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader eyebrow={CLINIC.name} title="Queue history">
        <p className="mt-1.5 max-w-2xl text-sm text-qc-muted">
          Every token issued today, with waiting and consultation times. Updates live as the queue moves.
        </p>
      </PageHeader>

      <section className="flex min-w-0 flex-col overflow-hidden rounded-qc border border-qc-line bg-qc-surface">
        <div className="min-w-0 flex-1">
          <dl className="grid grid-cols-2 gap-px border-b border-qc-line bg-qc-line sm:grid-cols-4">
            {[
              ['Completed', done.length],
              ['Skipped', visits.filter((tk) => tk.status === 'skipped').length],
              ['Average wait', `${avgWait} min`],
              ['Still in queue', stillInQueue],
            ].map(([label, value]) => (
              <div key={label} className="bg-qc-surface px-5 py-3.5">
                <dt className="text-[12px] font-medium text-qc-muted">{label}</dt>
                <dd className="mt-0.5 font-display text-xl font-extrabold tracking-[-0.02em] text-qc-ink tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 border-b border-qc-line px-4 py-3.5 md:px-5 lg:flex-row lg:items-center">
            <div className="-mx-1 overflow-x-auto px-1">
              <Segmented label="Filter by status" size="sm" value={status} onChange={setStatus} options={statusOptions} />
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
              <div className="sm:w-56">
                <Select aria-label="Filter by doctor" value={doctorFilter} onChange={(e) => setDoctorFilter(e.target.value)}>
                  <option value="all">All doctors</option>
                  {state.doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="relative flex items-center sm:w-72">
                <span className="pointer-events-none absolute left-3 flex text-qc-muted [&_svg]:size-4">
                  <Search aria-hidden="true" />
                </span>
                <Input
                  type="search"
                  className="pl-9"
                  aria-label="Search by patient, token or phone"
                  placeholder="Search patient, token or phone…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <p className="sr-only" aria-live="polite">
            {shown.length} visits shown
          </p>

          {shown.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-14 text-center">
              <History className="size-6 text-qc-muted" aria-hidden="true" />
              <p className="text-sm font-semibold text-qc-ink">No visits match these filters</p>
              <p className="text-[13px] text-qc-muted">Try another status, doctor or search term.</p>
            </div>
          ) : (
            <>
              <div className="hidden w-full overflow-x-auto md:block">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={th}>Token</th>
                      <th scope="col" className={th}>Patient</th>
                      <th scope="col" className={th}>Doctor</th>
                      <th scope="col" className={th}>Visit</th>
                      <th scope="col" className={`${th} text-right`}>Checked in</th>
                      <th scope="col" className={`${th} text-right`}>Wait</th>
                      <th scope="col" className={`${th} text-right`}>Consult</th>
                      <th scope="col" className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((tk) => {
                      const t = timings(tk)
                      return (
                        <tr key={tk.id} className="hover:bg-qc-ivory/50">
                          <td className={`${td} text-qc-text`}>
                            <TokenChip prefix={tk.prefix} number={pad3(tk.number)} tone="light" size="sm" />
                          </td>
                          <td className={`${td} text-qc-text`}>
                            <span className="flex items-center gap-2">
                              <span className="font-medium text-qc-ink">{tk.patient.name}</span>
                              {tk.priority !== 'normal' && <Flag type={tk.priority} />}
                            </span>
                            <span className="block text-xs text-qc-muted">{tk.reason}</span>
                          </td>
                          <td className={`${td} whitespace-nowrap text-qc-muted`}>{doctorById(state, tk.doctorId).name}</td>
                          <td className={`${td} text-qc-muted`}>{tk.kind === 'appt' ? 'Appointment' : 'Walk-in'}</td>
                          <td className={`${td} text-right text-qc-text tabular-nums`}>{formatTime(tk.checkedInAt)}</td>
                          <td className={`${td} text-right text-qc-text tabular-nums`}>
                            {t.wait}
                            {t.waitSoFar && <span className="block text-[11px] text-qc-muted">so far</span>}
                          </td>
                          <td className={`${td} text-right text-qc-text tabular-nums`}>{t.consult}</td>
                          <td className={`${td} text-qc-text`}>
                            <StatusPill status={tk.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-qc-line md:hidden">
                {shown.map((tk) => {
                  const t = timings(tk)
                  return (
                    <li key={tk.id} className="flex flex-col gap-2 px-4 py-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <TokenChip prefix={tk.prefix} number={pad3(tk.number)} tone="light" size="sm" />
                          <span className="truncate font-medium text-qc-ink">{tk.patient.name}</span>
                        </span>
                        <StatusPill status={tk.status} />
                      </div>
                      <dl className="grid grid-cols-3 gap-2 text-xs">
                        <div className="min-w-0">
                          <dt className="text-qc-muted">Checked in</dt>
                          <dd className="font-semibold text-qc-text tabular-nums">{formatTime(tk.checkedInAt)}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-qc-muted">Wait</dt>
                          <dd className="font-semibold text-qc-text tabular-nums">{t.wait}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-qc-muted">Consult</dt>
                          <dd className="font-semibold text-qc-text tabular-nums">{t.consult}</dd>
                        </div>
                      </dl>
                      <p className="text-xs text-qc-muted">
                        {tk.kind === 'appt' ? 'Appointment' : 'Walk-in'} · {doctorById(state, tk.doctorId).name}
                      </p>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
