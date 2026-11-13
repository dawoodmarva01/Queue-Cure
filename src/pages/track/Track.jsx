import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  CircleCheck,
  DoorOpen,
  Info,
  Phone,
  QrCode,
  SearchX,
  SkipForward,
  Stethoscope,
  Wifi,
  WifiOff,
} from 'lucide-react'
import {
  CLINIC,
  NOW,
  doctorById,
  estimateWait,
  findToken,
  formatTime,
  pad3,
  positionInLine,
  servingFor,
  tokenCode,
  toggleOnline,
  useQueue,
} from '../../lib/queue.js'
import { Avatar, Button, ButtonLink, Field, Input, LogoMark, Meter, Segmented, SmartLink, StatusPill } from '../../components/ui.jsx'

const RECEPTION_PHONE = '+918041207788'
const DEMO_TOKENS = ['GM-015', 'GM-016', 'GM-017', 'PE-008', 'DE-003']

const TOKEN_MASK =
  '[mask:radial-gradient(circle_at_0_50%,transparent_4px,#000_4.5px)_left/51%_100%_no-repeat,radial-gradient(circle_at_100%_50%,transparent_4px,#000_4.5px)_right/51%_100%_no-repeat]'

/* ---------- shared shell ---------- */

function SyncButton({ online }) {
  return (
    <button
      type="button"
      title="Real-time sync status. Click to simulate a connection drop."
      aria-live="polite"
      onClick={toggleOnline}
      className={`inline-flex h-8 items-center gap-2 rounded-full border border-qc-line bg-qc-surface px-3 text-xs font-semibold outline-none hover:bg-qc-ivory focus-visible:ring-2 focus-visible:ring-qc-coral [&_svg]:size-3.5 ${
        online ? 'text-qc-teal' : 'qc-attn'
      }`}
    >
      <span
        className={`size-2 rounded-full ${online ? 'animate-qc-pulse bg-qc-sage' : 'bg-qc-amber'}`}
        aria-hidden="true"
      />
      {online ? <Wifi aria-hidden="true" /> : <WifiOff aria-hidden="true" />}
      <span>{online ? 'Live' : 'Offline'}</span>
    </button>
  )
}

function TrackShell({ large, children }) {
  const { online } = useQueue()
  return (
    <div className="qc-root min-h-dvh">
      <div
        className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-qc-ivory md:border-x md:border-qc-line md:bg-qc-surface"
        style={{ zoom: large ? 1.15 : 1 }}
      >
        <header className="flex items-center justify-between gap-3 border-b border-qc-line px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <SmartLink
              href="/track"
              aria-label="Queue Cure home"
              className="inline-flex items-center gap-2.5 rounded-qc-sm outline-none focus-visible:ring-2 focus-visible:ring-qc-coral"
            >
              <LogoMark />
            </SmartLink>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-bold text-qc-ink">{CLINIC.name}</p>
              <p className="truncate text-xs text-qc-muted">{CLINIC.branch}</p>
            </div>
          </div>
          <SyncButton online={online} />
        </header>
        {children}
      </div>
    </div>
  )
}

function TextSizeToggle({ large, onChange }) {
  return (
    <Segmented
      label="Text size"
      size="sm"
      value={large ? 'large' : 'normal'}
      onChange={(v) => onChange(v === 'large')}
      options={[
        {
          value: 'normal',
          label: (
            <>
              <span aria-hidden="true">A</span>
              <span className="sr-only">Normal text size</span>
            </>
          ),
        },
        {
          value: 'large',
          label: (
            <>
              <span aria-hidden="true" className="text-[15px]">
                A+
              </span>
              <span className="sr-only">Larger text size</span>
            </>
          ),
        },
      ]}
    />
  )
}

function SmallToken({ code }) {
  const [prefix, number] = code.split('-')
  return (
    <span
      className={`relative inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border border-qc-line bg-qc-ivory px-2.5 font-display text-sm font-extrabold tracking-[-0.01em] text-qc-ink tabular-nums hover:bg-white ${TOKEN_MASK}`}
    >
      <span className="text-[0.8em] font-bold opacity-60">{prefix}</span>
      <span>{number}</span>
    </span>
  )
}

function HelpLine() {
  return (
    <p className="mt-auto pt-12 text-center text-sm text-qc-muted">
      Need help?{' '}
      <a
        href={`tel:${RECEPTION_PHONE}`}
        className="inline-flex items-center gap-1 font-semibold text-qc-teal underline-offset-4 hover:underline [&_svg]:size-3.5"
      >
        <Phone aria-hidden="true" />
        Call reception
      </a>
    </p>
  )
}

/* ---------- /track ---------- */

export function TrackLookup() {
  const queue = useQueue()
  const navigate = useNavigate()
  const [large, setLarge] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const raw = value.trim().toUpperCase().replace(/\s/g, '')
    if (!raw) {
      setError('Enter the token number from your slip.')
      return
    }
    // Accept "GM16", "GM-16" or "GM-016".
    const match = raw.match(/^([A-Z]{2})-?(\d{1,3})$/)
    const code = match ? `${match[1]}-${pad3(Number(match[2]))}` : raw
    if (!findToken(queue, code)) {
      setError(`We couldn't find ${code}. Check the letters and number on your slip.`)
      return
    }
    navigate(`/track/${code}`)
  }

  return (
    <TrackShell large={large}>
      <div className="flex justify-end px-5 pt-4">
        <TextSizeToggle large={large} onChange={setLarge} />
      </div>
      <main className="flex w-full flex-1 flex-col px-5 pt-8 pb-10">
        <h1 className="font-display text-[34px] leading-[1.1] font-extrabold tracking-[-0.03em] text-qc-ink">
          Check your place in the queue
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-qc-text">
          Type the token number from your slip. We’ll show how many people are ahead of you and roughly when
          you’ll be called.
        </p>
        <form noValidate onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Field
            label="Your token number"
            htmlFor="token"
            hint="For example GM-016 — it’s printed at the top of your slip."
            error={error}
          >
            <Input
              id="token"
              name="token"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck="false"
              placeholder="GM-016"
              value={value}
              aria-invalid={!!error}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              className="h-16! font-display text-[28px]! font-extrabold tracking-[0.04em] uppercase placeholder:font-bold placeholder:text-qc-muted/40"
            />
          </Field>
          <Button
            type="submit"
            variant="dark"
            size="lg"
            className="h-14! w-full px-6! text-base!"
          >
            Show my place
            <ArrowRight className="size-5" aria-hidden="true" />
          </Button>
        </form>

        <p className="mt-6 flex items-center gap-3 rounded-qc border border-qc-line bg-qc-surface px-4 py-3.5 text-[15px] text-qc-text">
          <QrCode className="size-6 shrink-0 text-qc-teal" aria-hidden="true" />
          <span>
            <span className="font-semibold">Or scan the QR code</span> on your token slip with your phone camera.
          </span>
        </p>

        <section className="mt-10" aria-labelledby="demo-tokens">
          <h2 id="demo-tokens" className="text-xs font-semibold tracking-[0.08em] text-qc-muted uppercase">
            Try a live token (demo)
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {DEMO_TOKENS.map((code) => (
              <li key={code}>
                <SmartLink
                  href={`/track/${code}`}
                  aria-label={`Track token ${code}`}
                  className="inline-flex rounded-[6px] outline-none focus-visible:ring-2 focus-visible:ring-qc-coral focus-visible:ring-offset-2"
                >
                  <SmallToken code={code} />
                </SmartLink>
              </li>
            ))}
          </ul>
        </section>

        <HelpLine />
      </main>
    </TrackShell>
  )
}

/* ---------- /track/:token ---------- */

function Skeleton({ className = '', rounded = 'rounded-[6px]' }) {
  return <span aria-hidden="true" className={`block animate-pulse bg-qc-ink/[0.07] ${rounded} ${className}`} />
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Loading your place in the queue">
      <div className="flex flex-col items-center gap-3 pt-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-24 w-56" rounded="rounded-[10px]" />
      </div>
      <Skeleton className="h-20 w-full" rounded="rounded-qc" />
      <Skeleton className="h-44 w-full" rounded="rounded-qc" />
      <Skeleton className="h-24 w-full" rounded="rounded-qc" />
    </div>
  )
}

function BigToken({ token, tone }) {
  const tones = {
    dark: 'bg-qc-ink text-qc-ivory',
    coral: 'bg-qc-coral text-qc-ink',
    muted: 'border border-qc-line bg-qc-surface text-qc-muted',
  }
  return (
    <span
      className={`relative inline-flex h-24 items-center gap-3 rounded-[10px] px-7 font-display text-[56px] leading-none font-extrabold tracking-[-0.02em] tabular-nums ${TOKEN_MASK} ${tones[tone]}`}
    >
      <span className="text-[28px] font-bold opacity-60">{token.prefix}</span>
      <span>{pad3(token.number)}</span>
    </span>
  )
}

/** Status-specific headline card. */
function StatusCard({ token, doctor, ahead }) {
  const firstName = token.patient.name.split(' ')[0]
  const cards = {
    waiting: {
      Icon: Info,
      className: 'border border-qc-line bg-qc-surface md:bg-qc-ivory',
      iconClass: 'bg-qc-waiting/20 qc-attn',
      title: ahead === 0 ? 'You’re next — please be ready' : 'Please wait in the lobby',
      body:
        ahead === 0
          ? `Stay near Room ${doctor.room}. ${doctor.name} will call you shortly.`
          : 'You can step out — this page updates on its own, and we’ll text you before your turn.',
    },
    called: {
      Icon: BellRing,
      className: 'bg-qc-coral text-qc-ink',
      iconClass: 'bg-qc-ink text-qc-coral',
      title: `It’s your turn, ${firstName}`,
      body: `Please go to Room ${doctor.room} now. ${doctor.name} is ready for you.`,
    },
    serving: {
      Icon: Stethoscope,
      className: 'bg-qc-ink text-qc-ivory',
      iconClass: 'bg-qc-ivory/10 text-qc-sage',
      title: 'You’re in your consultation',
      body: `With ${doctor.name} in Room ${doctor.room}. Started at ${formatTime(token.startedAt ?? NOW)}.`,
    },
    done: {
      Icon: CircleCheck,
      className: 'border border-qc-line bg-qc-surface md:bg-qc-ivory',
      iconClass: 'bg-qc-teal/12 text-qc-teal',
      title: 'Consultation complete',
      body: `Thank you for visiting ${CLINIC.name}. Please collect your prescription at the front desk.`,
    },
    skipped: {
      Icon: SkipForward,
      className: 'border border-qc-skipped/40 bg-qc-skipped/10',
      iconClass: 'bg-qc-skipped/15 qc-alert',
      title: 'You missed your call',
      body: 'Your token was called but you weren’t there. Speak to reception — they can put you back in line.',
    },
  }
  const card = cards[token.status]
  const { Icon } = card
  return (
    <section
      aria-live="polite"
      className={`flex items-start gap-3.5 rounded-qc p-4 ${card.className}`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full [&_svg]:size-5 ${card.iconClass}`}>
        <Icon aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <h2 className="font-display text-lg leading-snug font-extrabold tracking-tight">{card.title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed opacity-80">{card.body}</p>
      </div>
    </section>
  )
}

/** Share of this doctor's tokens up to yours that have already been handled. */
function queueProgress(state, token) {
  const upToMine = state.tokens.filter((tk) => tk.doctorId === token.doctorId && tk.prefix === token.prefix && tk.number <= token.number)
  const handled = upToMine.filter((tk) => tk.status === 'done' || tk.status === 'skipped' || tk.status === 'serving').length
  return { handled, total: upToMine.length }
}

function WaitCard({ state, token, ahead }) {
  const wait = token.status === 'called' ? 0 : estimateWait(state, token)
  const { handled, total } = queueProgress(state, token)
  const value = token.status === 'called' ? total : handled
  return (
    <section aria-label="Your place in the queue" className="rounded-qc border border-qc-line bg-qc-surface p-5 md:bg-qc-ivory">
      <dl className="grid grid-cols-2 gap-4">
        <div>
          <dt className="text-[13px] text-qc-muted">Ahead of you</dt>
          <dd className="m-0 mt-0.5 font-display text-[40px] leading-none font-extrabold tracking-tight text-qc-ink tabular-nums">
            {ahead}
          </dd>
        </div>
        <div>
          <dt className="text-[13px] text-qc-muted">Estimated wait</dt>
          <dd className="m-0 mt-0.5 font-display text-[40px] leading-none font-extrabold tracking-tight text-qc-ink tabular-nums">
            {wait === 0 ? 'Now' : `~${wait}`}
            {wait > 0 && <span className="text-base font-bold text-qc-muted"> min</span>}
          </dd>
        </div>
      </dl>
      <Meter value={value} max={Math.max(total, 1)} label="Queue progress" className="mt-5" />
      <div className="mt-2 flex items-baseline justify-between text-xs text-qc-muted">
        <span>
          {handled} of {total} seen before you
        </span>
        {wait > 0 && <span>Around {formatTime(NOW + wait)}</span>}
      </div>
      {token.status === 'waiting' && (
        <p className="mt-4 border-t border-qc-line pt-3 text-[13px] leading-snug text-qc-muted">
          We’ll text {maskPhone(token.patient.phone)} when 2 patients are ahead of you.
        </p>
      )}
    </section>
  )
}

/** "+91 98440 61177" → "+91 ••••• •••77" */
function maskPhone(phone) {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (digits.length < 4) return 'you'
  return `+91 ••••• •••${digits.slice(-2)}`
}

function DoctorCard({ state, token, doctor }) {
  const serving = servingFor(state, doctor.id)
  return (
    <section aria-label="Your doctor" className="rounded-qc border border-qc-line bg-qc-surface p-4 md:bg-qc-ivory">
      <div className="flex items-center gap-3">
        <Avatar initials={doctor.initials} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-qc-ink">{doctor.name}</p>
          <p className="truncate text-[13px] text-qc-muted">{doctor.dept}</p>
        </div>
        <div className="shrink-0 text-center">
          <p className="text-[10px] font-semibold tracking-wider text-qc-muted uppercase">Room</p>
          <p className="font-display text-xl leading-none font-extrabold text-qc-ink tabular-nums">{doctor.room}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-qc-line pt-3">
        <span className="inline-flex items-center gap-1.5 text-[13px] text-qc-muted [&_svg]:size-4">
          <DoorOpen aria-hidden="true" /> Now serving
        </span>
        {serving ? (
          serving.id === token.id ? (
            <span className="text-[13px] font-semibold text-qc-teal">You</span>
          ) : (
            <SmallToken code={tokenCode(serving)} />
          )
        ) : (
          <span className="text-[13px] font-medium text-qc-muted">
            {doctor.status === 'break' ? 'Doctor on a short break' : doctor.status === 'off' ? 'Doctor not in yet' : 'No one right now'}
          </span>
        )}
      </div>
    </section>
  )
}

function NotFound({ code }) {
  return (
    <div className="flex flex-col items-center pt-8 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-qc-ink/[0.06] text-qc-muted [&_svg]:size-6">
        <SearchX aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-extrabold tracking-[-0.02em] text-qc-ink">
        We couldn’t find {code}
      </h1>
      <p className="mt-2 max-w-xs text-[15px] leading-relaxed text-qc-muted">
        Check the letters and number on your token slip. Tokens are valid for today only.
      </p>
      <ButtonLink href="/track" variant="dark" size="lg" className="mt-6">
        Try another token <ArrowRight aria-hidden="true" />
      </ButtonLink>
    </div>
  )
}

export function TrackToken() {
  const { token: param = '' } = useParams()
  const live = useQueue()
  const [large, setLarge] = useState(false)
  const [loading, setLoading] = useState(true)
  // While offline, keep showing the last state we received.
  const [snapshot, setSnapshot] = useState(live)

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 450)
    return () => clearTimeout(id)
  }, [param])

  useEffect(() => {
    if (live.online) setSnapshot(live)
  }, [live])

  const state = live.online ? live : snapshot
  const code = param.toUpperCase()
  const token = findToken(state, code)
  const doctor = token ? doctorById(state, token.doctorId) : null
  const ahead = token ? Math.max(0, positionInLine(state, token)) : 0

  return (
    <TrackShell large={large}>
      <div className="flex items-center justify-between gap-3 px-5 pt-4">
        <SmartLink
          href="/track"
          className="inline-flex items-center gap-1.5 rounded-[6px] text-sm font-semibold text-qc-teal outline-none focus-visible:ring-2 focus-visible:ring-qc-coral [&_svg]:size-4"
        >
          <ArrowLeft aria-hidden="true" />
          Another token
        </SmartLink>
        <TextSizeToggle large={large} onChange={setLarge} />
      </div>
      <main className="flex flex-1 flex-col px-5 pt-5 pb-10">
        {loading ? (
          <LoadingState />
        ) : !token || !doctor ? (
          <NotFound code={code} />
        ) : (
          <div className="flex flex-col gap-5">
            {!live.online && (
              <p
                role="status"
                className="flex items-start gap-2.5 rounded-qc-sm border border-qc-amber/50 bg-qc-amber/15 px-3 py-2.5 text-[13px] qc-attn [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0"
              >
                <WifiOff aria-hidden="true" />
                <span>
                  <span className="font-semibold">Connection lost.</span> Showing your last known place — we’ll
                  update as soon as you’re back online.
                </span>
              </p>
            )}

            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <p className="text-sm font-medium text-qc-muted">
                Token for <span className="font-semibold text-qc-text">{token.patient.name}</span>
              </p>
              <BigToken
                token={token}
                tone={token.status === 'called' ? 'coral' : token.status === 'done' || token.status === 'skipped' ? 'muted' : 'dark'}
              />
              <div className="flex items-center gap-2">
                <StatusPill status={token.status} />
                {token.priority !== 'normal' && (
                  <span className="text-xs font-semibold text-qc-muted capitalize">{token.priority}</span>
                )}
              </div>
            </div>

            <StatusCard token={token} doctor={doctor} ahead={ahead} />

            {(token.status === 'waiting' || token.status === 'called') && (
              <WaitCard state={state} token={token} ahead={ahead} />
            )}

            {token.status !== 'done' && <DoctorCard state={state} token={token} doctor={doctor} />}

            {token.status === 'skipped' && (
              <ButtonLink href={`tel:${RECEPTION_PHONE}`} variant="dark" size="lg" className="w-full">
                <Phone aria-hidden="true" /> Call reception
              </ButtonLink>
            )}

            <p className="text-center text-xs text-qc-muted">
              {live.online ? 'Updated live' : 'Last updated'} · {formatTime(NOW)} · Checked in at{' '}
              {formatTime(token.checkedInAt)}
            </p>
          </div>
        )}
        <HelpLine />
      </main>
    </TrackShell>
  )
}
