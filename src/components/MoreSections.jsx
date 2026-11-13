import { ArrowRight, Building2, Check, Clock, Layers, Plus, ShieldCheck, Users, Zap } from 'lucide-react'
import { ButtonLink, Eyebrow, SectionTitle } from './ui.jsx'

const setupSteps = [
  { Icon: Building2, title: 'Create your clinic', body: 'Name, address and timezone.', time: '2 min' },
  { Icon: Layers, title: 'Add departments & doctors', body: 'Rooms, token prefixes and average consult time.', time: '10 min' },
  { Icon: Users, title: 'Invite your team', body: 'Reception and doctors get their own sign-in.', time: '3 min' },
  { Icon: Clock, title: 'Set hours & queue rules', body: 'Walk-ins, daily limits, SMS alerts, emergency override.', time: '5 min' },
  { Icon: Zap, title: 'Go live', body: 'Open the reception desk and the lobby display.', time: '1 min' },
]

export function Onboarding() {
  return (
    <section aria-labelledby="onboarding-title" className="border-t border-qc-line">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.2fr] lg:gap-16 lg:py-28">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Eyebrow>Onboarding</Eyebrow>
          <SectionTitle id="onboarding-title" className="text-qc-ink sm:text-5xl">
            Live in an afternoon.
          </SectionTitle>
          <p className="mt-5 max-w-md text-base leading-relaxed text-qc-muted">
            No installers, no on-site visit. A guided setup walks you through everything; most
            clinics issue their first token the same day they sign up.
          </p>
          <ButtonLink variant="dark" href="/onboarding" className="mt-8">
            Walk through setup <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>
        <ol className="rounded-qc border border-qc-line bg-qc-surface p-0">
          {setupSteps.map(({ Icon, title, body, time }, i) => (
            <li
              key={title}
              className="flex items-start gap-4 border-b border-qc-line p-5 last:border-b-0 sm:p-6"
            >
              <span className="font-display text-sm font-extrabold text-qc-muted tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <Icon className="mt-0.5 size-5 shrink-0 text-qc-teal" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-qc-ink">{title}</p>
                <p className="mt-0.5 text-sm text-qc-muted">{body}</p>
              </div>
              <span className="shrink-0 rounded-full bg-qc-ivory px-2.5 py-1 text-xs font-semibold text-qc-text tabular-nums">
                {time}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const plans = [
  {
    name: 'Clinic',
    blurb: 'Single-doctor and family practices',
    price: '₹2,499',
    period: '/ month',
    features: ['Up to 3 doctors', 'Unlimited tokens', 'Patient live tracking', 'Lobby display', '500 SMS / month'],
    cta: { label: 'Start free trial', href: '/register' },
    featured: false,
  },
  {
    name: 'Multi-specialty',
    blurb: 'Clinics with several departments',
    price: '₹6,999',
    period: '/ month',
    features: ['Up to 15 doctors', 'Everything in Clinic', 'Priority & emergency rules', 'Appointments + walk-ins', '2,500 SMS / month', 'Daily reports'],
    cta: { label: 'Start free trial', href: '/register' },
    featured: true,
  },
  {
    name: 'Hospital',
    blurb: 'OPDs, multiple branches',
    price: 'Custom',
    period: null,
    features: ['Unlimited doctors & branches', 'Everything in Multi-specialty', 'HIS / EMR integration', 'SSO & audit logs', 'Dedicated success manager'],
    cta: { label: 'Talk to sales', href: 'mailto:sales@queuecure.in' },
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 border-y border-qc-line bg-qc-surface">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <div className="max-w-2xl">
          <Eyebrow>Pricing</Eyebrow>
          <SectionTitle className="text-qc-ink sm:text-5xl">Priced per clinic, not per patient.</SectionTitle>
          <p className="mt-4 text-base text-qc-muted">
            All plans include a 14-day free trial. Prices exclude GST, billed monthly.
          </p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`flex flex-col rounded-qc border p-7 ${
                plan.featured
                  ? 'border-qc-ink bg-qc-ink text-qc-ivory'
                  : 'border-qc-line bg-qc-ivory/40'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-extrabold tracking-tight">{plan.name}</h3>
                {plan.featured && (
                  <span className="rounded-full bg-qc-coral px-2.5 py-0.5 text-[11px] font-bold text-qc-ink">
                    Most popular
                  </span>
                )}
              </div>
              <p className={`mt-1 text-sm ${plan.featured ? 'text-qc-ivory/65' : 'text-qc-muted'}`}>
                {plan.blurb}
              </p>
              <p className="mt-6 font-display text-4xl font-extrabold tracking-[-0.04em] tabular-nums">
                {plan.price}
                {plan.period && (
                  <span
                    className={`ml-1 text-sm font-semibold tracking-normal ${
                      plan.featured ? 'text-qc-ivory/60' : 'text-qc-muted'
                    }`}
                  >
                    {plan.period}
                  </span>
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5 p-0">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className={`mt-0.5 size-4 shrink-0 ${plan.featured ? 'text-qc-sage' : 'text-qc-teal'}`}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
              <ButtonLink
                variant={plan.featured ? 'primary' : 'secondary'}
                href={plan.cta.href}
                className="mt-8 w-full"
              >
                {plan.cta.label}
              </ButtonLink>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

const faqs = [
  {
    q: 'Do patients need to install an app?',
    a: 'No. Patients get a link by SMS (or scan a QR at the desk) that opens a live tracking page in any phone browser.',
  },
  {
    q: 'What hardware do we need?',
    a: 'Any computer or tablet for reception and doctors, and optionally a TV for the lobby display. There is nothing to install.',
  },
  {
    q: 'Can we mix appointments and walk-ins?',
    a: 'Yes. Booked appointments are slotted in fairly alongside walk-ins for each doctor, and you can set limits per day.',
  },
  {
    q: 'What happens if the internet drops?',
    a: 'Reception and doctor screens keep working offline and sync changes the moment the connection returns.',
  },
  {
    q: 'Is patient data secure?',
    a: 'Data is encrypted in transit and at rest, stored in India, and each role only sees what it needs. We never sell or share patient data.',
  },
]

export function Faq() {
  return (
    <section
      aria-labelledby="faq-title"
      className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_1.6fr] lg:py-28"
    >
      <div>
        <Eyebrow>FAQ</Eyebrow>
        <SectionTitle id="faq-title" className="text-qc-ink">
          Questions clinics ask us.
        </SectionTitle>
        <p className="mt-4 text-sm text-qc-muted">
          Something else? Write to{' '}
          <a
            className="font-semibold text-qc-teal underline-offset-4 hover:underline"
            href="mailto:hello@queuecure.in"
          >
            hello@queuecure.in
          </a>
          .
        </p>
      </div>
      <div className="border-t border-qc-line">
        {faqs.map((faq) => (
          <details key={faq.q} className="group border-b border-qc-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-qc-sm py-5 font-display text-[17px] font-bold tracking-tight text-qc-ink outline-none focus-visible:ring-2 focus-visible:ring-qc-coral [&::-webkit-details-marker]:hidden">
              {faq.q}
              <Plus
                className="size-5 shrink-0 text-qc-muted transition-transform group-open:rotate-45"
                aria-hidden="true"
              />
            </summary>
            <p className="max-w-2xl pb-5 text-[15px] leading-relaxed text-qc-muted">{faq.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

export function FinalCta() {
  return (
    <section aria-label="Get started" className="bg-qc-ink text-qc-ivory">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-5 py-16 sm:px-8 lg:flex-row lg:items-center lg:py-20">
        <div>
          <h2 className="max-w-2xl font-display text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] sm:text-5xl">
            Give tomorrow's OPD a calmer start.
          </h2>
          <p className="mt-4 flex items-center gap-2 text-sm text-qc-ivory/65">
            <ShieldCheck className="size-4 text-qc-sage" aria-hidden="true" /> 14 days free · no
            card required · cancel anytime
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink variant="primary" href="/register">
            Start free trial <ArrowRight aria-hidden="true" />
          </ButtonLink>
          <ButtonLink variant="light" href="/login">
            Sign in
          </ButtonLink>
        </div>
      </div>
    </section>
  )
}
