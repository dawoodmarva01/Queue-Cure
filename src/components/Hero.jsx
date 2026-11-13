import { ArrowRight, Bell, Check, Ticket } from 'lucide-react'
import { ButtonLink, StatusPill, TokenChip } from './ui.jsx'

const nowServing = [
  { room: '104', doctor: 'Dr. Ananya Rao', dept: 'General Medicine', next: 'GM-015, GM-016', prefix: 'GM', number: '014', tone: 'coral' },
  { room: '201', doctor: 'Dr. Vikram Mehta', dept: 'Cardiology', next: 'CA-006', prefix: 'CA', number: '005', tone: 'light' },
  { room: '108', doctor: 'Dr. Sarah Thomas', dept: 'Pediatrics', next: 'PE-009, PE-010', prefix: 'PE', number: '008', tone: 'light' },
]

const perks = ['No hardware to buy', 'Set up in an afternoon', 'Works on any screen']

export function Hero() {
  return (
    <section
      id="product"
      className="mx-auto grid max-w-7xl scroll-mt-20 items-center gap-14 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28"
    >
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-qc-line bg-qc-surface px-3 py-1 text-xs font-semibold text-qc-teal">
          <Ticket className="size-3.5" aria-hidden="true" /> Queue management for outpatient clinics
        </p>
        <h1 className="mt-6 font-display text-[44px] leading-[1.02] font-extrabold tracking-[-0.04em] text-qc-ink sm:text-6xl lg:text-[68px]">
          The waiting room, finally under control.
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-qc-text/80">
          Queue Cure issues digital tokens at the front desk, keeps every doctor's line in order,
          and lets patients track their turn from their phone — so your lobby stays calm and your
          doctors stay on time.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <ButtonLink variant="primary" href="/register">
            Start 14-day free trial <ArrowRight aria-hidden="true" />
          </ButtonLink>
          <ButtonLink variant="secondary" href="/reception">
            See the live demo
          </ButtonLink>
        </div>
        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-qc-muted">
          {perks.map((perk) => (
            <li key={perk} className="flex items-center gap-1.5">
              <Check className="size-4 text-qc-teal" aria-hidden="true" /> {perk}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative pb-16 sm:pb-10 lg:pb-0">
        <figure
          aria-label="Example of the Queue Cure waiting-room display"
          className="m-0 rounded-[14px] bg-qc-ink p-5 text-qc-ivory sm:p-7 lg:mr-16"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.12em] text-qc-sage uppercase">
                Now serving
              </p>
              <p className="mt-1 font-display text-lg font-extrabold tracking-tight">
                Lumen Clinic · Indiranagar
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-qc-ivory/15 px-3 py-1 text-xs font-semibold text-qc-ivory/80">
              <span className="size-2 animate-qc-pulse rounded-full bg-qc-sage" aria-hidden="true" />
              Live
            </span>
          </div>
          <ul className="mt-6 divide-y divide-qc-ivory/10 border-t border-qc-ivory/10">
            {nowServing.map((row) => (
              <li
                key={row.room}
                className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 py-4 sm:grid-cols-[3.5rem_1fr_auto]"
              >
                <div className="text-center">
                  <p className="text-[10px] font-semibold tracking-wider text-qc-ivory/50 uppercase">
                    Room
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums">{row.room}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{row.doctor}</p>
                  <p className="truncate text-xs text-qc-ivory/55">
                    {row.dept} · next {row.next}
                  </p>
                </div>
                <TokenChip
                  prefix={row.prefix}
                  number={row.number}
                  tone={row.tone}
                  className="col-span-2 justify-self-start sm:col-span-1 sm:justify-self-end"
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center gap-2 text-xs text-qc-ivory/55">
            <Bell className="size-3.5" aria-hidden="true" /> GM-016, please be ready — you are next
            after GM-015.
          </p>
        </figure>

        <figure
          aria-label="Example of the patient's live token tracker on a phone"
          className="absolute right-0 -bottom-2 m-0 w-[min(15.5rem,72%)] rounded-[22px] border border-qc-line bg-qc-surface p-2 shadow-qc-pop sm:-bottom-6 lg:top-24 lg:bottom-auto"
        >
          <div className="rounded-[16px] bg-qc-ivory p-4">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-qc-line" aria-hidden="true" />
            <p className="text-[11px] font-medium text-qc-muted">Your token</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <TokenChip prefix="GM" number="016" tone="dark" />
              <StatusPill status="waiting" />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-[11px] text-qc-muted">Ahead of you</dt>
                <dd className="m-0 font-display text-2xl font-extrabold text-qc-ink tabular-nums">2</dd>
              </div>
              <div>
                <dt className="text-[11px] text-qc-muted">Est. wait</dt>
                <dd className="m-0 font-display text-2xl font-extrabold text-qc-ink tabular-nums">
                  ~14<span className="text-sm font-bold text-qc-muted"> min</span>
                </dd>
              </div>
            </dl>
            <div className="mt-3">
              <div
                role="meter"
                aria-label="Queue progress"
                aria-valuenow={78}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-1.5 w-full overflow-hidden rounded-full bg-qc-ink/[0.07]"
              >
                <div className="h-full w-[78%] rounded-full bg-qc-teal" />
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-snug text-qc-muted">
              We'll text you when 2 patients are ahead. Room 104, ground floor.
            </p>
          </div>
        </figure>
      </div>
    </section>
  )
}

const clinics = [
  'Lumen Clinic',
  'Sanjeevani Health',
  'Arogya Family Care',
  'CityKids Pediatrics',
  'Nova Heart Centre',
  'Meridian ENT',
]

const stats = [
  { value: '38%', label: 'shorter perceived waits', note: 'Patient survey, 41 clinics, 2024' },
  { value: '2.4×', label: 'fewer “how long?” questions at the desk', note: 'Average across reception teams' },
  { value: '11 min', label: 'saved per doctor, per session', note: 'Fewer idle gaps between consults' },
]

export function TrustedBy() {
  return (
    <section aria-label="Trusted by clinics" className="border-y border-qc-line bg-qc-surface">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <p className="text-center text-xs font-semibold tracking-[0.1em] text-qc-muted uppercase">
          Running the front desk at 240+ clinics across India
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {clinics.map((name) => (
            <li
              key={name}
              className="font-display text-lg font-extrabold tracking-[-0.03em] text-qc-ink/45"
            >
              {name}
            </li>
          ))}
        </ul>
        <dl className="mt-10 grid gap-8 border-t border-qc-line pt-10 sm:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.value}
              className="sm:border-l sm:border-qc-line sm:pl-6 sm:first:border-l-0 sm:first:pl-0"
            >
              <dt className="sr-only">{stat.label}</dt>
              <dd className="m-0">
                <p className="font-display text-4xl font-extrabold tracking-[-0.04em] text-qc-ink tabular-nums">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-medium text-qc-text">{stat.label}</p>
                <p className="mt-1 text-xs text-qc-muted">{stat.note}</p>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
