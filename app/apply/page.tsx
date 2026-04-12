'use client'

import { useState } from 'react'
import Link from 'next/link'
import { applyForMembership } from './actions'

const inputCls = 'w-full rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-sm text-content-primary placeholder-content-muted focus:border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary/20'
const labelCls = 'block text-sm font-medium text-content-primary mb-1.5'

function ConfirmationScreen({ email }: { email: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-success-bg">
            <svg className="h-7 w-7 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-content-primary mb-2">Application submitted</h2>
        <p className="text-content-secondary leading-relaxed mb-2">
          Thanks for applying to Focal Point Camera Club.
        </p>
        <p className="text-content-secondary leading-relaxed">
          A club admin will review your application and you'll receive an email at <strong>{email}</strong> once you've been approved.
        </p>
        <p className="mt-8 text-content-secondary text-sm">
          Already approved?{' '}
          <Link href="/login" className="font-medium text-action-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setServerError(null)

    const result = await applyForMembership(form)
    if (result?.error) {
      setServerError(result.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) return <ConfirmationScreen email={form.email} />

  return (
    <div className="min-h-screen">
      <header className="border-b border-border-default bg-surface-2">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <Link href="/" className="text-sm font-semibold text-content-primary">Focal Point</Link>
          <Link href="/login" className="text-sm text-content-secondary hover:text-content-primary transition-colors">Sign in</Link>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-10">
        <h2 className="text-xl font-semibold text-content-primary mb-1">Apply for membership</h2>
        <p className="text-content-secondary leading-relaxed mb-8">
          Submit your details and a club admin will review your application. Once approved, you'll
          receive an email to complete your profile and pay the annual membership fee.
        </p>

        {serverError && (
          <div className="mb-5 rounded-lg border border-status-error bg-status-error-bg px-4 py-3 text-sm text-status-error-text">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className={labelCls}>First name</label>
              <input
                id="firstName" type="text" required placeholder="Jane"
                className={inputCls}
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="lastName" className={labelCls}>Last name</label>
              <input
                id="lastName" type="text" required placeholder="Smith"
                className={inputCls}
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={labelCls}>Email address</label>
            <input
              id="email" type="email" required autoComplete="email"
              placeholder="jane@example.com"
              className={inputCls}
              value={form.email}
              onChange={e => set('email', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className={labelCls}>Password</label>
            <input
              id="password" type="password" required autoComplete="new-password" minLength={8}
              placeholder="Min. 8 characters"
              className={inputCls}
              value={form.password}
              onChange={e => set('password', e.target.value)}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full rounded-lg bg-action-primary px-4 py-3 text-sm font-medium text-white hover:bg-action-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
