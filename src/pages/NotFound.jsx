import { ArrowLeft } from 'lucide-react'
import { ButtonLink, Logo } from '../components/ui.jsx'

export default function NotFound() {
  return (
    <div className="qc-root flex min-h-screen flex-col px-5 py-6 sm:px-10">
      <Logo />
      <main className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center py-16 text-center">
        <p className="font-display text-6xl font-extrabold tracking-[-0.04em] text-qc-ink/20">404</p>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.03em] text-qc-ink">
          This page isn't in the queue.
        </h1>
        <p className="mt-2 text-[15px] text-qc-muted">
          The link may be old, or the page may have moved.
        </p>
        <ButtonLink variant="dark" href="/" className="mt-8">
          <ArrowLeft aria-hidden="true" /> Back to home
        </ButtonLink>
      </main>
    </div>
  )
}
