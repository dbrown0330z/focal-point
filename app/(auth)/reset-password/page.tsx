import { resetPassword } from '../actions'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <>
      <h2 className="mb-2 text-lg font-medium text-content-primary">Choose a new password</h2>
      <p className="mb-6 text-sm text-content-secondary leading-relaxed">
        Enter a new password for your account.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
          {error}
        </div>
      )}

      <form action={resetPassword} className="flex flex-col gap-4">
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-content-primary">
            New password
          </label>
          <input
            id="password" name="password" type="password" autoComplete="new-password"
            required minLength={8}
            placeholder="Min. 8 characters"
            className="w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20"
          />
        </div>

        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-action-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover focus:outline-none focus:ring-2 focus:ring-action-primary/30 transition-colors"
        >
          Update password
        </button>
      </form>
    </>
  )
}
