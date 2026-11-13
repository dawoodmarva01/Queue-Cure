import {
  Hourglass,
  PhoneCall,
  Siren,
  ArrowUp,
  ChevronDown,
  Stethoscope,
  CircleDot,
  Coffee,
  Moon,
  CircleCheck,
  SkipForward,
} from 'lucide-react'
import { Link } from 'react-router-dom'

/** Internal paths ("/x") use client-side routing so demo state survives navigation. */
export function SmartLink({ href, ...props }) {
  if (typeof href === 'string' && href.startsWith('/')) return <Link to={href} {...props} />
  return <a href={href} {...props} />
}

const buttonBase =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none transition-[background-color,color,border-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-qc-coral focus-visible:ring-offset-2 focus-visible:ring-offset-qc-ivory active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const buttonVariants = {
  primary: 'bg-qc-coral text-qc-ink hover:bg-qc-coral/85',
  secondary:
    'border border-qc-line bg-qc-surface text-qc-text hover:border-qc-muted/50 hover:bg-qc-ivory',
  dark: 'bg-qc-ink text-qc-ivory hover:bg-qc-ink/90',
  light: 'bg-qc-ivory text-qc-ink hover:bg-white',
  ghost: 'text-qc-text hover:bg-qc-ink/[0.06]',
  danger:
    'border border-qc-skipped/50 bg-qc-surface text-qc-text hover:border-qc-skipped hover:bg-qc-skipped/10 [&_svg]:text-qc-skipped',
  teal: 'bg-qc-teal text-qc-ivory hover:bg-qc-teal/90',
}

const buttonSizes = {
  xs: 'h-7 rounded-qc-sm px-2.5 text-xs',
  sm: 'h-8 rounded-qc-sm px-3 text-[13px]',
  md: 'h-10 rounded-[8px] px-4 text-sm',
  lg: 'h-12 rounded-qc px-5 text-[15px]',
  icon: 'size-9 rounded-[8px]',
  iconSm: 'size-8 rounded-[8px]',
}

export function buttonClass({ variant = 'primary', size = 'lg', className = '' } = {}) {
  return `${buttonBase} ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`
}

export function ButtonLink({ variant, size, className, ...props }) {
  return <SmartLink className={buttonClass({ variant, size, className })} {...props} />
}

export function Button({ variant, size = 'md', className, type = 'button', ...props }) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />
}

export function Kbd({ children }) {
  return (
    <kbd className="ml-0.5 hidden h-5 min-w-5 items-center justify-center rounded-[4px] border border-current/20 px-1 font-sans text-[10.5px] font-semibold opacity-70 lg:inline-flex">
      {children}
    </kbd>
  )
}

const inputBase =
  'w-full min-w-0 rounded-[8px] border border-qc-line bg-qc-surface px-3 text-sm text-qc-text outline-none transition-[border-color,box-shadow] placeholder:text-qc-muted/80 hover:border-qc-muted/40 focus:border-qc-teal focus:ring-3 focus:ring-qc-teal/15 disabled:cursor-not-allowed disabled:bg-qc-ivory disabled:opacity-70 aria-invalid:border-qc-skipped aria-invalid:ring-3 aria-invalid:ring-qc-skipped/15'

export function Input({ className = '', ...props }) {
  return <input className={`${inputBase} h-10 ${className}`} {...props} />
}

export function Textarea({ className = '', ...props }) {
  return (
    <textarea className={`${inputBase} min-h-20 resize-y py-2.5 leading-relaxed ${className}`} {...props} />
  )
}

export function Select({ className = '', children, ...props }) {
  return (
    <div className="relative flex items-center">
      <select className={`${inputBase} h-10 appearance-none pr-9 ${className}`} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 size-4 text-qc-muted" aria-hidden="true" />
    </div>
  )
}

/** Label + control + optional hint/error. */
export function Field({ label, htmlFor, hint, error, aside, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-baseline justify-between text-[13px] font-medium text-qc-text"
        >
          {label}
          {aside && <span className="text-xs font-normal text-qc-muted">{aside}</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium qc-alert">{error}</p>
      ) : (
        hint && <p className="text-xs text-qc-muted">{hint}</p>
      )}
    </div>
  )
}

/** Pill-style radio group, e.g. Walk-in / Appointment. */
export function Segmented({ label, options, value, onChange, size = 'md', className = '' }) {
  const sizes = { sm: 'h-7 px-2.5 text-xs', md: 'h-9 px-3 text-[13px]' }
  return (
    <div role="radiogroup" aria-label={label} className={`inline-flex rounded-[8px] bg-qc-ink/[0.06] p-0.5 ${className}`}>
      {options.map((opt) => {
        const selected = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[6px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-qc-coral [&_svg]:size-3.5 ${sizes[size]} ${
              selected
                ? 'bg-qc-surface text-qc-ink shadow-[0_1px_2px_rgb(21_59_58/0.12)]'
                : 'text-qc-muted hover:text-qc-text'
            }`}
          >
            {Icon && <Icon aria-hidden="true" />}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function Avatar({ initials, size = 'md', tone = 'ink', className = '' }) {
  const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-11 text-sm' }
  const tones = {
    ink: 'bg-qc-ink text-qc-ivory',
    light: 'bg-qc-ink/[0.07] text-qc-ink',
    sage: 'bg-qc-sage/25 text-qc-ivory',
    teal: 'bg-qc-teal/12 text-qc-teal',
  }
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold ${sizes[size]} ${tones[tone]} ${className}`}
    >
      {initials}
    </span>
  )
}

/** White bordered card with an optional header row. */
export function Panel({ title, subtitle, actions, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`flex min-w-0 flex-col rounded-qc border border-qc-line bg-qc-surface ${className}`}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-qc-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[15px] font-bold tracking-tight text-qc-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[13px] text-qc-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={`min-w-0 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

/** Page heading used inside workspaces. */
export function PageHeader({ eyebrow, title, actions, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-qc-teal uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-qc-ink md:text-[28px]">
          {title}
        </h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Row of headline numbers, e.g. Waiting now / In consultation. */
export function StatStrip({ stats }) {
  return (
    <dl
      className={`grid grid-cols-2 overflow-hidden rounded-qc border border-qc-line bg-qc-surface ${
        stats.length >= 5 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'
      }`}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`border-qc-line px-4 py-3.5 max-sm:border-b sm:border-r sm:last:border-r-0 ${
            stats.length % 2 === 1 && i === stats.length - 1 ? 'col-span-2 sm:col-span-1' : ''
          }`}
        >
          <dt className="text-xs font-medium text-qc-muted">{stat.label}</dt>
          <dd className="mt-1 flex items-baseline gap-1 font-display text-2xl leading-none font-extrabold tracking-tight text-qc-ink tabular-nums">
            {stat.value}
            {stat.unit && <span className="text-sm font-bold text-qc-muted">{stat.unit}</span>}
          </dd>
          {stat.note && (
            <dd className={`mt-1 text-[11.5px] ${stat.noteClassName ?? 'text-qc-muted'}`}>{stat.note}</dd>
          )}
        </div>
      ))}
    </dl>
  )
}

/** Thin progress bar. */
export function Meter({ value, max = 100, label, tone = 'teal', className = '' }) {
  const tones = { teal: 'bg-qc-teal', coral: 'bg-qc-coral', amber: 'bg-qc-amber', sage: 'bg-qc-sage' }
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={`h-1.5 w-full overflow-hidden rounded-full bg-qc-ink/[0.07] ${className}`}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${tones[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function LogoMark({ inverted = false, className = 'size-7 shrink-0' }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="9" fill={inverted ? '#F6F4EE' : '#153B3A'} />
      <path
        d="M22.6 21.4A8 8 0 1 1 24 16"
        fill="none"
        stroke={inverted ? '#153B3A' : '#F6F4EE'}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="23.6" cy="22.6" r="2.4" fill="#FF8066" />
    </svg>
  )
}

/** Logo link. `inverted` is for dark backgrounds; `markOnly` hides the wordmark. */
export function Logo({ href = '/', inverted = false, markOnly = false }) {
  return (
    <SmartLink
      href={href}
      aria-label="Queue Cure home"
      className="inline-flex items-center gap-2.5 rounded-qc-sm outline-none focus-visible:ring-2 focus-visible:ring-qc-coral"
    >
      <LogoMark inverted={inverted} />
      {!markOnly && (
        <span
          className={`font-display text-[17px] font-extrabold tracking-[-0.02em] ${
            inverted ? 'text-qc-ivory' : 'text-qc-ink'
          }`}
        >
          Queue<span className={inverted ? 'text-qc-sage' : 'text-qc-teal'}>Cure</span>
        </span>
      )}
    </SmartLink>
  )
}

const doctorStatuses = {
  consult: { label: 'In consult', Icon: Stethoscope, className: 'text-qc-teal' },
  available: { label: 'Available', Icon: CircleDot, className: 'text-qc-teal' },
  break: { label: 'On break', Icon: Coffee, className: 'qc-attn' },
  off: { label: 'Off duty', Icon: Moon, className: 'text-qc-muted' },
}

export function DoctorStatus({ status, className = '' }) {
  const { label, Icon, className: tone } = doctorStatuses[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5 ${tone} ${className}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}


const tokenTones = {
  coral: 'bg-qc-coral text-qc-ink',
  light: 'bg-qc-ivory text-qc-ink border border-qc-line',
  dark: 'bg-qc-ink text-qc-ivory',
}

const tokenSizes = {
  sm: { box: 'h-6 px-2 text-xs gap-1', prefix: 'text-[0.8em]' },
  lg: { box: 'h-12 px-4 text-2xl gap-2', prefix: 'text-base' },
}

/** Ticket-shaped token chip with notched sides, e.g. GM 014 */
export function TokenChip({ prefix, number, tone = 'light', size = 'lg', className = '' }) {
  const s = tokenSizes[size]
  return (
    <span
      className={`relative inline-flex shrink-0 items-center rounded-[6px] font-display font-extrabold tracking-[-0.01em] tabular-nums [mask:radial-gradient(circle_at_0_50%,transparent_4px,#000_4.5px)_left/51%_100%_no-repeat,radial-gradient(circle_at_100%_50%,transparent_4px,#000_4.5px)_right/51%_100%_no-repeat] ${s.box} ${tokenTones[tone]} ${className}`}
    >
      <span className={`font-bold opacity-60 ${s.prefix}`}>{prefix}</span>
      <span>{number}</span>
    </span>
  )
}

const statusPills = {
  waiting: { label: 'Waiting', Icon: Hourglass, className: 'bg-qc-waiting/20 qc-attn' },
  called: { label: 'Called', Icon: PhoneCall, className: 'bg-qc-upcoming/15 qc-info' },
  serving: { label: 'In consult', Icon: Stethoscope, className: 'bg-qc-teal/12 text-qc-teal' },
  done: { label: 'Done', Icon: CircleCheck, className: 'bg-qc-completed/12 text-qc-muted' },
  skipped: { label: 'Skipped', Icon: SkipForward, className: 'bg-qc-skipped/12 qc-alert' },
}

export function StatusPill({ status }) {
  const { label, Icon, className } = statusPills[status]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap h-5 px-2 text-[11px] [&_svg]:size-3 ${className}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}

const flags = {
  emergency: {
    label: 'Emergency',
    Icon: Siren,
    className: 'border border-qc-skipped/50 bg-qc-skipped/15 qc-alert',
  },
  priority: {
    label: 'Priority',
    Icon: ArrowUp,
    className: 'bg-qc-coral/15 text-qc-text [&_svg]:text-qc-coral',
  },
}

export function Flag({ type }) {
  const { label, Icon, className } = flags[type]
  return (
    <span
      className={`hidden h-5 items-center gap-1 rounded-[4px] px-1.5 text-[10.5px] font-bold tracking-wide uppercase sm:inline-flex [&_svg]:size-3 ${className}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}

export function Eyebrow({ children }) {
  return (
    <p className="text-xs font-semibold tracking-[0.1em] text-qc-teal uppercase">{children}</p>
  )
}

export function SectionTitle({ id, className = '', children }) {
  return (
    <h2
      id={id}
      className={`mt-3 font-display text-4xl leading-[1.05] font-extrabold tracking-[-0.035em] ${className}`}
    >
      {children}
    </h2>
  )
}
