import { useEffect, useId } from 'react'
import { CalendarClock, CalendarX, CircleCheck, LogIn, Search, UserX, X } from 'lucide-react'

/** Same base as the shared Button so custom variants look identical. */
const btnBase =
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap font-semibold outline-none transition-[background-color,color,border-color,transform] duration-150 focus-visible:ring-2 focus-visible:ring-qc-coral focus-visible:ring-offset-2 focus-visible:ring-offset-qc-ivory active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const btnVariants = {
  outlineTeal: 'border border-qc-teal/35 bg-qc-surface text-qc-teal hover:border-qc-teal hover:bg-qc-teal/5',
  link: 'text-qc-teal underline-offset-4 hover:underline',
}

const btnSizes = {
  xs: 'h-7 rounded-qc-sm px-2.5 text-xs',
  sm: 'h-8 rounded-qc-sm px-3 text-[13px]',
  md: 'h-10 rounded-[8px] px-4 text-sm',
}

/** Admin-only button styles (teal outline + text link) not covered by the shared Button. */
export function adminButton(variant, size = 'sm', className = '') {
  return `${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`
}

/** Page container used by every admin page. */
export function AdminPage({ wide = false, children }) {
  return (
    <div className={`mx-auto flex flex-col gap-6 ${wide ? 'w-full max-w-7xl' : 'max-w-[1240px]'}`}>
      {children}
    </div>
  )
}

export function AdminHeader({ eyebrow = 'Administration', title, description, actions }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <p className="mb-1.5 text-xs font-semibold tracking-[0.08em] text-qc-teal uppercase">{eyebrow}</p>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.025em] text-qc-ink md:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-qc-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

const inputBase =
  'w-full min-w-0 rounded-[8px] border border-qc-line bg-qc-surface px-3 text-sm text-qc-text outline-none transition-[border-color,box-shadow] placeholder:text-qc-muted/80 hover:border-qc-muted/40 focus:border-qc-teal focus:ring-3 focus:ring-qc-teal/15'

export function SearchInput({ className = '', ...props }) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <span className="pointer-events-none absolute left-3 flex text-qc-muted [&_svg]:size-4">
        <Search aria-hidden="true" />
      </span>
      <input type="search" className={`${inputBase} h-10 pl-9`} {...props} />
    </div>
  )
}

/** Toggle switch with label + description, as in Clinic settings. */
export function Switch({ checked, onChange, label, description, labelClassName = 'text-sm font-medium text-qc-text' }) {
  const id = useId()
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <label htmlFor={id} className={labelClassName}>
          {label}
        </label>
        {description && <p className="mt-0.5 text-[13px] text-qc-muted">{description}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-qc-coral focus-visible:ring-offset-2 ${
          checked ? 'bg-qc-teal' : 'bg-qc-line'
        }`}
      >
        <span
          className={`inline-block size-[18px] rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[19px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  )
}

/** Centered modal dialog. Closes on Escape or backdrop click. */
export function Dialog({ open, onClose, title, description, children, footer }) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-qc-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92dvh] w-full flex-col rounded-t-qc border border-qc-line bg-qc-surface shadow-qc-pop sm:max-w-lg sm:rounded-qc"
      >
        <header className="flex items-start justify-between gap-4 border-b border-qc-line px-5 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-[17px] font-bold tracking-tight text-qc-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-qc-muted">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mt-1 -mr-2 flex size-8 shrink-0 items-center justify-center rounded-[8px] text-qc-muted outline-none hover:bg-qc-ink/[0.06] focus-visible:ring-2 focus-visible:ring-qc-coral"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-qc-line px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/** Normalises appointment statuses coming from the store ('noshow') and this workspace ('no-show'). */
export function normalizeApptStatus(status) {
  if (status === 'noshow') return 'no-show'
  if (status === 'arrived' || status === 'checkedin') return 'checked-in'
  return status
}

const apptStatuses = {
  booked: { label: 'Booked', Icon: CalendarClock, className: 'bg-qc-upcoming/15 qc-info' },
  'checked-in': { label: 'Checked in', Icon: LogIn, className: 'bg-qc-teal/12 text-qc-teal' },
  'no-show': { label: 'No-show', Icon: UserX, className: 'bg-qc-amber/22 qc-attn' },
  cancelled: { label: 'Cancelled', Icon: CalendarX, className: 'bg-qc-skipped/12 qc-alert' },
  completed: { label: 'Completed', Icon: CircleCheck, className: 'bg-qc-completed/12 text-qc-muted' },
}

export const apptStatusOptions = Object.entries(apptStatuses).map(([value, { label }]) => ({ value, label }))

export function ApptStatusBadge({ status }) {
  const { label, Icon, className } = apptStatuses[normalizeApptStatus(status)] ?? apptStatuses.booked
  return (
    <span
      className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3.5 ${className}`}
    >
      <Icon aria-hidden="true" />
      {label}
    </span>
  )
}

/** Small empty state used inside panels. */
export function EmptyState({ Icon, title, children }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full border border-dashed border-qc-muted/40 text-qc-muted [&_svg]:size-5">
        <Icon aria-hidden="true" />
      </span>
      <p className="mt-3 font-display text-[15px] font-bold text-qc-ink">{title}</p>
      {children && <p className="mt-1 max-w-xs text-[13px] text-qc-muted">{children}</p>}
    </div>
  )
}

/** Pending invite shown on Overview "Needs attention" and the Staff list. */
export const PENDING_INVITE = { name: 'Deepak Hegde', email: 'deepak@lumenclinic.in' }
