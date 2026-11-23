import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import VerifyForm from './VerifyForm'

interface Props {
  searchParams: Promise<{ token?: string; error?: string }>
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_token:    'Verification link is missing. Please check your email.',
  invalid:          'This verification link is invalid or has already been used.',
  expired:          'This verification link has expired. Please submit a new trial request.',
  provision_failed: 'We could not set up your account. Please try again or contact support.',
  password_too_short: 'Password must be at least 8 characters.',
}

export default async function VerifyPage({ searchParams }: Props) {
  const { token, error: errorParam } = await searchParams

  if (!token) redirect('/?verified=invalid')

  const admin = createServiceClient()

  // Read-only lookup — no side effects on GET so email prefetch can't consume the token
  const { data: club } = await admin
    .from('clubs')
    .select('id, slug, name, contact_email, admin_first_name, verification_expires_at, verified_at')
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

  const serverError = errorParam
    ? (ERROR_MESSAGES[errorParam] ?? decodeURIComponent(errorParam))
    : undefined

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
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#161412', marginBottom: 10, letterSpacing: '-0.01em' }}>
            {club.admin_first_name ? `Welcome, ${club.admin_first_name}!` : `Welcome to ${club.name}!`}
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4A4037', marginBottom: 4 }}>
            Create a password to finish setting up your account.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.5, color: '#7A6E65' }}>
            Next step: fill in a few basic club details and you&apos;re on your way.
          </p>
        </div>

        <VerifyForm
          token={token}
          email={club.contact_email ?? ''}
          clubName={club.name}
          serverError={serverError}
        />

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6B6058', lineHeight: 1.5, marginTop: 20 }}>
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
            ← Start a new trial
          </a>
        )}
      </div>
    </div>
  )
}
