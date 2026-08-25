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
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-status-success-bg">
            {requiresVerification ? (
              <svg className="h-7 w-7 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="h-7 w-7 text-status-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        {requiresVerification ? (
          <>
            <h2 className="text-xl font-semibold text-content-primary mb-2">Check your email</h2>
            <p className="text-content-secondary leading-relaxed mb-2">
              We sent a verification link to <strong>{email}</strong>.
            </p>
            <p className="text-content-secondary leading-relaxed">
              Click the link in that email to verify your address and complete your registration with {clubName}.
            </p>
            <p className="mt-4 text-sm text-content-secondary">
              Didn't receive it? Check your spam folder, or contact the club if you need help.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-content-primary mb-2">Application submitted</h2>
            <p className="text-content-secondary leading-relaxed mb-2">
              Thanks for applying to {clubName}.
            </p>
            <p className="text-content-secondary leading-relaxed">
              A club admin will review your application and you'll receive an email at <strong>{email}</strong> once you've been approved.
            </p>
            <p className="mt-8 text-content-secondary text-sm">
              <Link href={clubSlug ? `/${clubSlug}` : '/'} className="font-medium text-action-primary hover:underline">
                View your application status
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
