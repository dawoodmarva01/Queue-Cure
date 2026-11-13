import { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Stethoscope,
  Ticket,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react'
import { Avatar, Logo, LogoMark, buttonClass } from './ui.jsx'
import { CLINIC, NOW, findToken, formatTime, toggleOnline, useQueue } from '../lib/queue.js'

const workspaces = [
  { to: '/reception', label: 'Reception desk', Icon: Ticket },
  { to: '/doctor', label: 'Doctor workspace', Icon: Stethoscope },
  { to: '/admin', label: 'Admin workspace', Icon: Building2 },
]

/** Closes a popover when clicking outside of it. */
function useDismiss(open, setOpen) {
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])
  return ref
}

function Menu_({ open, className = '', children }) {
  if (!open) return null
  return (
    <div
      role="menu"
      className={`absolute z-50 min-w-56 rounded-qc border border-qc-line bg-qc-surface p-1.5 text-qc-text shadow-qc-pop ${className}`}
    >
      {children}
    </div>
  )
}

const menuItemClass =
  'flex w-full items-center gap-2.5 rounded-[6px] px-2.5 py-2 text-left text-[13px] font-medium text-qc-text outline-none hover:bg-qc-ivory focus-visible:bg-qc-ivory [&_svg]:size-4 [&_svg]:text-qc-muted'

/** In the collapsed rail (md–xl) labels hide; the mobile drawer is always expanded. */
const collapsed = {
  hidden: 'max-xl:hidden',
  srOnly: 'max-xl:sr-only',
  center: 'max-xl:justify-center',
  heading: 'hidden xl:block',
}
const open_ = { hidden: '', srOnly: '', center: '', heading: 'block' }

function WorkspaceSwitcher({ workspace, expanded = false }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, setOpen)
  const Icon = workspace.Icon
  const c = expanded ? open_ : collapsed
  return (
    <div ref={ref} className="relative px-3">
      <button
        type="button"
        aria-label="Switch workspace"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2.5 rounded-[10px] border border-qc-ivory/12 bg-qc-ivory/[0.04] p-2 text-left outline-none hover:bg-qc-ivory/[0.08] focus-visible:ring-2 focus-visible:ring-qc-coral ${c.center}`}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[7px] bg-qc-teal text-qc-ivory [&_svg]:size-4">
          <Icon aria-hidden="true" />
        </span>
        <span className={`min-w-0 flex-1 ${c.hidden}`}>
          <span className="block truncate text-[13px] font-semibold">{CLINIC.name}</span>
          <span className="block truncate text-[11.5px] text-qc-ivory/50">{workspace.label}</span>
        </span>
        <ChevronDown className={`size-4 text-qc-ivory/50 ${c.hidden}`} aria-hidden="true" />
      </button>
      <Menu_ open={open} className="top-full left-3 mt-2">
        <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-semibold tracking-[0.1em] text-qc-muted uppercase">
          Switch workspace
        </p>
        {workspaces.map((w) => (
          <Link key={w.to} to={w.to} role="menuitem" className={menuItemClass} onClick={() => setOpen(false)}>
            <w.Icon aria-hidden="true" />
            {w.label}
          </Link>
        ))}
      </Menu_>
    </div>
  )
}

function UserMenu({ user, expanded = false }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, setOpen)
  const navigate = useNavigate()
  const c = expanded ? open_ : collapsed
  return (
    <div ref={ref} className="relative border-t border-qc-ivory/10 p-3">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-[8px] p-1.5 text-left outline-none hover:bg-qc-ivory/[0.06] focus-visible:ring-2 focus-visible:ring-qc-coral ${c.center}`}
      >
        <Avatar initials={user.initials} size="sm" tone="sage" />
        <span className={`min-w-0 flex-1 ${c.hidden}`}>
          <span className="block truncate text-[13px] font-semibold">{user.name}</span>
          <span className="block truncate text-[11.5px] text-qc-ivory/50">{user.role}</span>
        </span>
        <ChevronDown className={`size-4 text-qc-ivory/50 ${c.hidden}`} aria-hidden="true" />
      </button>
      <Menu_ open={open} className="bottom-full left-3 mb-2">
        <button type="button" role="menuitem" className={menuItemClass} onClick={() => navigate('/login')}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </Menu_>
    </div>
  )
}

function SideNav({ label, items, onNavigate, expanded = false }) {
  const c = expanded ? open_ : collapsed
  return (
    <nav aria-label={label} className="mt-4 flex flex-1 flex-col gap-0.5 px-3">
      <p className={`mb-1 px-2.5 text-[10.5px] font-semibold tracking-[0.1em] text-qc-ivory/40 uppercase ${c.heading}`}>
        {label}
      </p>
      {items.map(({ to, label: itemLabel, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          title={itemLabel}
          onClick={onNavigate}
          className={({ isActive }) =>
            `group relative flex h-10 items-center gap-3 rounded-[8px] px-2.5 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-qc-coral ${c.center} [&_svg]:size-[18px] ${
              isActive
                ? 'bg-qc-ivory/[0.09] text-white'
                : 'text-qc-ivory/65 hover:bg-qc-ivory/[0.05] hover:text-qc-ivory'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span aria-hidden="true" className="absolute top-2 bottom-2 left-0 w-[3px] rounded-full bg-qc-coral" />
              )}
              <Icon aria-hidden="true" />
              <span className={c.srOnly}>{itemLabel}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

function SyncStatus() {
  const { online } = useQueue()
  return (
    <button
      type="button"
      title="Real-time sync status. Click to simulate a connection drop."
      aria-live="polite"
      onClick={toggleOnline}
      className={`inline-flex h-8 items-center gap-2 rounded-full border border-qc-line bg-qc-surface px-3 text-xs font-semibold outline-none hover:bg-qc-ivory focus-visible:ring-2 focus-visible:ring-qc-coral [&_svg]:size-3.5 ${
        online ? 'text-qc-teal' : 'qc-alert'
      }`}
    >
      <span
        className={`size-2 rounded-full ${online ? 'animate-qc-pulse bg-qc-sage' : 'bg-qc-skipped'}`}
        aria-hidden="true"
      />
      {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
      <span>{online ? 'Live' : 'Offline — changes queued'}</span>
    </button>
  )
}

function Notifications() {
  const { activity } = useQueue()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState(0)
  const ref = useDismiss(open, setOpen)
  const unread = Math.max(0, activity.length - seen)
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications, ${unread} unread`}
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v)
          setSeen(activity.length)
        }}
        className={buttonClass({ variant: 'ghost', size: 'icon', className: 'relative' })}
      >
        <Bell aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-qc-coral text-[10px] font-bold text-qc-ink">
            {unread}
          </span>
        )}
      </button>
      <Menu_ open={open} className="top-full right-0 mt-2 w-80">
        <p className="px-2.5 pt-1 pb-2 text-[13px] font-semibold text-qc-ink">Notifications</p>
        {activity.length === 0 ? (
          <p className="px-2.5 pb-3 text-[13px] text-qc-muted">
            You're all caught up. Queue changes will appear here.
          </p>
        ) : (
          <ul className="max-h-80 overflow-auto">
            {activity.slice(0, 12).map((a) => (
              <li key={a.id} className="rounded-[6px] px-2.5 py-2 text-[13px] text-qc-text">
                {a.text}
                <span className="mt-0.5 block text-[11.5px] text-qc-muted">{formatTime(a.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Menu_>
    </div>
  )
}

function SearchBox({ placeholder }) {
  const state = useQueue()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const term = q.trim().toLowerCase()
  const results = term
    ? state.tokens
        .filter(
          (tk) =>
            tk.patient.name.toLowerCase().includes(term) ||
            `${tk.prefix}-${String(tk.number).padStart(3, '0')}`.toLowerCase().includes(term) ||
            (tk.patient.phone ?? '').replace(/\s/g, '').includes(term.replace(/\s/g, '')),
        )
        .slice(0, 6)
    : []
  return (
    <div className="relative w-full max-w-sm">
      <label className="relative flex w-full items-center">
        <span className="sr-only">Search patients, tokens or phone numbers</span>
        <Search className="pointer-events-none absolute left-3 size-4 text-qc-muted" aria-hidden="true" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const tk = findToken(state, q) ?? results[0]
              if (tk) {
                navigate(`/track/${tk.prefix}-${String(tk.number).padStart(3, '0')}`)
                setQ('')
              }
            }
          }}
          placeholder={placeholder}
          className="h-9 w-full rounded-[8px] border border-qc-line bg-qc-surface pr-3 pl-9 text-sm outline-none placeholder:text-qc-muted focus:border-qc-teal focus:ring-3 focus:ring-qc-teal/15"
        />
      </label>
      {term && (
        <div className="absolute top-full right-0 left-0 z-50 mt-1.5 rounded-qc border border-qc-line bg-qc-surface p-1.5 shadow-qc-pop">
          {results.length === 0 ? (
            <p className="px-2.5 py-2 text-[13px] text-qc-muted">No patients match “{q}”.</p>
          ) : (
            results.map((tk) => {
              const code = `${tk.prefix}-${String(tk.number).padStart(3, '0')}`
              return (
                <Link
                  key={tk.id}
                  to={`/track/${code}`}
                  onClick={() => setQ('')}
                  className="flex items-center justify-between gap-3 rounded-[6px] px-2.5 py-2 text-[13px] hover:bg-qc-ivory"
                >
                  <span className="truncate font-medium text-qc-ink">{tk.patient.name}</span>
                  <span className="shrink-0 font-display font-bold text-qc-muted tabular-nums">{code}</span>
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Workspace layout for reception, doctor and admin.
 * nav items: { to, label, mobileLabel?, Icon, end? }
 */
export function AppShell({ workspace, navLabel, items, user, searchPlaceholder, children }) {
  const [drawer, setDrawer] = useState(false)

  return (
    <div className="qc-root flex min-h-dvh w-full">
      <a
        href="#qc-main"
        className="sr-only z-[80] rounded-[6px] bg-qc-coral px-3 py-2 text-sm font-semibold text-qc-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh shrink-0 flex-col bg-qc-ink text-qc-ivory md:flex md:w-[72px] xl:w-[244px]">
        <div className="flex h-16 items-center px-4 xl:px-5">
          <span className="xl:hidden">
            <Logo inverted markOnly />
          </span>
          <span className="hidden xl:inline-flex">
            <Logo inverted />
          </span>
        </div>
        <WorkspaceSwitcher workspace={workspace} />
        <SideNav label={navLabel} items={items} />
        <UserMenu user={user} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-qc-ink/40"
            onClick={() => setDrawer(false)}
          />
          <div className="relative flex h-full w-[264px] flex-col bg-qc-ink text-qc-ivory">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo inverted />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawer(false)}
                className="flex size-9 items-center justify-center rounded-[8px] text-qc-ivory/70 hover:bg-qc-ivory/10"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex flex-1 flex-col">
              <WorkspaceSwitcher workspace={workspace} expanded />
              <SideNav label={navLabel} items={items} expanded onNavigate={() => setDrawer(false)} />
              <UserMenu user={user} expanded />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-qc-line bg-qc-ivory/90 px-4 backdrop-blur md:px-6 xl:px-8">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawer(true)}
            className={buttonClass({ variant: 'ghost', size: 'icon', className: 'md:hidden' })}
          >
            <Menu aria-hidden="true" />
          </button>
          <span className="md:hidden">
            <LogoMark />
          </span>
          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <SearchBox placeholder={searchPlaceholder} />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-[13px] font-semibold text-qc-ink tabular-nums lg:inline" aria-label="Clinic time">
              {formatTime(NOW)}
            </span>
            <SyncStatus />
            <Notifications />
          </div>
        </header>

        <main id="qc-main" className="flex-1 px-4 pt-5 pb-28 md:px-6 md:pb-10 xl:px-8">
          {children}
        </main>
      </div>

      <nav
        aria-label={`${navLabel} (mobile)`}
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-qc-line bg-qc-surface/95 px-2 pb-[max(env(safe-area-inset-bottom),6px)] backdrop-blur md:hidden"
      >
        {items.slice(0, 5).map(({ to, label, mobileLabel, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 pt-2 pb-1 text-[11px] font-semibold ${
                isActive ? 'text-qc-ink' : 'text-qc-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full [&_svg]:size-[18px] ${
                    isActive ? 'bg-qc-ink/[0.08]' : ''
                  }`}
                >
                  <Icon aria-hidden="true" />
                </span>
                {mobileLabel ?? label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Centered container for workspace page content. */
export function WorkspacePage({ children, className = '' }) {
  return <div className={`mx-auto flex max-w-[1500px] flex-col gap-5 ${className}`}>{children}</div>
}
