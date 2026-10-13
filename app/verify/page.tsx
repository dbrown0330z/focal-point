import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import { confirmVerification } from './actions'

interface Props {
  searchParams: Promise<{ token?: string }>
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token } = await searchParams

  if (!token) redirect('/?verified=invalid')

  const admin = createServiceClient()

  // Read-only lookup — no side effects on GET so email prefetch can't consume the token
  const { data: club } = await admin
    .from('clubs')
    .select('id, slug, name, admin_first_name, verification_expires_at, verified_at')
    .eq('verification_token', token)
    .maybeSingle()

  if (!club) {
    return <VerifyError message="This link is invalid or has already been used." />
  }

  if (club.verified_at) {
    return <VerifyError message="Your email is already verified." linkSlug={club.slug} />
  }

  if (!club.verification_expires_at || new Date(club.verification_expires_at) < new Date()) {
    return <VerifyError message="This verification link has expired. Please submit a new trial request." />
  }

  // Render a confirmation page — provisioning only happens when the user clicks
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FBF6EC',
      fontFamily: 'var(--font-lora, Georgia, serif)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(22,20,18,0.10)',
        borderRadius: 16,
        padding: 'clamp(32px, 5vw, 52px)',
        boxShadow: '0 2px 16px rgba(22,20,18,0.07)',
        maxWidth: 460,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 56, height: 56, borderRadius: '50%',
          background: 'rgba(26,105,72,0.10)',
          marginBottom: 20,
        }}>
          <svg width="24" height="24" fill="none" stroke="#1A6948" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#161412', marginBottom: 10, letterSpacing: '-0.01em' }}>
          Confirm your email
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: '#4A4037', marginBottom: 32 }}>
          {club.admin_first_name ? `Welcome, ${club.admin_first_name}! ` : ''}
          Click below to verify your email and start setting up{' '}
          <strong style={{ color: '#161412' }}>{club.name}</strong>.
        </p>

        <form action={async () => {
          'use server'
          await confirmVerification(token)
        }}>
          <button
            type="submit"
            style={{
              width: '100%',
              background: '#E8B14A',
              color: '#161412',
              border: 'none',
              borderRadius: 8,
              padding: '13px 20px',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '-0.01em',
              marginBottom: 16,
            }}
          >
            Confirm and set up my club →
          </button>
        </form>

        <p style={{ fontSize: 13, color: '#6B6058', lineHeight: 1.5 }}>
          This link expires in 24 hours. If you didn&apos;t request this, you can safely ignore it.
        </p>
      </div>
    </div>
  )
}

function VerifyError({ message, linkSlug }: { message: string; linkSlug?: string }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FBF6EC',
      fontFamily: 'var(--font-lora, Georgia, serif)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 24px',
    }}>
      <div style={{
        background: '#FFFFFF',
        border: '1px solid rgba(22,20,18,0.10)',
        borderRadius: 16,
        padding: 'clamp(32px, 5vw, 52px)',
        boxShadow: '0 2px 16px rgba(22,20,18,0.07)',
        maxWidth: 420,
        width: '100%',
        textAlign: 'center',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#161412', marginBottom: 12 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.65, color: '#4A4037', marginBottom: 28 }}>
          {message}
        </p>
        {linkSlug ? (
          <a href={`/${linkSlug}/login`} style={{ fontSize: 15, color: '#1A6948', fontWeight: 600, textDecoration: 'none' }}>
            Sign in to your club →
          </a>
        ) : (
          <a href="/start" style={{ fontSize: 15, color: '#1A6948', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Focal Point
          </a>
        )}
      </div>
    </div>
  )
}
