import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, X } from 'lucide-react'
import { Button, Field, Input, Logo, Segmented, SmartLink, TokenChip, buttonClass } from '../../components/ui.jsx'

/* ---------- shared layout ---------- */

function AuthAside() {
  return (
    <aside
      aria-label="About Queue Cure"
      className="hidden flex-col justify-between bg-qc-ink p-12 text-qc-ivory lg:flex xl:p-16"
    >
      <div aria-hidden="true" className="max-w-sm">
        <p className="text-[11px] font-semibold tracking-[0.12em] text-qc-sage uppercase">
          Room 104 · now serving
        </p>
        <div className="mt-3 flex items-center gap-3">
          <TokenChip prefix="GM" number="014" tone="coral" />
          <span className="flex items-center gap-1.5 text-xs text-qc-ivory/60">
            <span className="size-2 animate-qc-pulse rounded-full bg-qc-sage" />
            Live
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <TokenChip prefix="GM" number="015" size="sm" className="opacity-90" />
          <TokenChip prefix="GM" number="016" size="sm" className="opacity-90" />
          <TokenChip prefix="GM" number="017" size="sm" className="opacity-50" />
          <TokenChip prefix="GM" number="018" size="sm" className="opacity-50" />
        </div>
      </div>
      <figure className="m-0 max-w-md">
        <blockquote className="m-0 font-display text-[26px] leading-[1.25] font-bold tracking-[-0.02em]">
          “Our lobby used to be a crowd around the desk. Now people sit, check their phone, and walk
          in when it's their turn.”
        </blockquote>
        <figcaption className="mt-6 text-sm">
          <span className="font-semibold">Dr. Ananya Rao</span>
          <span className="text-qc-ivory/60"> · Medical Director, Lumen Clinic</span>
        </figcaption>
      </figure>
    </aside>
  )
}

function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="qc-root grid min-h-screen lg:grid-cols-[1fr_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Logo />
          <SmartLink href="/" className="text-sm font-medium text-qc-muted hover:text-qc-ink">
            Back to site
          </SmartLink>
        </div>
        <main className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-12">
          <h1 className="font-display text-3xl font-extrabold tracking-[-0.03em] text-qc-ink sm:text-[34px]">
            {title}
          </h1>
          <p className="mt-2 text-[15px] text-qc-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-qc-muted">{footer}</div>}
        </main>
        <p className="text-xs text-qc-muted">© Queue Cure · Patient data is encrypted and stored in India.</p>
      </div>
      <AuthAside />
    </div>
  )
}

const linkClass = 'font-semibold text-qc-teal underline-offset-4 hover:underline'

function IconInput({ icon: Icon, className = '', ...props }) {
  return (
    <div className="relative flex items-center">
      <span className="pointer-events-none absolute left-3 flex text-qc-muted [&_svg]:size-4">
        <Icon aria-hidden="true" />
      </span>
      <Input className={`h-12 pl-9 text-[15px] ${className}`} {...props} />
    </div>
  )
}

function PasswordInput({ id, icon, large = false, autoComplete, value, onChange, invalid }) {
  const [show, setShow] = useState(false)
  const input = {
    id,
    type: show ? 'text' : 'password',
    autoComplete,
    value,
    onChange,
    'aria-invalid': invalid || undefined,
  }
  return (
    <div className="relative flex items-center">
      {icon ? (
        <div className="w-full">
          <IconInput icon={icon} className="pr-16" {...input} />
        </div>
      ) : (
        <Input className={`pr-16 ${large ? 'h-12 text-[15px]' : ''}`} {...input} />
      )}
      <span className="absolute right-2 flex items-center">
        <button
          type="button"
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
          onClick={() => setShow((v) => !v)}
          className={buttonClass({ variant: 'ghost', size: 'xs' })}
        >
          {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
    </div>
  )
}

function Checkbox({ id, checked, onChange, children }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-2.5 text-sm text-qc-text">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded-[4px] border-qc-line accent-qc-teal"
      />
      <span>{children}</span>
    </label>
  )
}

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/* ---------- Login ---------- */

const roleHome = { admin: '/admin', reception: '/reception', doctor: '/doctor' }

export function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('reception')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!emailOk(email)) next.email = 'Enter a valid work email.'
    if (!password) next.password = 'Enter your password.'
    else if (password === 'wrong') next.form = "That email and password don't match. Try again or reset your password."
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    setTimeout(() => navigate(roleHome[role]), 500)
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to open your clinic's queue."
      footer={
        <>
          New to Queue Cure?{' '}
          <SmartLink className={linkClass} href="/register">
            Create a clinic account
          </SmartLink>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-5">
        {errors.form && (
          <p role="alert" className="rounded-qc border border-qc-skipped/40 bg-qc-skipped/10 px-4 py-3 text-sm qc-alert">
            {errors.form}
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          <span id="role-label" className="text-[13px] font-medium text-qc-text">
            Sign in as <span className="font-normal text-qc-muted">(demo role picker)</span>
          </span>
          <Segmented
            label="Demo role"
            className="w-full"
            value={role}
            onChange={setRole}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'reception', label: 'Reception' },
              { value: 'doctor', label: 'Doctor' },
            ]}
          />
        </div>
        <Field label="Work email" htmlFor="email" error={errors.email}>
          <IconInput
            icon={Mail}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@clinic.in"
            value={email}
            aria-invalid={errors.email ? true : undefined}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          error={errors.password}
          hint="Tip: type “wrong” to preview the error state."
        >
          <PasswordInput
            id="password"
            icon={Lock}
            autoComplete="current-password"
            value={password}
            invalid={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <div className="flex items-center justify-between gap-4">
          <Checkbox id="remember" checked={remember} onChange={setRemember}>
            Remember this workstation
          </Checkbox>
          <SmartLink className={`shrink-0 text-sm ${linkClass}`} href="/forgot-password">
            Forgot password?
          </SmartLink>
        </div>
        <Button type="submit" variant="dark" size="lg" className="mt-1 w-full" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </AuthLayout>
  )
}

/* ---------- Register ---------- */

const passwordRules = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'Upper and lower case letters', test: (p) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'At least one number', test: (p) => /\d/.test(p) },
  { label: 'At least one symbol', test: (p) => /[^A-Za-z0-9]/.test(p) },
]
const strengthLabels = ['—', 'Weak', 'Fair', 'Good', 'Strong']
const strengthTones = ['bg-qc-coral', 'bg-qc-coral', 'bg-qc-amber', 'bg-qc-sage', 'bg-qc-teal']

export function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', clinic: '', password: '' })
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const met = passwordRules.map((r) => r.test(form.password))
  const score = met.filter(Boolean).length

  function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your full name.'
    if (form.phone.replace(/\D/g, '').length < 10) next.phone = 'Enter a 10-digit mobile number.'
    if (!emailOk(form.email)) next.email = 'Enter a valid work email.'
    if (!form.clinic.trim()) next.clinic = 'Enter your clinic name.'
    if (score < 3) next.password = 'Choose a stronger password.'
    if (!agree) next.agree = 'Please accept the terms to continue.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    setTimeout(() => navigate('/onboarding'), 500)
  }

  return (
    <AuthLayout
      title="Start your free trial"
      subtitle="14 days, every feature, no card required."
      footer={
        <>
          Already have an account?{' '}
          <SmartLink className={linkClass} href="/login">
            Sign in
          </SmartLink>
        </>
      }
    >
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={errors.name}>
            <Input id="name" autoComplete="name" placeholder="Nandini Rao" value={form.name} onChange={set('name')} aria-invalid={errors.name ? true : undefined} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <Input id="phone" type="tel" autoComplete="tel" placeholder="+91 98450 12345" value={form.phone} onChange={set('phone')} aria-invalid={errors.phone ? true : undefined} />
          </Field>
        </div>
        <Field label="Work email" htmlFor="email" error={errors.email}>
          <Input id="email" type="email" autoComplete="email" placeholder="you@clinic.in" value={form.email} onChange={set('email')} aria-invalid={errors.email ? true : undefined} />
        </Field>
        <Field label="Clinic name" htmlFor="clinic" error={errors.clinic}>
          <Input id="clinic" autoComplete="organization" placeholder="Lumen Multispecialty Clinic" value={form.clinic} onChange={set('clinic')} aria-invalid={errors.clinic ? true : undefined} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password}>
          <PasswordInput id="password" autoComplete="new-password" value={form.password} onChange={set('password')} invalid={!!errors.password} />
        </Field>
        <div className="rounded-qc border border-qc-line bg-qc-surface p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-qc-muted">Password strength</span>
            <span className="font-semibold text-qc-ink" aria-live="polite">
              {form.password ? strengthLabels[score] : '—'}
            </span>
          </div>
          <div
            role="meter"
            aria-label="Password strength"
            aria-valuenow={score}
            aria-valuemin={0}
            aria-valuemax={4}
            className="h-1.5 w-full overflow-hidden rounded-full bg-qc-ink/[0.07]"
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${strengthTones[score]}`}
              style={{ width: `${(score / 4) * 100}%` }}
            />
          </div>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {passwordRules.map((rule, i) => (
              <li
                key={rule.label}
                className={`flex items-center gap-1.5 text-xs ${met[i] ? 'text-qc-teal' : 'text-qc-muted'}`}
              >
                {met[i] ? <Check className="size-3.5" aria-hidden="true" /> : <X className="size-3.5" aria-hidden="true" />}
                <span>
                  {rule.label}
                  <span className="sr-only">{met[i] ? ' — met' : ' — not met'}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Field error={errors.agree}>
          <Checkbox id="agree" checked={agree} onChange={setAgree}>
            I agree to the{' '}
            <a href="#" className="font-semibold text-qc-teal hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-semibold text-qc-teal hover:underline">
              Data Processing Agreement
            </a>
            .
          </Checkbox>
        </Field>
        <Button type="submit" variant="primary" size="lg" className="mt-2 w-full" disabled={loading}>
          {loading ? 'Creating account…' : 'Create account'}
          {!loading && <ArrowRight aria-hidden="true" />}
        </Button>
      </form>
    </AuthLayout>
  )
}

/* ---------- Forgot password ---------- */

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (!emailOk(email)) {
      setError('Enter a valid work email.')
      return
    }
    setError('')
    setSent(true)
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to choose a new one."
      footer={
        <>
          Remembered it?{' '}
          <SmartLink className={linkClass} href="/login">
            Back to sign in
          </SmartLink>
        </>
      }
    >
      {sent ? (
        <div role="status" className="rounded-qc border border-qc-teal/30 bg-qc-teal/[0.06] p-5">
          <p className="flex items-center gap-2 font-semibold text-qc-ink">
            <Check className="size-4 text-qc-teal" aria-hidden="true" /> Check your inbox
          </p>
          <p className="mt-1 text-sm text-qc-muted">
            If an account exists for <span className="font-medium text-qc-text">{email}</span>, a reset
            link is on its way. It expires in 30 minutes.
          </p>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="flex flex-col gap-5">
          <Field label="Work email" htmlFor="email" error={error}>
            <IconInput
              icon={Mail}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@clinic.in"
              value={email}
              aria-invalid={error ? true : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" variant="dark" size="lg" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
