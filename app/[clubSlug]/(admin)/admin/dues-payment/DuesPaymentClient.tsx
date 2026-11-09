'use client'

import { useState, useTransition } from 'react'
import {
  Box,
  Chip,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { saveDuesConfig, type DiscountCategory } from './actions'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 17, fontWeight: 600, color: 'text.primary', mb: 1.5, mt: '20px' }}>
      {children}
    </Typography>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: '20px 22px', mb: 2.5 }}>
      {children}
    </Box>
  )
}

function CardHeader({ title, chip }: { title: string; chip?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
      <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>{title}</Typography>
      {chip && (
        <Chip
          label={chip}
          size="small"
          sx={{ fontSize: 11, height: 20, bgcolor: '#D8DDE7', color: '#3E5066' }}
        />
      )}
    </Box>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>{children}</Typography>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1 }}>
      {children}
    </Typography>
  )
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, px: 1.25, py: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.25 }}>
      <Switch size="small" checked={checked} onChange={e => onChange(e.target.checked)} />
      <Typography sx={{ fontSize: 13, color: 'text.primary' }}>{label}</Typography>
    </Box>
  )
}

function MonthPicker({ value, onChange }: { value: number; onChange: (m: number) => void }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
      {MONTHS.map((m, i) => {
        const month = i + 1
        const active = value === month
        return (
          <Box
            key={m}
            onClick={() => onChange(month)}
            sx={{
              px: 1.25, py: 0.625, borderRadius: 1, border: '1.5px solid',
              borderColor: active ? 'primary.main' : 'divider',
              bgcolor: active ? 'rgba(30,77,140,0.07)' : 'transparent',
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Typography sx={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.secondary' }}>
              {m}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

type Props = {
  initialDuesMode:           'stripe' | 'paypal' | 'offline' | null
  initialAnnualStandard:     number | null
  initialRenewalMonth:       number
  initialProrate:            boolean
  initialExemptHonorary:     boolean
  initialGracePeriodDays:    number | null
  initialDiscountCategories: DiscountCategory[]
  initialOnetimefeesEnabled: boolean
  initialApplicationFee:     number | null
  initialJoinFee:            number | null
}

export default function DuesPaymentClient({
  initialDuesMode,
  initialAnnualStandard,
  initialRenewalMonth,
  initialProrate,
  initialExemptHonorary,
  initialGracePeriodDays,
  initialDiscountCategories,
  initialOnetimefeesEnabled,
  initialApplicationFee,
  initialJoinFee,
}: Props) {
  const [duesMode,            setDuesMode]            = useState(initialDuesMode)
  const [annualStandard,      setAnnualStandard]      = useState(initialAnnualStandard?.toString() ?? '')
  const [renewalMonth,        setRenewalMonth]        = useState(initialRenewalMonth)
  const [prorate,             setProrate]             = useState(initialProrate)
  const [exemptHonorary,      setExemptHonorary]      = useState(initialExemptHonorary)
  const [gracePeriodDays,     setGracePeriodDays]     = useState(initialGracePeriodDays?.toString() ?? '')
  const [discountCategories,  setDiscountCategories]  = useState<DiscountCategory[]>(initialDiscountCategories)
  const [onetimefeesEnabled,  setOnetimefeesEnabled]  = useState(initialOnetimefeesEnabled)
  const [applicationFee,      setApplicationFee]      = useState(initialApplicationFee?.toString() ?? '')
  const [joinFee,             setJoinFee]             = useState(initialJoinFee?.toString() ?? '')

  const [saving, startSave]  = useTransition()
  const [saved,  setSaved]   = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Discount categories editing
  const [newCatLabel,  setNewCatLabel]  = useState('')
  const [newCatAmount, setNewCatAmount] = useState('')

  function addCategory() {
    if (!newCatLabel.trim()) return
    setDiscountCategories(prev => [...prev, { label: newCatLabel.trim(), amount: newCatAmount ? parseFloat(newCatAmount) : null }])
    setNewCatLabel('')
    setNewCatAmount('')
  }

  function removeCategory(index: number) {
    setDiscountCategories(prev => prev.filter((_, i) => i !== index))
  }

  function handleSave() {
    setSaved(false)
    setSaveError(null)
    startSave(async () => {
      const result = await saveDuesConfig({
        duesMode,
        annualStandard:     annualStandard     ? parseFloat(annualStandard)     : null,
        renewalMonth,
        prorate,
        exemptHonorary,
        gracePeriodDays:    gracePeriodDays    ? parseInt(gracePeriodDays, 10)  : null,
        discountCategories,
        onetimefeesEnabled,
        applicationFee:     applicationFee     ? parseFloat(applicationFee)     : null,
        joinFee:            joinFee            ? parseFloat(joinFee)            : null,
      })
      if (result.error) setSaveError(result.error)
      else setSaved(true)
    })
  }

  return (
    <Box sx={{ pb: '80px', maxWidth: 640 }}>

      {/* ── Payment collection method ───────────────────────────────────────── */}
      <SectionTitle>Payment collection</SectionTitle>

      <Card>
        <CardHeader title="How will you collect payments?" />
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
          Choose how members pay their dues and fees. You can connect a payment gateway later, or collect payments offline (cash, cheque, e-transfer).
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5 }}>
          {([
            { value: 'offline', label: 'Offline', sub: 'Cash, cheque, or e-transfer' },
            { value: 'stripe',  label: 'Stripe',  sub: 'Online card payments' },
            { value: 'paypal',  label: 'PayPal',  sub: 'Online card payments' },
          ] as const).map(({ value, label, sub }) => {
            const active = duesMode === value
            return (
              <Box
                key={value}
                onClick={() => setDuesMode(value)}
                sx={{
                  px: 2, py: 1.25, borderRadius: 1.5, border: '1.5px solid',
                  borderColor: active ? 'primary.main' : 'divider',
                  bgcolor: active ? 'rgba(30,77,140,0.05)' : 'transparent',
                  cursor: 'pointer',
                  minWidth: 130,
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary' }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25 }}>{sub}</Typography>
              </Box>
            )
          })}
        </Box>

        {/* Gateway connection — UI only, no live integration yet */}
        {(duesMode === 'stripe' || duesMode === 'paypal') && (
          <Box sx={{ mt: 1, px: 2, py: 1.75, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#A0A0A0', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, color: 'text.secondary', flex: 1 }}>
              {duesMode === 'stripe' ? 'Stripe' : 'PayPal'} connection coming soon — save your selection now and connect when available.
            </Typography>
          </Box>
        )}
      </Card>

      {/* ── Membership dues ────────────────────────────────────────────────── */}
      <SectionTitle>Membership dues</SectionTitle>

      <Card>
        <CardHeader title="Annual dues" chip="Requires payment gateway" />

        <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Standard member ($/year)</FieldLabel>
            <TextField
              size="small"
              fullWidth
              value={annualStandard}
              onChange={e => setAnnualStandard(e.target.value)}
              placeholder="0.00"
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography> } }}
              inputProps={{ inputMode: 'decimal' }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Grace period (days after expiry)</FieldLabel>
            <TextField
              size="small"
              fullWidth
              value={gracePeriodDays}
              onChange={e => setGracePeriodDays(e.target.value)}
              placeholder="e.g. 30"
              inputProps={{ inputMode: 'numeric' }}
            />
          </Box>
        </Box>

        <SectionLabel>Annual renewal month</SectionLabel>
        <Box sx={{ mb: 2.5 }}>
          <MonthPicker value={renewalMonth} onChange={setRenewalMonth} />
        </Box>

        <SectionLabel>Discount categories</SectionLabel>
        <Stack spacing={0.75} sx={{ mb: 1.5 }}>
          {discountCategories.map(({ label, amount }, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.25, py: 0.875, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1.25 }}>
              <Typography sx={{ fontSize: 13, color: 'text.primary', flex: 1 }}>{label}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mr: 0.5 }}>
                {amount != null ? `-$${amount}` : 'no discount'}
              </Typography>
              <IconButton size="small" onClick={() => removeCategory(i)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </IconButton>
            </Box>
          ))}
        </Stack>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <Box sx={{ flex: 2 }}>
            <FieldLabel>Category name</FieldLabel>
            <TextField
              size="small" fullWidth
              value={newCatLabel}
              onChange={e => setNewCatLabel(e.target.value)}
              placeholder="e.g. Senior (65+)"
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Discount ($)</FieldLabel>
            <TextField
              size="small" fullWidth
              value={newCatAmount}
              onChange={e => setNewCatAmount(e.target.value)}
              placeholder="e.g. 20"
              inputProps={{ inputMode: 'decimal' }}
              onKeyDown={e => e.key === 'Enter' && addCategory()}
            />
          </Box>
          <Box
            component="button"
            type="button"
            onClick={addCategory}
            sx={{
              mb: 0, px: 2, py: '7.5px', borderRadius: 1.25, border: '1.5px solid',
              borderColor: 'primary.main', bgcolor: 'transparent',
              color: 'primary.main', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              '&:hover': { bgcolor: 'rgba(30,77,140,0.05)' },
            }}
          >
            Add
          </Box>
        </Box>

        <Box sx={{ mt: 2.5 }}>
          <SectionLabel>Additional settings</SectionLabel>
          <Stack spacing={0.75}>
            <ToggleRow label="Pro-rate dues for mid-year joiners" checked={prorate} onChange={setProrate} />
            <ToggleRow label="Exempt honorary / lifetime members" checked={exemptHonorary} onChange={setExemptHonorary} />
          </Stack>
        </Box>
      </Card>

      {/* ── One-time fees ──────────────────────────────────────────────────── */}
      <SectionTitle>One-time fees</SectionTitle>

      <Card>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
                Application &amp; join fees
              </Typography>
              <Chip
                label="Requires payment gateway"
                size="small"
                sx={{ fontSize: 11, height: 20, bgcolor: '#D8DDE7', color: '#3E5066' }}
              />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
              Optional one-time fees charged when a new member joins.
            </Typography>
          </Box>
          <Switch
            checked={onetimefeesEnabled}
            onChange={e => setOnetimefeesEnabled(e.target.checked)}
          />
        </Box>

        {onetimefeesEnabled && (
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ height: 1, bgcolor: 'divider', mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Application fee ($/member)</FieldLabel>
                <TextField
                  size="small" fullWidth
                  value={applicationFee}
                  onChange={e => setApplicationFee(e.target.value)}
                  placeholder="0.00"
                  slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography> } }}
                  inputProps={{ inputMode: 'decimal' }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Join / initiation fee ($/member)</FieldLabel>
                <TextField
                  size="small" fullWidth
                  value={joinFee}
                  onChange={e => setJoinFee(e.target.value)}
                  placeholder="0.00"
                  slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography> } }}
                  inputProps={{ inputMode: 'decimal' }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Card>

      {/* ── Save ───────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
        <Box
          component="button"
          type="button"
          onClick={handleSave}
          disabled={saving}
          sx={{
            px: 3, py: '9px', borderRadius: 1.5, bgcolor: 'primary.main',
            color: '#fff', fontSize: 14, fontWeight: 600, border: 'none',
            cursor: saving ? 'default' : 'pointer',
            opacity: saving ? 0.7 : 1,
            '&:hover': { bgcolor: '#163A6B' },
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Box>
        {saved && !saving && (
          <Typography sx={{ fontSize: 13, color: 'success.main' }}>Saved</Typography>
        )}
        {saveError && (
          <Typography sx={{ fontSize: 13, color: 'error.main' }}>{saveError}</Typography>
        )}
      </Box>

    </Box>
  )
}
