'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const labelSx: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#E8E8E8',
  fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
}

const inputStyle: React.CSSProperties = {
  background: '#292929',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#E8E8E8',
  fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
}

export default function ForgotPasswordPage() {
  const [sent, setSent]             = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState<string | null>(null)

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
      <h2
        style={{
          marginBottom: '8px',
          fontSize: '20px',
          fontWeight: 600,
          color: '#E8E8E8',
          fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
        }}
      >
        Reset your password
      </h2>

      {sent ? (
        <>
          <p className="mb-6 leading-relaxed" style={{ fontSize: '14px', color: '#9E9E9E', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
            If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
          </p>
          <p className="text-center" style={{ fontSize: '14px', color: '#9E9E9E', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
            <Link href="/login" className="font-medium hover:underline" style={{ color: 'var(--action-primary)' }}>
              Back to sign in
            </Link>
          </p>
        </>
      ) : (
        <>
          <p className="mb-6 leading-relaxed" style={{ fontSize: '14px', color: '#9E9E9E', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {error && (
            <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(211,47,47,0.12)', border: '1px solid rgba(211,47,47,0.35)', color: '#F09595', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label htmlFor="email" style={labelSx}>Email</label>
              <input
                id="email" name="email" type="email" autoComplete="email" required
                placeholder="you@example.com"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'var(--action-primary)',
                fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
              }}
            >
              {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <p className="mt-6 text-center" style={{ fontSize: '14px', color: '#9E9E9E', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
            <Link href="/login" className="hover:underline" style={{ color: 'var(--action-primary)' }}>
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </>
  )
}
