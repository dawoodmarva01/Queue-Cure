import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChartColumn,
  Clock,
  MessageSquare,
  Monitor,
  Siren,
  Smartphone,
  Stethoscope,
  Ticket,
  Users,
} from 'lucide-react'
import { Eyebrow, Flag, SectionTitle, SmartLink, StatusPill, TokenChip } from './ui.jsx'

const roles = [
  {
    href: '/admin',
    Icon: Building2,
    role: 'Admin',
    title: 'Configure once, see everything',
    body: 'Departments, doctors, hours and token rules in one place. Daily throughput and wait-time reports without spreadsheets.',
    cta: 'Open admin demo',
  },
  {
    href: '/reception',
    Icon: Users,
    role: 'Reception',
    title: 'Register in under 20 seconds',
    body: 'Search returning patients, issue a token, flag priority cases and reshuffle lines without raising a voice.',
    cta: 'Open reception demo',
  },
  {
    href: '/doctor',
    Icon: Stethoscope,
    role: 'Doctor',
    title: 'One button: call next',
    body: 'See who is waiting, why they came and how long they have waited. Skip, recall or mark done from the consult room.',
    cta: 'Open doctor demo',
  },
  {
    href: '/track/GM-016',
    Icon: Smartphone,
    role: 'Patient',
    title: 'Wait anywhere, not in the lobby',
    body: 'A live link by SMS shows their position and estimated time. No app to download, nothing to log in to.',
    cta: 'Track token GM-016',
  },
]

export function ForClinics() {
  return (
    <section
      id="for-clinics"
      className="mx-auto max-w-7xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-28"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div>
          <Eyebrow>For clinics</Eyebrow>
          <SectionTitle className="text-qc-ink sm:text-5xl">Four roles, one queue.</SectionTitle>
          <p className="mt-5 max-w-md text-base leading-relaxed text-qc-muted">
            Everyone sees the same line in real time, from their own angle. When reception issues a
            token, the doctor sees it, the lobby screen shows it and the patient gets a text — in
            the same second.
          </p>
        </div>
        <ul className="divide-y divide-qc-line rounded-qc border border-qc-line bg-qc-surface">
          {roles.map(({ href, Icon, role, title, body, cta }) => (
            <li key={role}>
              <SmartLink
                href={href}
                className="group grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 p-5 outline-none hover:bg-qc-ivory/60 focus-visible:ring-2 focus-visible:ring-qc-coral focus-visible:ring-inset sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-qc bg-qc-teal/10 text-qc-teal">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-[0.08em] text-qc-muted uppercase">
                    {role}
                  </p>
                  <p className="mt-0.5 font-display text-lg font-bold tracking-tight text-qc-ink">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-qc-muted">{body}</p>
                </div>
                <span className="col-start-2 inline-flex items-center gap-1 text-sm font-semibold text-qc-teal sm:col-start-3">
                  {cta}
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </span>
              </SmartLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const steps = [
  { Icon: Users, title: 'Register', body: 'Reception adds the patient — or they scan the desk QR and check in themselves.' },
  { Icon: Ticket, title: 'Token issued', body: 'A token like GM-016 is assigned to the right doctor, with priority if needed.' },
  { Icon: Smartphone, title: 'Live tracking', body: 'An SMS link shows position and estimated wait, updating every few seconds.' },
  { Icon: Stethoscope, title: 'Consult', body: "The doctor calls next; the lobby display and the patient's phone update together." },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-y border-qc-line bg-qc-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <SectionTitle className="max-w-xl text-qc-ink sm:text-5xl">
              From the front door to the consult room.
            </SectionTitle>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-qc-muted">
            The average patient journey at a Queue Cure clinic involves zero announcements and one
            glance at a phone.
          </p>
        </div>
        <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
          <span
            aria-hidden="true"
            className="absolute top-5 right-[12%] left-[12%] hidden h-px bg-qc-line md:block"
          />
          {steps.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-4 md:flex-col md:gap-0">
              <span className="relative z-[1] flex size-10 shrink-0 items-center justify-center rounded-full border border-qc-line bg-qc-ivory font-display text-sm font-extrabold text-qc-ink tabular-nums md:mx-auto">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="md:mt-6 md:text-center">
                <p className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-qc-ink md:justify-center">
                  <Icon className="size-4 text-qc-teal" aria-hidden="true" />
                  {title}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-qc-muted md:mx-auto md:max-w-[15rem]">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const resequenced = [
  { prefix: 'EM', number: '001', tone: 'dark', label: 'Walk-in · chest pain', flag: 'emergency', status: 'called' },
  { prefix: 'GM', number: '015', tone: 'light', label: 'Fever, 3 days · est. 9 min', flag: null, status: 'waiting' },
  { prefix: 'GM', number: '016', tone: 'light', label: 'Senior citizen · est. 18 min', flag: 'priority', status: 'waiting' },
]

const smallFeatures = [
  { Icon: Monitor, title: 'Lobby display on any TV', body: 'Open a URL on a smart TV or a ₹3,000 stick. Done.' },
  { Icon: CalendarDays, title: 'Appointments + walk-ins', body: 'Booked slots interleave fairly with walk-ins, per doctor.' },
  { Icon: ChartColumn, title: 'Reports that matter', body: 'Peak hours, no-shows and wait times by doctor, every evening.' },
]

export function Features() {
  return (
    <section aria-labelledby="features-title" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
      <Eyebrow>Product</Eyebrow>
      <SectionTitle id="features-title" className="max-w-3xl text-qc-ink sm:text-5xl">
        Built for the messy reality of a Monday morning OPD.
      </SectionTitle>
      <div className="mt-14 grid gap-px overflow-hidden rounded-qc border border-qc-line bg-qc-line lg:grid-cols-12">
        <article className="bg-qc-surface p-7 sm:p-10 lg:col-span-7 lg:row-span-2">
          <Siren className="size-5 text-qc-coral" aria-hidden="true" />
          <h3 className="mt-4 font-display text-2xl font-extrabold tracking-tight text-qc-ink sm:text-3xl">
            Emergencies jump the line — without breaking it.
          </h3>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-qc-muted">
            Flag a patient as priority or emergency and Queue Cure re-sequences the line,
            recalculates every estimate and quietly tells the people affected. No shouting across
            the lobby.
          </p>
          <ol aria-label="Example: re-sequenced line" className="mt-8 max-w-md space-y-2 p-0">
            {resequenced.map((row) => (
              <li
                key={row.prefix + row.number}
                className="flex items-center gap-3 rounded-qc-sm border border-qc-line bg-qc-ivory/50 px-3 py-2.5"
              >
                <TokenChip prefix={row.prefix} number={row.number} tone={row.tone} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm text-qc-text">{row.label}</span>
                {row.flag && <Flag type={row.flag} />}
                <StatusPill status={row.status} />
              </li>
            ))}
          </ol>
        </article>
        <article className="bg-qc-surface p-7 sm:p-8 lg:col-span-5">
          <Clock className="size-5 text-qc-teal" aria-hidden="true" />
          <h3 className="mt-4 font-display text-xl font-bold tracking-tight text-qc-ink">
            Estimates that learn
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-qc-muted">
            Wait times use each doctor's real consult pace by hour of day — not a fixed 10 minutes
            per patient.
          </p>
        </article>
        <article className="bg-qc-ink p-7 text-qc-ivory sm:p-8 lg:col-span-5">
          <MessageSquare className="size-5 text-qc-sage" aria-hidden="true" />
          <h3 className="mt-4 font-display text-xl font-bold tracking-tight">
            SMS &amp; WhatsApp nudges
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-qc-ivory/70">
            “You're 3rd in line for Dr. Rao — about 20 minutes.” Patients step out for chai and
            come back on time.
          </p>
        </article>
        {smallFeatures.map(({ Icon, title, body }) => (
          <article key={title} className="bg-qc-surface p-7 sm:p-8 lg:col-span-4">
            <Icon className="size-5 text-qc-teal" aria-hidden="true" />
            <h3 className="mt-4 font-display text-lg font-bold tracking-tight text-qc-ink">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-qc-muted">{body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
