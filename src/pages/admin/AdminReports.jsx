import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Download, Lightbulb } from 'lucide-react'
import { Avatar, Button, Panel, Segmented, Select } from '../../components/ui.jsx'
import { useQueue } from '../../lib/queue.js'
import { AdminHeader, AdminPage } from './shared.jsx'

/* ---------- deterministic mock analytics ---------- */

function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Share of clinic volume + typical wait per doctor (30-day baseline). */
const DOCTOR_BASE = {
  d1: { share: 0.27, wait: 19, noShow: 4.1, util: 92 },
  d2: { share: 0.13, wait: 22, noShow: 6.3, util: 81 },
  d3: { share: 0.19, wait: 14, noShow: 3.2, util: 74 },
  d4: { share: 0.14, wait: 17, noShow: 5.5, util: 69 },
  d5: { share: 0.19, wait: 12, noShow: 7.8, util: 77 },
  d6: { share: 0.08, wait: 11, noShow: 2.9, util: 42 },
}

const RANGES = {
  today: { label: 'Today', unit: 'Patients per hour', waitNote: 'Minutes from check-in to consultation · today' },
  '30d': { label: '30 days', unit: 'Patients per day', waitNote: 'Minutes from check-in to consultation · last 30 days' },
  '12m': { label: '12 months', unit: 'Patients per month', waitNote: 'Minutes from check-in to consultation · last 12 months' },
}

const MONTHS = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
const HOUR_LABELS = ['9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildReport(range, doctorIds) {
  const share = doctorIds.reduce((n, id) => n + DOCTOR_BASE[id].share, 0)
  const r = rng(range.length * 97 + Math.round(share * 1000))
  let volume
  if (range === 'today') {
    const curve = [14, 22, 9, 0, 0, 0, 0, 0, 0, 0]
    volume = HOUR_LABELS.map((label, i) => ({ label, value: Math.round(curve[i] * share), future: i > 2 }))
  } else if (range === '30d') {
    volume = Array.from({ length: 30 }, (_, i) => {
      const day = new Date(2025, 4, 26 + i)
      const sunday = day.getDay() === 0
      const base = sunday ? 0 : day.getDay() === 6 ? 70 : day.getDay() === 1 || day.getDay() === 5 ? 140 : 118
      return {
        label: `${day.getDate()} ${day.toLocaleString('en-GB', { month: 'short' })}`,
        short: i % 5 === 0 ? String(day.getDate()) : '',
        value: Math.round(base * share * (0.88 + r() * 0.24)),
      }
    })
  } else {
    volume = MONTHS.map((label, i) => ({
      label,
      value: Math.round((2650 + i * 45 + (i === 3 || i === 4 ? 380 : 0)) * share * (0.9 + r() * 0.2)),
    }))
  }

  const waitPoints = volume.map((v, i) =>
    v.value === 0 && range !== '12m' ? null : Math.round(10 + 9 * Math.sin(i / 2.2) * 0.5 + r() * 9 + (share > 0.5 ? 4 : 0)),
  )
  const avgWait = Math.round(
    doctorIds.reduce((n, id) => n + DOCTOR_BASE[id].wait * DOCTOR_BASE[id].share, 0) / share,
  )
  const total = volume.reduce((n, v) => n + v.value, 0)
  const noShow = doctorIds.reduce((n, id) => n + DOCTOR_BASE[id].noShow * DOCTOR_BASE[id].share, 0) / share
  const apptShare = Math.round(28 + r() * 10)
  const longConsults = doctorIds.includes('d2') ? 1.4 : 1
  const lengths = [
    { label: 'Under 5 min', value: 14 },
    { label: '5–10 min', value: 38 },
    { label: '10–15 min', value: 29 * longConsults },
    { label: '15–20 min', value: 12 * longConsults },
    { label: 'Over 20 min', value: 7 * longConsults },
  ]
  const lengthTotal = lengths.reduce((n, l) => n + l.value, 0)
  const heat = WEEKDAYS.map((day, d) =>
    HOUR_LABELS.map((_, h) => {
      const late = h === 1 || h === 2
      const busyDay = d === 0 || d === 4
      const base = [6, 13, 14, 9, 4, 6, 8, 9, 7, 4][h] + (busyDay && late ? 6 : 0) - (d === 5 && h > 4 ? 6 : 0)
      return Math.max(0, Math.round(base * share * 1.4 + r() * 2))
    }),
  )

  return {
    volume,
    waitPoints,
    lengths: lengths.map((l) => ({ ...l, pct: Math.round((l.value / lengthTotal) * 100) })),
    heat,
    kpis: {
      total,
      avgWait,
      noShow: noShow.toFixed(1),
    },
    walkIns: total - Math.round((total * apptShare) / 100),
    appts: Math.round((total * apptShare) / 100),
    apptShare,
  }
}

/* ---------- charts ---------- */

function BarChart({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <figure aria-label={label} className="w-full">
      <div className="flex h-40 items-end gap-[3px] sm:gap-1">
        {data.map((d) => (
          <div key={d.label} className="group relative flex h-full min-w-0 flex-1 flex-col justify-end">
            <span className="pointer-events-none absolute -top-7 left-1/2 z-10 hidden -translate-x-1/2 rounded-[4px] bg-qc-ink px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-qc-ivory group-hover:block">
              {d.label}: {d.value}
            </span>
            <div
              className={`w-full rounded-t-[3px] transition-[height] duration-500 ${
                d.future ? 'bg-qc-ink/[0.07]' : 'bg-qc-teal group-hover:bg-qc-ink'
              }`}
              style={{ height: `${Math.max(d.value ? 2 : 0, (d.value / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1">
        {data.map((d) => (
          <span key={d.label} className="min-w-0 flex-1 truncate text-center text-[10.5px] text-qc-muted tabular-nums">
            {d.short ?? d.label}
          </span>
        ))}
      </div>
    </figure>
  )
}

function LineChart({ points, labels, label }) {
  const W = 600
  const H = 160
  const values = points.filter((p) => p != null)
  const max = Math.max(30, ...values)
  const step = points.length > 1 ? W / (points.length - 1) : W
  const coords = points.map((p, i) => (p == null ? null : [i * step, H - (p / max) * H]))
  const segments = []
  let current = []
  coords.forEach((c) => {
    if (c) current.push(c)
    else if (current.length) {
      segments.push(current)
      current = []
    }
  })
  if (current.length) segments.push(current)
  const target = 15
  const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0

  return (
    <figure aria-label={label} className="w-full">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-40 w-full overflow-visible" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((f) => (
            <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--color-qc-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line
            x1="0"
            x2={W}
            y1={H - (target / max) * H}
            y2={H - (target / max) * H}
            stroke="var(--color-qc-coral)"
            strokeDasharray="5 4"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
          {segments.map((seg, i) => (
            <g key={i}>
              <path
                d={`M${seg[0][0]},${H} ${seg.map(([x, y]) => `L${x},${y}`).join(' ')} L${seg[seg.length - 1][0]},${H} Z`}
                fill="var(--color-qc-teal)"
                opacity="0.08"
              />
              <polyline
                points={seg.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="var(--color-qc-teal)"
                strokeWidth="2"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>
          ))}
        </svg>
        <span className="absolute right-0 rounded-[4px] bg-qc-surface px-1 text-[10.5px] font-semibold text-qc-coral" style={{ top: `calc(${100 - (target / max) * 100}% - 18px)` }}>
          Target {target} min
        </span>
      </div>
      <div className="mt-2 flex justify-between text-[10.5px] text-qc-muted tabular-nums">
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
      <p className="mt-3 text-[13px] text-qc-muted">
        Average <span className="font-semibold text-qc-ink">{avg} min</span> · {values.filter((v) => v > target).length} of{' '}
        {values.length} periods above target
      </p>
    </figure>
  )
}

function Donut({ walkIns, appts, apptShare }) {
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row lg:flex-col xl:flex-row">
      <div
        role="img"
        aria-label={`${100 - apptShare}% walk-ins, ${apptShare}% appointments`}
        className="relative size-36 shrink-0 rounded-full"
        style={{
          background: `conic-gradient(var(--color-qc-teal) 0 ${100 - apptShare}%, var(--color-qc-coral) ${100 - apptShare}% 100%)`,
        }}
      >
        <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-qc-surface">
          <span className="font-display text-2xl font-extrabold text-qc-ink tabular-nums">{100 - apptShare}%</span>
          <span className="text-[11px] text-qc-muted">walk-ins</span>
        </div>
      </div>
      <dl className="flex w-full flex-col gap-3 text-[13px]">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-[2px] bg-qc-teal" aria-hidden="true" />
          <dt className="flex-1 text-qc-text">Walk-ins</dt>
          <dd className="font-semibold text-qc-ink tabular-nums">{walkIns.toLocaleString('en-IN')}</dd>
        </div>
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-[2px] bg-qc-coral" aria-hidden="true" />
          <dt className="flex-1 text-qc-text">Appointments</dt>
          <dd className="font-semibold text-qc-ink tabular-nums">{appts.toLocaleString('en-IN')}</dd>
        </div>
      </dl>
    </div>
  )
}

const heatTones = ['bg-qc-teal/15', 'bg-qc-teal/35', 'bg-qc-teal/60', 'bg-qc-teal']

function Insight({ children }) {
  return (
    <p className="flex items-start gap-2 border-t border-qc-line px-5 py-3 text-[13px] leading-relaxed text-qc-text">
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-qc-coral" aria-hidden="true" />
      <span>
        <span className="sr-only">Insight: </span>
        {children}
      </span>
    </p>
  )
}

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const columns = [
  { key: 'name', label: 'Doctor' },
  { key: 'patients', label: 'Patients', numeric: true },
  { key: 'wait', label: 'Avg. wait', numeric: true, unit: 'min' },
  { key: 'consult', label: 'Avg. consult', numeric: true, unit: 'min' },
  { key: 'noShow', label: 'No-show', numeric: true, unit: '%' },
  { key: 'util', label: 'Utilisation', numeric: true, unit: '%' },
]

export default function AdminReports() {
  const { doctors } = useQueue()
  const [range, setRange] = useState('30d')
  const [doctor, setDoctor] = useState('all')
  const [sort, setSort] = useState({ key: 'patients', dir: 'desc' })

  const ids = doctor === 'all' ? doctors.map((d) => d.id) : [doctor]
  const report = useMemo(() => buildReport(range, ids), [range, ids.join()]) // eslint-disable-line react-hooks/exhaustive-deps
  const rangeLabel = RANGES[range].label

  const allTotal = useMemo(() => buildReport(range, doctors.map((d) => d.id)).kpis.total, [range, doctors])
  const rows = doctors.map((d) => ({
    id: d.id,
    name: d.name,
    initials: d.initials,
    dept: d.dept,
    patients: Math.round(allTotal * DOCTOR_BASE[d.id].share),
    wait: DOCTOR_BASE[d.id].wait,
    consult: d.avgConsult,
    noShow: DOCTOR_BASE[d.id].noShow,
    util: DOCTOR_BASE[d.id].util,
  }))
  const sortedRows = [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return typeof a[sort.key] === 'string' ? a[sort.key].localeCompare(b[sort.key]) * dir : (a[sort.key] - b[sort.key]) * dir
  })
  const slowest = rows.reduce((a, b) => (b.wait > a.wait ? b : a))

  const maxHeat = Math.max(1, ...report.heat.flat())

  const waitLabels =
    range === 'today'
      ? ['9a', '11a', '1p', '3p', '5p']
      : range === '30d'
        ? [report.volume[0].label, report.volume[14].label, report.volume[29].label]
        : ['Jul', 'Oct', 'Jan', 'Apr', 'Jun']

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' ? 'asc' : 'desc' }))
  }

  function exportReport() {
    downloadCsv(`lumen-clinic-report-${range}.csv`, [
      ['Period', 'Patients'],
      ...report.volume.map((v) => [v.label, v.value]),
      [],
      columns.map((c) => c.label),
      ...sortedRows.map((r) => columns.map((c) => r[c.key])),
    ])
  }

  const kpis = [
    { label: 'Patients seen', value: report.kpis.total.toLocaleString('en-IN'), note: '▲ 6%', noteText: `vs previous ${rangeLabel.toLowerCase()}`, good: true },
    { label: 'Avg. waiting time', value: report.kpis.avgWait, unit: 'min', note: '▼ 3 min', noteText: 'since Queue Cure', good: true },
    {
      label: 'Avg. consultation',
      value: Math.round(
        ids.reduce((n, id) => n + (doctors.find((d) => d.id === id)?.avgConsult ?? 10) * DOCTOR_BASE[id].share, 0) /
          ids.reduce((n, id) => n + DOCTOR_BASE[id].share, 0),
      ),
      unit: 'min',
      noteText: 'doctor time per patient',
    },
    { label: 'No-show rate', value: report.kpis.noShow, unit: '%', note: '▲ 0.4 pts', noteText: 'mostly appointments', good: false },
  ]

  return (
    <AdminPage wide>
      <AdminHeader
        eyebrow="Reports & analytics"
        title="Clinic performance"
        description="Patient volume, waiting times and consultation patterns. Use these to plan staffing and appointment slots."
        actions={
          <>
            <Segmented
              label="Reporting period"
              value={range}
              onChange={setRange}
              options={Object.entries(RANGES).map(([value, r]) => ({ value, label: r.label }))}
            />
            <div className="w-full sm:w-52">
              <Select aria-label="Doctor" value={doctor} onChange={(e) => setDoctor(e.target.value)}>
                <option value="all">All doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" onClick={exportReport}>
              <Download aria-hidden="true" />
              Export CSV
            </Button>
          </>
        }
      />

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-qc-line lg:grid-cols-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-qc-surface px-5 py-4">
              <p className="text-[12px] font-medium text-qc-muted">{k.label}</p>
              <p className="mt-1 flex items-baseline gap-1 font-display text-[26px] leading-none font-extrabold tracking-[-0.03em] text-qc-ink tabular-nums">
                {k.value}
                {k.unit && <span className="text-sm font-bold tracking-normal text-qc-muted">{k.unit}</span>}
              </p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-qc-muted">
                {k.note && <span className={`font-semibold ${k.good ? 'text-qc-teal' : 'qc-alert'}`}>{k.note}</span>}
                {k.noteText}
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Patient volume" subtitle={RANGES[range].unit} className="lg:col-span-2" bodyClassName="flex flex-col">
          <div className="flex-1 px-5 pt-8 pb-5">
            <BarChart data={report.volume} label={`${RANGES[range].unit}, ${rangeLabel.toLowerCase()}`} />
          </div>
        </Panel>

        <Panel title="Consultation length" subtitle="Share of consultations by duration" bodyClassName="flex flex-col">
          <ul className="flex flex-1 flex-col justify-center gap-3.5 px-5 py-6">
            {report.lengths.map((l) => (
              <li key={l.label}>
                <div className="flex justify-between text-[13px]">
                  <span className="text-qc-text">{l.label}</span>
                  <span className="font-semibold text-qc-ink tabular-nums">{l.pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-qc-ink/[0.07]">
                  <div className="h-full rounded-full bg-qc-teal transition-[width] duration-500" style={{ width: `${l.pct * 2}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Average waiting time" subtitle={RANGES[range].waitNote} className="lg:col-span-2" bodyClassName="flex flex-col">
          <div className="flex-1 px-5 pt-8 pb-5">
            <LineChart points={report.waitPoints} labels={waitLabels} label="Average waiting time in minutes" />
          </div>
        </Panel>

        <Panel title="Walk-ins vs appointments" subtitle="How patients arrive" bodyClassName="flex flex-col">
          <div className="flex flex-1 items-center px-5 py-6">
            <Donut walkIns={report.walkIns} appts={report.appts} apptShare={report.apptShare} />
          </div>
        </Panel>
      </div>

      <Panel
        title="Doctor-wise statistics"
        subtitle={`${rangeLabel} · click a column to sort`}
        actions={
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadCsv(`doctor-stats-${range}.csv`, [
                columns.map((c) => c.label),
                ...sortedRows.map((r) => columns.map((c) => r[c.key])),
              ])
            }
          >
            <Download aria-hidden="true" />
            CSV
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-qc-line bg-qc-ivory/50">
                {columns.map((c) => {
                  const active = sort.key === c.key
                  const SortIcon = active ? (sort.dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown
                  return (
                    <th
                      key={c.key}
                      scope="col"
                      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                      className={`px-5 py-2.5 ${c.numeric ? 'text-right' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className={`inline-flex items-center gap-1 text-[11.5px] font-semibold tracking-[0.04em] uppercase outline-none focus-visible:ring-2 focus-visible:ring-qc-coral [&_svg]:size-3 ${
                          active ? 'text-qc-ink' : 'text-qc-muted hover:text-qc-text'
                        }`}
                      >
                        {c.label}
                        <SortIcon aria-hidden="true" />
                      </button>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-qc-line">
              {sortedRows.map((r) => (
                <tr key={r.id} className={doctor !== 'all' && doctor !== r.id ? 'opacity-50' : ''}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={r.initials} size="sm" tone="teal" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-qc-ink">{r.name}</p>
                        <p className="truncate text-xs text-qc-muted">{r.dept}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-qc-ink tabular-nums">{r.patients.toLocaleString('en-IN')}</td>
                  <td className={`px-5 py-3 text-right tabular-nums ${r.wait >= 20 ? 'font-semibold qc-attn' : 'text-qc-text'}`}>{r.wait} min</td>
                  <td className="px-5 py-3 text-right text-qc-text tabular-nums">{r.consult} min</td>
                  <td className="px-5 py-3 text-right text-qc-text tabular-nums">{r.noShow}%</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-qc-ink/[0.07]">
                        <div className="h-full rounded-full bg-qc-teal" style={{ width: `${r.util}%` }} />
                      </div>
                      <span className="w-9 text-right text-qc-text tabular-nums">{r.util}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Insight>
          {slowest.name} has the longest waits ({slowest.wait} min) — longer cardiology consults suggest fewer slots per hour.
        </Insight>
      </Panel>

      <Panel title="Peak hours" subtitle="Average check-ins per hour, by weekday · last 30 days">
        <div className="overflow-x-auto px-5 py-4">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-[11.5px]">
            <thead>
              <tr>
                <th scope="col" className="w-10">
                  <span className="sr-only">Day</span>
                </th>
                {HOUR_LABELS.map((h) => (
                  <th key={h} scope="col" className="font-medium text-qc-muted tabular-nums">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEEKDAYS.map((day, d) => (
                <tr key={day}>
                  <th scope="row" className="pr-2 text-left font-medium text-qc-muted">
                    {day}
                  </th>
                  {report.heat[d].map((v, h) => {
                    const tone = heatTones[Math.min(3, Math.floor((v / maxHeat) * 4))]
                    return (
                      <td key={h} className="p-0">
                        <div
                          title={`${day} ${HOUR_LABELS[h]}: ${v} check-ins`}
                          className={`flex h-8 items-center justify-center rounded-[4px] font-semibold tabular-nums ${tone} ${
                            tone === 'bg-qc-teal' || tone === 'bg-qc-teal/60' ? 'text-qc-ivory' : 'text-qc-ink/70'
                          }`}
                        >
                          {v}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex items-center justify-end gap-2 text-[11.5px] text-qc-muted" aria-hidden="true">
            <span>Quiet</span>
            {heatTones.map((t) => (
              <span key={t} className={`size-3.5 rounded-[3px] ${t}`} />
            ))}
            <span>Peak</span>
          </div>
        </div>
        <Insight>
          Monday and Friday late mornings (10 AM – 12 PM) are the busiest — add a second receptionist and avoid booking
          appointments then.
        </Insight>
      </Panel>
    </AdminPage>
  )
}
