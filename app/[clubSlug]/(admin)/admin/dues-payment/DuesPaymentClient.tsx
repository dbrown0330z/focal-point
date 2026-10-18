'use client'

import {
  Box,
  Chip,
  Stack,
  Switch,
  Typography,
} from '@mui/material'

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 1.5, mt: '20px' }}>
      {children}
    </Typography>
  )
}

function ComingSoonCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: '20px 22px', mb: 2.5, opacity: 0.55, pointerEvents: 'none', userSelect: 'none' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
          {title}
        </Typography>
        <Chip label="Requires Stripe" size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#D8DDE7', color: '#3E5066' }} />
      </Box>
      <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: children ? 2.5 : 0 }}>
        {description}
      </Typography>
      {children}
    </Box>
  )
}

export default function DuesPaymentClient() {
  return (
    <Box sx={{ pb: '80px', maxWidth: 640 }}>

      {/* ── Payment gateway ────────────────────────────────────────────────── */}
      <SectionTitle>Payment gateway</SectionTitle>

      <ComingSoonCard
        title="Connect Stripe"
        description="Connect your Stripe account to collect dues, application fees, and event payments. Stripe is the only supported payment provider."
      >
        {/* Provider pill */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          {['Stripe', 'PayPal', 'Square'].map((p, i) => (
            <Box key={p} sx={{
              px: 2, py: 1, borderRadius: 1.5, border: '1.5px solid',
              borderColor: i === 0 ? 'primary.main' : 'divider',
              bgcolor: i === 0 ? 'rgba(30,77,140,0.05)' : 'transparent',
            }}>
              <Typography sx={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'primary.main' : 'text.disabled' }}>
                {p}{i > 0 ? ' (not supported)' : ''}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Connect button placeholder */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Box sx={{
            px: 2.5, py: 1.125, borderRadius: 1.25, bgcolor: 'primary.main',
            display: 'inline-flex', alignItems: 'center', gap: 1,
          }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#fff' }}>Connect Stripe account</Typography>
          </Box>
          <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>Not yet connected</Typography>
        </Box>

        {/* Live / Test mode */}
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
          Mode
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
          {['Live', 'Test'].map((m, i) => (
            <Box key={m} sx={{
              px: 2, py: 1, borderRadius: 1.5, border: '1.5px solid',
              borderColor: i === 0 ? 'primary.main' : 'divider',
              bgcolor: i === 0 ? 'rgba(30,77,140,0.05)' : 'transparent',
            }}>
              <Typography sx={{ fontSize: 13, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? 'primary.main' : 'text.secondary' }}>{m}</Typography>
            </Box>
          ))}
        </Box>

        {/* Webhook status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1.25, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#A0A0A0' }} />
          <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Webhook: not configured</Typography>
        </Box>
      </ComingSoonCard>

      {/* ── Membership dues ────────────────────────────────────────────────── */}
      <SectionTitle>Membership dues</SectionTitle>

      <ComingSoonCard
        title="Annual dues"
        description="Configure dues amounts, renewal dates, and discount categories."
      >
        {/* Dues amounts */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Standard member</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1.25, px: 1.5, py: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 0.75 }}>$</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Renewal date</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1.25, px: 1.5, py: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>Jan 1 each year</Typography>
            </Box>
          </Box>
        </Box>

        {/* Discount categories */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Discount categories
          </Typography>
          <Typography sx={{ fontSize: 12, color: 'primary.main', cursor: 'pointer' }}>+ Add category</Typography>
        </Box>
        <Stack spacing={0.75} sx={{ mb: 2.5 }}>
          {[
            { label: 'PSA / CAPA Member', amount: '—' },
            { label: 'Senior (65+)', amount: '—' },
            { label: 'Youth (under 18)', amount: '—' },
            { label: 'Student', amount: '—' },
          ].map(({ label, amount }) => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.25, py: 0.875, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.25 }}>
              <Typography sx={{ fontSize: 13, color: 'text.primary', flex: 1 }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 1 }}>-${amount}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>×</Typography>
            </Box>
          ))}
        </Stack>

        {/* Additional settings */}
        <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
          Additional settings
        </Typography>
        <Stack spacing={0.75}>
          {[
            'Pro-rate dues for mid-year joiners',
            'Exempt honorary / lifetime members',
            'Grace period before membership lapses (days)',
          ].map(label => (
            <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.25 }}>
              <Switch size="small" disabled checked={false} />
              <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{label}</Typography>
            </Box>
          ))}
        </Stack>
      </ComingSoonCard>

      {/* ── One-time fees ──────────────────────────────────────────────────── */}
      <SectionTitle>One-time fees</SectionTitle>

      <ComingSoonCard
        title="Application & join fees"
        description="Optional one-time fees charged when a new member joins. Separate from annual renewal dues."
      >
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Application fee</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1.25, px: 1.5, py: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 0.75 }}>$</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>
            </Box>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>Join / initiation fee</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1.25, px: 1.5, py: 1, bgcolor: 'rgba(0,0,0,0.02)' }}>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 0.75 }}>$</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>—</Typography>
            </Box>
          </Box>
        </Box>
      </ComingSoonCard>

    </Box>
  )
}
