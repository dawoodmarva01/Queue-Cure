import { useState } from 'react'
import { Search } from 'lucide-react'
import { doctorById, formatTime, pad3, useQueue } from '../../lib/queue.js'
import { Meter, Panel, Segmented, TokenChip } from '../../components/ui.jsx'
import { PriorityBadge, VisitPill, consultMinutes, matchesSearch, visitWait, visitsFor } from './doctorKit.jsx'

const DOCTOR_ID = 'd1'

/** Daily totals before today (mock). */
const previousDays = [
  { label: 'Yesterday', avg: 9.4, patients: 34 },
  { label: 'Wed, 11 Jun', avg: 8.9, patients: 37 },
  { label: 'Tue, 10 Jun', avg: 9.8, patients: 31 },
  { label: 'Mon, 9 Jun', avg: 8.6, patients: 39 },
  { label: 'Sat, 7 Jun', avg: 9.1, patients: 18 },
]

const filters = [
  { value: 'all', label: 'All' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'called', label: 'Called' },
  { value: 'serving', label: 'In consult' },
  { value: 'done', label: 'Done' },
  { value: 'skipped', label: 'Skipped' },
]

const th =
  'border-b border-qc-line bg-qc-ivory/50 px-4 py-2.5 text-[11.5px] font-semibold tracking-[0.04em] whitespace-nowrap text-qc-muted uppercase'
const td = 'border-b border-qc-line px-4 py-3 align-middle'

function TodayStat({ label, value, unit, note, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[12px] font-medium text-qc-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-1 font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] text-qc-ink tabular-nums">
        {value}
        {unit && <span className="text-sm font-bold tracking-normal text-qc-muted">{unit}</span>}
      </p>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-qc-muted">{note}</p>
      {children}
    </div>
  )
}

const visitLabel = (tk) => (tk.kind === 'appt' ? 'Appointment' : 'Walk-in')
const minutes = (m) => (m == null ? '—' : `${m} min`)
const average = (list) => (list.length ? list.reduce((sum, n) => sum + n, 0) / list.length : 0)

export default function DoctorHistory() {
  const state = useQueue()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')

  const doctor = doctorById(state, DOCTOR_ID)
  const visits = visitsFor(state, DOCTOR_ID)
  const done = visits.filter((tk) => tk.status === 'done')
  const skippedCount = visits.filter((tk) => tk.status === 'skipped').length
  const inQueue = visits.filter((tk) => tk.status === 'waiting' || tk.status === 'called').length

  const avgConsult = average(done.map(consultMinutes))
  const target = doctor.avgConsult
  const overTarget = avgConsult > target
  const avgWait = Math.round(average(done.map(visitWait)))
  const longestWait = visits.reduce((max, tk) => Math.max(max, visitWait(tk) ?? 0), 0)

  const shown = visits.filter((tk) => (filter === 'all' || tk.status === filter) && matchesSearch(tk, query))

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-qc-teal uppercase">
            {doctor.name} · Room {doctor.room}
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-qc-ink md:text-[28px]">
            Consultations
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-qc-muted">
            Your patients today and how the day is pacing against your consultation target.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Today" subtitle="Live from your queue" className="lg:col-span-2">
          <div className="grid grid-cols-1 divide-y divide-qc-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="min-w-0 px-5 py-4">
              <TodayStat label="Patients seen" value={done.length} note="completed consultations" />
            </div>
            <div className="px-5 py-4">
              <TodayStat
                label="Avg consultation"
                value={avgConsult.toFixed(1)}
                unit="min"
                note={
                  <span className={`font-semibold ${overTarget ? 'qc-attn' : 'text-qc-teal'}`}>
                    {overTarget
                      ? `${(avgConsult - target).toFixed(1)} min over ${target} min target`
                      : `Within ${target} min target`}
                  </span>
                }
              />
              <div className="mt-3">
                <Meter
                  value={avgConsult}
                  max={target * 1.5}
                  tone={overTarget ? 'amber' : 'teal'}
                  label={`Average consultation ${avgConsult.toFixed(1)} minutes against a ${target} minute target`}
                />
              </div>
            </div>
            <div className="min-w-0 px-5 py-4">
              <TodayStat label="Longest wait" value={`${longestWait} min`} note="check-in to consult" />
            </div>
          </div>
        </Panel>

        <Panel title="Previous days">
          <ul className="divide-y divide-qc-line">
            {previousDays.map((day) => (
              <li key={day.label} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-qc-ink">{day.label}</p>
                  <p className="text-xs text-qc-muted tabular-nums">avg {day.avg.toFixed(1)} min</p>
                </div>
                <span className="text-sm font-semibold text-qc-text tabular-nums">
                  {day.patients} <span className="font-normal text-qc-muted">patients</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="overflow-hidden">
        <dl className="grid grid-cols-2 gap-px border-b border-qc-line bg-qc-line sm:grid-cols-4">
          {[
            ['Completed', done.length],
            ['Skipped', skippedCount],
            ['Average wait', `${avgWait} min`],
            ['Still in queue', inQueue],
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
            <Segmented label="Filter by status" size="sm" options={filters} value={filter} onChange={setFilter} />
          </div>
          <div className="flex flex-1 flex-col gap-2 sm:flex-row lg:justify-end">
            <div className="relative flex items-center sm:w-72">
              <span className="pointer-events-none absolute left-3 flex text-qc-muted [&_svg]:size-4">
                <Search aria-hidden="true" />
              </span>
              <input
                type="search"
                aria-label="Search by patient, token or phone"
                placeholder="Search patient, token or phone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-10 w-full min-w-0 rounded-[8px] border border-qc-line bg-qc-surface px-3 pl-9 text-sm text-qc-text outline-none transition-[border-color,box-shadow] placeholder:text-qc-muted/80 hover:border-qc-muted/40 focus:border-qc-teal focus:ring-3 focus:ring-qc-teal/15"
              />
            </div>
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          {shown.length} visits shown
        </p>

        {shown.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm font-semibold text-qc-ink">No visits match</p>
            <p className="mt-1 text-[13px] text-qc-muted">Try a different status filter or search term.</p>
          </div>
        ) : (
          <>
            <div className="hidden w-full overflow-x-auto md:block">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr>
                    <th scope="col" className={th}>Token</th>
                    <th scope="col" className={th}>Patient</th>
                    <th scope="col" className={th}>Visit</th>
                    <th scope="col" className={`${th} text-right`}>Checked in</th>
                    <th scope="col" className={`${th} text-right`}>Wait</th>
                    <th scope="col" className={`${th} text-right`}>Consult</th>
                    <th scope="col" className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((tk) => {
                    const stillWaiting = tk.status === 'waiting' || tk.status === 'called'
                    return (
                      <tr key={tk.id} className="hover:bg-qc-ivory/50">
                        <td className={`${td} text-qc-text`}>
                          <TokenChip prefix={tk.prefix} number={pad3(tk.number)} size="sm" />
                        </td>
                        <td className={`${td} text-qc-text`}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-qc-ink">{tk.patient.name}</span>
                            {stillWaiting && <PriorityBadge priority={tk.priority} />}
                          </span>
                          <span className="block text-xs text-qc-muted">{tk.reason}</span>
                        </td>
                        <td className={`${td} text-qc-muted`}>{visitLabel(tk)}</td>
                        <td className={`${td} text-right text-qc-text tabular-nums`}>{formatTime(tk.checkedInAt)}</td>
                        <td className={`${td} text-right text-qc-text tabular-nums`}>
                          {minutes(visitWait(tk))}
                          {stillWaiting && <span className="block text-[11px] text-qc-muted">so far</span>}
                        </td>
                        <td className={`${td} text-right text-qc-text tabular-nums`}>{minutes(consultMinutes(tk))}</td>
                        <td className={`${td} text-qc-text`}>
                          <VisitPill status={tk.status} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-qc-line md:hidden">
              {shown.map((tk) => (
                <li key={tk.id} className="flex flex-col gap-2 px-4 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <TokenChip prefix={tk.prefix} number={pad3(tk.number)} size="sm" />
                      <span className="truncate font-medium text-qc-ink">{tk.patient.name}</span>
                    </span>
                    <VisitPill status={tk.status} />
                  </div>
                  <dl className="grid grid-cols-3 gap-2 text-xs">
                    <div className="min-w-0">
                      <dt className="text-qc-muted">Checked in</dt>
                      <dd className="font-semibold text-qc-text tabular-nums">{formatTime(tk.checkedInAt)}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-qc-muted">Wait</dt>
                      <dd className="font-semibold text-qc-text tabular-nums">{minutes(visitWait(tk))}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-qc-muted">Consult</dt>
                      <dd className="font-semibold text-qc-text tabular-nums">{minutes(consultMinutes(tk))}</dd>
                    </div>
                  </dl>
                  <p className="text-xs text-qc-muted">{visitLabel(tk)}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  )
}
