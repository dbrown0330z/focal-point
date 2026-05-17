'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'

const labelSx: React.CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '13px',
  fontWeight: 500,
  color: '#E8E8E8',
  fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
}

const inputCls = [
  'w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors',
  'font-[family-name:var(--font-nunito)]',
].join(' ')

const inputStyle: React.CSSProperties = {
  background: '#292929',
  border: '1px solid rgba(255,255,255,0.12)',
  color: '#E8E8E8',
  fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
}

export default function LoginForm({
  errorParam,
  pendingParam,
  resetParam,
}: {
  errorParam?: string
  pendingParam?: string
  resetParam?: string
}) {
  const router = useRouter()
  const [error, setError]     = useState<string | null>(errorParam ?? null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form     = e.currentTarget
    const email    = (form.elements.namedItem('email')    as HTMLInputElement).value
    const password = (form.elements.namedItem('password') as HTMLInputElement).value

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Session is now in browser cookies — navigate to club
    router.push('/default')
    router.refresh()
  }

  return (
    <>
      <h2 style={{
        marginBottom: '24px', fontSize: '20px', fontWeight: 600,
        color: '#E8E8E8', fontFamily: 'var(--font-lora, Lora, Georgia, serif)',
      }}>
        Sign in
      </h2>

      {resetParam && (
        <div className="mb-4 rounded-lg border border-status-success bg-status-success-bg px-4 py-3 text-sm text-status-success-text">
          Password updated — you can now sign in.
        </div>
      )}

      {pendingParam && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(166,124,0,0.12)', border: '1px solid rgba(166,124,0,0.35)', color: '#FAD84A' }}>
          Your account is pending approval. You&apos;ll be able to sign in once an admin activates it.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(211,47,47,0.12)', border: '1px solid rgba(211,47,47,0.35)', color: '#F09595' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" style={labelSx}>Email</label>
          <input
            id="email" name="email" type="email" autoComplete="email" required
            placeholder="you@example.com"
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <div>
          <label htmlFor="password" style={labelSx}>Password</label>
          <input
            id="password" name="password" type="password" autoComplete="current-password" required
            className={inputCls}
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60"
          style={{
            background: 'var(--action-primary)',
            fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)',
          }}
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-3 text-center text-sm" style={{ color: '#9E9E9E', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
        <Link href="/forgot-password" className="hover:underline" style={{ color: 'var(--action-primary)' }}>
          Forgot your password?
        </Link>
      </p>

      <p className="mt-6 text-center text-sm" style={{ color: '#9E9E9E', fontFamily: 'var(--font-nunito, Nunito, system-ui, sans-serif)' }}>
        Not a member?{' '}
        <Link href="/apply" className="font-medium hover:underline" style={{ color: 'var(--action-primary)' }}>
          Request to join
        </Link>
      </p>
    </>
  )
}
