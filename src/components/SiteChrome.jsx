import { useState } from 'react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { ButtonLink, Logo, SmartLink, buttonClass } from './ui.jsx'

const navLinks = [
  { href: '#product', label: 'Product' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#for-clinics', label: 'For clinics' },
  { href: '#pricing', label: 'Pricing' },
]

export function SiteHeader() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-qc-line bg-qc-ivory/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Logo />
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-qc-sm px-3 py-2 text-sm font-medium text-qc-text/80 outline-none hover:text-qc-ink focus-visible:ring-2 focus-visible:ring-qc-coral"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <ButtonLink variant="ghost" size="sm" href="/login">
            Sign in
          </ButtonLink>
          <ButtonLink variant="primary" size="sm" href="/register">
            Start free trial <ArrowRight aria-hidden="true" />
          </ButtonLink>
        </div>
        <button
          type="button"
          className={buttonClass({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-qc-line px-5 pt-3 pb-5 sm:px-8 md:hidden"
        >
          <ul className="flex flex-col">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-qc-sm px-2 py-2.5 text-[15px] font-medium text-qc-text"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <ButtonLink variant="secondary" size="lg" href="/login" className="flex-1">
              Sign in
            </ButtonLink>
            <ButtonLink variant="primary" size="lg" href="/register" className="flex-1">
              Start free trial
            </ButtonLink>
          </div>
        </nav>
      )}
    </header>
  )
}

const footerColumns = [
  {
    title: 'Product',
    links: [
      { href: '/reception', label: 'Reception desk' },
      { href: '/doctor', label: 'Doctor console' },
      { href: '/admin', label: 'Admin' },
      { href: '/track/GM-016', label: 'Patient tracking' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#pricing', label: 'Pricing' },
      { href: '#how-it-works', label: 'How it works' },
      { href: 'mailto:hello@queuecure.in', label: 'Contact' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/login', label: 'Sign in' },
      { href: '/register', label: 'Create account' },
      { href: '/onboarding', label: 'Clinic setup' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer className="bg-qc-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-qc-muted">
            Calm, clear clinic queues. Made in Bengaluru for clinics everywhere.
          </p>
        </div>
        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-xs font-semibold tracking-[0.08em] text-qc-muted uppercase">
              {col.title}
            </p>
            <ul className="mt-3 space-y-2">
              {col.links.map((link) => (
                <li key={link.label}>
                  <SmartLink className="text-sm text-qc-text hover:text-qc-teal" href={link.href}>
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-qc-line">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-qc-muted sm:px-8">
          © {new Date().getFullYear()} Queue Cure Health Technologies Pvt. Ltd.
        </p>
      </div>
    </footer>
  )
}
