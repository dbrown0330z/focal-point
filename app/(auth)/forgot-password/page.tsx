'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <h2 className="mb-2 text-lg font-medium text-content-primary">Reset your password</h2>

      {sent ? (
        <>
          <p className="mb-6 text-sm text-content-secondary leading-relaxed">
            If that email is registered, you'll receive a reset link shortly. Check your inbox.
          </p>
          <p className="text-center text-sm text-content-secondary">
            <Link href="/login" className="font-medium text-action-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mb-6 text-sm text-content-secondary leading-relaxed">
            Enter your email and we'll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-action-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-action-primary-hover focus:outline-none focus:ring-2 focus:ring-action-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-content-secondary">
            <Link href="/login" className="text-action-primary hover:underline">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </>
  )
}
