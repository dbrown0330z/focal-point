import Link from 'next/link'
import { login } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pending?: string; reset?: string }>
}) {
  const { error, pending, reset } = await searchParams

  return (
    <>
      <h2 className="mb-6 text-lg font-medium text-content-primary">Sign in</h2>

      {reset && (
        <div className="mb-4 rounded-lg border border-status-success bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          Password updated — you can now sign in.
        </div>
      )}

      {pending && (
        <div className="mb-4 rounded-lg border border-status-warning bg-status-warning-bg px-4 py-3 text-sm text-status-warning-text">
          Your account is pending approval. You'll be able to sign in once an admin activates it.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <form action={login} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-content-primary">
            Email
          </label>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            placeholder="you@example.com"
            className="w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-content-primary">
            Password
          </label>
          <input
            id="password" name="password" type="password" autoComplete="current-password" required
            className="w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-action-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover focus:outline-none focus:ring-2 focus:ring-action-primary/30 transition-colors"
        >
          Sign in
        </button>
      </form>

      <p className="mt-3 text-center text-sm text-content-secondary">
        <Link href="/forgot-password" className="text-action-primary hover:underline">
          Forgot your password?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm text-content-secondary">
        Not a member?{' '}
        <Link href="/apply" className="font-medium text-action-primary hover:underline">
          Request to join
        </Link>
      </p>
    </>
  )
}
