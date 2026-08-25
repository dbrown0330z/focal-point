'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  Box,
  Button,
  FormLabel,
  OutlinedInput,
  Stack,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { applyForMembership, createMembership } from './actions'
import { createBrowserClient } from '@supabase/ssr'

const BENEFITS = [
  'Regular competitions with professional judging and scored feedback',
  'A community of photographers at every skill level',
  'Workshops, critiques, and learning sessions',
  'Field trips and shooting events',
]

function darkInputSx(error = false) {
  return {
    bgcolor: '#292929',
    color: '#E8E8E8',
    fontFamily: 'var(--font-body)',
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: error ? '#D32F2F' : 'rgba(255,255,255,0.12)',
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: error ? '#D32F2F' : 'rgba(255,255,255,0.25)',
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: error ? '#D32F2F' : '#4A90D4',
    },
    '& input': {
      color: '#E8E8E8',
      fontFamily: 'var(--font-body)',
      '&::placeholder': { color: '#5E5E5E', opacity: 1 },
    },
  }
}

function ConfirmationScreen({ email, clubName, clubSlug, requiresVerification }: {
  email: string; clubName: string; clubSlug?: string; requiresVerification?: boolean
}) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: '#141414',
    }}>
      <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {/* Illustration */}
        {requiresVerification ? (
          /* Dark-mode inbox+envelope illustration — ink vars inverted to warm silver */
          <svg xmlns="http://www.w3.org/2000/svg" width="380" height="176" viewBox="0 0 680 280" role="img" aria-hidden="true" style={{ marginBottom: '2rem', maxWidth: '100%' }}>
            <style>{`
              .ck-dk { --ink: #C8C8C8; --ink-light: rgba(200,200,200,0.22); --ink-faint: rgba(200,200,200,0.07); }
              .sk { stroke: var(--ink); fill: none; stroke-linecap: round; stroke-linejoin: round; }
            `}</style>
            <g className="ck-dk" transform="translate(340, 140)" style={{ stroke: 'var(--ink)' }}>
              {/* Inbox tray */}
              <path className="sk" d="M-110,70 C-112,70 -108,42 -106,40 C-60,36 60,36 106,40 C108,42 112,70 110,70 C60,75 -60,75 -110,70Z" strokeWidth="2.2"/>
              <path className="sk" d="M-108,69 C-110,69 -106,43 -104,41 C-58,37 58,37 104,41 C106,43 110,69 108,69" strokeWidth="0.6" stroke="var(--ink-light)"/>
              <path className="sk" d="M-110,70 C-112,71 -112,86 -110,88 C-60,93 60,93 110,88 C112,86 112,71 110,70" strokeWidth="2"/>
              <path className="sk" d="M-108,70 C-110,71 -110,85 -108,87 C-58,92 58,92 108,87 C110,85 110,70 108,70" strokeWidth="0.6" stroke="var(--ink-light)"/>
              <path className="sk" d="M-110,88 C-60,93 60,93 110,88" strokeWidth="1.6"/>
              <path className="sk" d="M-106,40 C-108,38 -112,70 -110,88" strokeWidth="1.8"/>
              <path className="sk" d="M106,40 C108,38 112,70 110,88" strokeWidth="1.8"/>
              <path className="sk" d="M-104,42 C-58,38 58,38 104,42" strokeWidth="1.2" opacity="0.4"/>
              <line className="sk" x1="-90" y1="72" x2="-86" y2="86" strokeWidth="0.8" opacity="0.12"/>
              <line className="sk" x1="-78" y1="71" x2="-74" y2="86" strokeWidth="0.8" opacity="0.12"/>
              <line className="sk" x1="-66" y1="70" x2="-62" y2="86" strokeWidth="0.8" opacity="0.12"/>
              <line className="sk" x1="-30" y1="78" x2="30" y2="78" strokeWidth="1" opacity="0.22"/>
              <line className="sk" x1="-20" y1="84" x2="20" y2="84" strokeWidth="1" opacity="0.18"/>
              {/* Second envelope behind */}
              <path className="sk" d="M60,36 C58,35 59,-10 60,-12 C78,-14 96,-14 98,-12 C100,-10 100,35 98,36 C80,39 62,39 60,36Z" strokeWidth="1.4" opacity="0.35"/>
              {/* Main envelope */}
              <path className="sk" d="M-72,38 C-74,37 -73,-26 -71,-28 C-36,-32 36,-32 71,-28 C73,-26 74,37 72,38 C36,43 -36,43 -72,38Z" strokeWidth="2.2"/>
              <path className="sk" d="M-70,37 C-72,36 -71,-24 -69,-27 C-34,-31 34,-31 69,-27 C71,-24 72,36 70,37" strokeWidth="0.6" stroke="var(--ink-light)"/>
              <path className="sk" d="M-71,-28 C-40,-6 -10,10 0,12 C10,10 40,-6 71,-28" strokeWidth="2"/>
              <path className="sk" d="M-71,-28 C-44,-14 -18,-4 0,12 C18,-4 44,-14 71,-28" strokeWidth="0.6" opacity="0.18"/>
              <path className="sk" d="M-71,-28 C-50,-38 -24,-42 0,-40 C24,-42 50,-38 71,-28" strokeWidth="1.6" opacity="0.45"/>
              <path className="sk" d="M-72,38 C-40,14 -10,-2 0,0 C10,-2 40,14 72,38" strokeWidth="1.4" opacity="0.35"/>
              <line className="sk" x1="-44" y1="10" x2="44" y2="9" strokeWidth="1" opacity="0.2"/>
              <line className="sk" x1="-44" y1="20" x2="44" y2="19" strokeWidth="1" opacity="0.2"/>
              <line className="sk" x1="-36" y1="30" x2="36" y2="29" strokeWidth="1" opacity="0.2"/>
              <line className="sk" x1="-62" y1="22" x2="-56" y2="36" strokeWidth="0.8" opacity="0.12"/>
              <line className="sk" x1="-56" y1="20" x2="-50" y2="36" strokeWidth="0.8" opacity="0.12"/>
              {/* Notification starburst */}
              <g transform="translate(82, -44)">
                <line x1="0" y1="-22" x2="0" y2="-14" strokeWidth="1.4" opacity="0.55" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="0" y1="14" x2="0" y2="22" strokeWidth="1.4" opacity="0.55" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="-22" y1="0" x2="-14" y2="0" strokeWidth="1.4" opacity="0.55" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="14" y1="0" x2="22" y2="0" strokeWidth="1.4" opacity="0.55" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="-16" y1="-16" x2="-10" y2="-10" strokeWidth="1.2" opacity="0.45" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="10" y1="-10" x2="16" y2="-16" strokeWidth="1.2" opacity="0.45" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="10" y1="10" x2="16" y2="16" strokeWidth="1.2" opacity="0.45" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <line x1="-16" y1="16" x2="-10" y2="10" strokeWidth="1.2" opacity="0.45" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <circle cx="0" cy="0" r="12" strokeWidth="1.8" stroke="#C8C8C8" fill="none"/>
                <circle cx="0" cy="0" r="12" fill="#C8C8C8" stroke="none" opacity="0.07"/>
                <line x1="0" y1="-6" x2="0" y2="2" strokeWidth="2.2" opacity="0.65" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
                <circle cx="0" cy="6" r="1.8" fill="#C8C8C8" stroke="none" opacity="0.65"/>
              </g>
              {/* Arrow */}
              <line x1="-140" y1="-20" x2="-140" y2="28" strokeWidth="1.5" opacity="0.35" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
              <path d="M-148,20 L-140,32 L-132,20" strokeWidth="1.4" opacity="0.35" stroke="#C8C8C8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="-158" y1="-10" x2="-158" y2="-20" strokeWidth="1.2" opacity="0.35" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
              <line x1="-164" y1="-15" x2="-152" y2="-15" strokeWidth="1.2" opacity="0.35" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
              <line x1="-162" y1="-11" x2="-154" y2="-19" strokeWidth="0.9" opacity="0.3" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
              <line x1="-154" y1="-11" x2="-162" y2="-19" strokeWidth="0.9" opacity="0.3" stroke="#C8C8C8" fill="none" strokeLinecap="round"/>
              {/* Ground shadow */}
              <line x1="-180" y1="96" x2="180" y2="96" strokeWidth="1.2" opacity="0.12" stroke="#C8C8C8"/>
              <ellipse cx="0" cy="96" rx="116" ry="7" fill="#C8C8C8" stroke="none" opacity="0.04"/>
            </g>
          </svg>
        ) : (
          /* Admin-approval: simple success badge */
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(46,125,50,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#97C459" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 13l4 4L19 7"/>
            </svg>
          </div>
        )}

        {/* Heading — Lora serif matches the form's "Welcome" heading */}
        <h2 style={{
          fontFamily: 'var(--font-lora, Georgia, serif)',
          fontSize: 'clamp(22px, 5vw, 28px)',
          fontWeight: 700,
          color: '#E8E8E8',
          letterSpacing: '-0.02em',
          lineHeight: 1.25,
          marginBottom: '1rem',
        }}>
          {requiresVerification ? 'Check your email' : 'Application submitted'}
        </h2>

        {requiresVerification ? (
          <>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#9E9E9E', marginBottom: '0.625rem' }}>
              We sent a verification link to{' '}
              <strong style={{ color: '#4A90D4', fontWeight: 500 }}>{email}</strong>.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#9E9E9E' }}>
              Click the link in that email to complete your registration with {clubName}.
            </p>
            <p style={{ marginTop: '2rem', fontSize: '12px', color: '#525252', lineHeight: 1.6 }}>
              Didn&rsquo;t get it? Check your spam folder, or contact the club for help.
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#9E9E9E', marginBottom: '0.625rem' }}>
              Thanks for applying to {clubName}.
            </p>
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: '#9E9E9E' }}>
              A club admin will review your application and email you at{' '}
              <strong style={{ color: '#4A90D4', fontWeight: 500 }}>{email}</strong> once approved.
            </p>
            <p style={{ marginTop: '2rem' }}>
              <Link
                href={clubSlug ? `/${clubSlug}` : '/'}
                style={{ fontSize: '13px', color: '#4A90D4', textDecoration: 'none' }}
              >
                View your application status →
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}


export default function ApplyClient({ clubName, termsUrl, clubSlug, approvalMode = 'email_verification' }: { clubName: string; termsUrl: string | null; clubSlug?: string; approvalMode?: string }) {
  const [submitted,            setSubmitted]            = useState(false)
  const [requiresVerification, setRequiresVerification] = useState(false)
  const [submitting,           setSubmitting]           = useState(false)
  const [serverError,          setServerError]          = useState<string | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  })

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const passwordMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword

  const canSubmit = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.email.trim() &&
    form.password.length >= 8 &&
    form.confirmPassword === form.password &&
    (!termsUrl || agreedTerms)
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || submitting) return
    setSubmitting(true)
    setServerError(null)

    if (approvalMode !== 'admin_approval') {
      // ── Email-verification path: sign up client-side so the PKCE verifier is
      // stored in the browser's own localStorage — not a server cookie that may
      // be missing when the email link is opened. Using flowType:'implicit' means
      // Supabase issues a plain OTP token_hash (no pkce_ prefix) which our
      // /auth/confirm route can verify with verifyOtp() without any stored state.
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { flowType: 'implicit' } }
      )
      const displayName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim()
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email:    form.email,
        password: form.password,
        options: {
          data: {
            display_name: displayName,
            first_name:   form.firstName.trim(),
            last_name:    form.lastName.trim(),
            club_name:    clubName,
          },
        },
      })
      if (signUpError) {
        setServerError(signUpError.message)
        setSubmitting(false)
        return
      }
      const userId = signUpData.user?.id
      if (userId) {
        const memberResult = await createMembership({
          userId,
          firstName: form.firstName,
          lastName:  form.lastName,
        })
        if (memberResult?.error) {
          setServerError(memberResult.error)
          setSubmitting(false)
          return
        }
      }
      setRequiresVerification(true)
      setSubmitted(true)
    } else {
      // ── Admin-approval path: fully server-side (no email verification).
      const result = await applyForMembership({
        firstName: form.firstName,
        lastName:  form.lastName,
        email:     form.email,
        password:  form.password,
      })
      if (result?.error) {
        setServerError(result.error)
        setSubmitting(false)
      } else {
        setRequiresVerification(false)
        setSubmitted(true)
      }
    }
  }

  if (submitted) return <ConfirmationScreen email={form.email} clubName={clubName} clubSlug={clubSlug} requiresVerification={requiresVerification} />

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-border-default bg-surface-2">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold text-content-primary">{clubName}</Link>
          <Link href={clubSlug ? `/${clubSlug}/login` : '/login'} className="text-sm text-content-secondary hover:text-content-primary transition-colors">Sign in</Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14">

        {/* Illustration + club name — centered above columns */}
        <div className="flex flex-col items-center mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/request-account.svg" alt="" className="dark:invert dark:opacity-75" style={{ width: '100%', maxWidth: 585, height: 'auto', display: 'block', marginBottom: 24 }} />
          <Typography
            sx={{
              textAlign: 'center',
              fontSize: '48px',
              fontWeight: 500,
              color: 'var(--action-primary)',
              fontFamily: 'var(--font-lora), Georgia, serif',
              lineHeight: 1.2,
            }}
          >
            Welcome to {clubName}
          </Typography>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 lg:items-start">

          {/* Left: marketing copy */}
          <div className="lg:pt-1">
            <Typography
              variant="h1"
              sx={{ mb: 2.5, fontSize: { xs: '24px', md: '26px' }, lineHeight: 1.25, fontWeight: 700 }}
            >
              Join the club — we'd love to have you
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 5, lineHeight: 1.8 }}>
              Fill out the form and we'll review your application. Once approved you'll receive an
              email with a link to complete your profile and activate your membership.
            </Typography>

            <Typography
              sx={{ mb: 2, fontSize: '13px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}
            >
              When you join you'll get access to
            </Typography>

            <Stack spacing={2} sx={{ mb: 5 }}>
              {BENEFITS.map(benefit => (
                <Box key={benefit} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{
                    mt: '3px', flexShrink: 0, width: 18, height: 18, borderRadius: '50%',
                    bgcolor: 'var(--status-success-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CheckIcon sx={{ fontSize: 11, color: 'var(--status-success-text)' }} />
                  </Box>
                  <Typography sx={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--text-secondary)' }}>
                    {benefit}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              Ready? Sign up today!
            </Typography>
          </div>

          {/* Right: dark form card */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{
              bgcolor: '#1E1E1E',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 'var(--radius-lg)',
              p: { xs: 3, sm: 4 },
            }}
          >
            {serverError && (
              <Alert severity="error" sx={{ mb: 3 }}>{serverError}</Alert>
            )}

            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <FormLabel htmlFor="firstName" sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500, color: '#E8E8E8', fontFamily: 'var(--font-body)' }}>
                    First name
                  </FormLabel>
                  <OutlinedInput
                    id="firstName" fullWidth required placeholder="Jane"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    sx={darkInputSx()}
                  />
                </Box>
                <Box>
                  <FormLabel htmlFor="lastName" sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500, color: '#E8E8E8', fontFamily: 'var(--font-body)' }}>
                    Last name
                  </FormLabel>
                  <OutlinedInput
                    id="lastName" fullWidth required placeholder="Smith"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                    sx={darkInputSx()}
                  />
                </Box>
              </Box>

              <Box>
                <FormLabel htmlFor="email" sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500, color: '#E8E8E8', fontFamily: 'var(--font-body)' }}>
                  Email address
                </FormLabel>
                <OutlinedInput
                  id="email" type="email" fullWidth required autoComplete="email"
                  placeholder="jane@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  sx={darkInputSx()}
                />
              </Box>

              <Box>
                <FormLabel htmlFor="password" sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500, color: '#E8E8E8', fontFamily: 'var(--font-body)' }}>
                  Password
                </FormLabel>
                <OutlinedInput
                  id="password" type="password" fullWidth required autoComplete="new-password"
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  sx={darkInputSx()}
                />
              </Box>

              <Box>
                <FormLabel htmlFor="confirmPassword" sx={{ display: 'block', mb: 0.75, fontSize: '13px', fontWeight: 500, color: '#E8E8E8', fontFamily: 'var(--font-body)' }}>
                  Confirm password
                </FormLabel>
                <OutlinedInput
                  id="confirmPassword" type="password" fullWidth required autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={e => set('confirmPassword', e.target.value)}
                  sx={darkInputSx(passwordMismatch)}
                />
                {passwordMismatch && (
                  <Typography sx={{ mt: 0.75, fontSize: '12px', color: '#F09595' }}>
                    Passwords don't match
                  </Typography>
                )}
              </Box>

              {/* ── Membership terms — only shown when a T&C document exists ── */}
              {termsUrl && (
                <Box
                  component="label"
                  sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, cursor: 'pointer', userSelect: 'none' }}
                >
                  <Box
                    component="input"
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={e => setAgreedTerms(e.target.checked)}
                    sx={{ mt: '2px', flexShrink: 0, width: 16, height: 16, accentColor: '#4A90D4', cursor: 'pointer' }}
                  />
                  <Box component="span" sx={{ fontSize: '13px', color: '#9E9E9E', lineHeight: 1.55 }}>
                    I have read and agree to the{' '}
                    <Box
                      component="a"
                      href={termsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      sx={{ color: '#4A90D4', textDecoration: 'underline', textUnderlineOffset: '2px', '&:hover': { color: '#5FA0E0' } }}
                    >
                      {clubName} membership terms
                    </Box>
                    .
                  </Box>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={!canSubmit || submitting}
                sx={{
                  py: 1.5,
                  mt: 0.5,
                  fontFamily: 'var(--font-body)',
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(26, 111, 196, 0.22)',
                    color: 'rgba(255,255,255,0.28)',
                    boxShadow: 'none',
                  },
                }}
              >
                {submitting ? 'Creating account…' : 'Create account'}
              </Button>
            </Stack>
          </Box>

        </div>
      </div>
    </div>
  )
}
