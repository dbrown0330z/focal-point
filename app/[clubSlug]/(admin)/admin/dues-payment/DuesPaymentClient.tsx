'use client'

import { useState, useTransition } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { saveDuesConfig, type DiscountCategory } from './actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GracePeriodMode = 'none' | '7' | '30' | 'custom'
type PaymentMethod   = 'cheque' | 'digital-transfer' | 'cash' | 'stripe' | 'paypal'

function daysToMode(days: number | null): GracePeriodMode {
  if (!days) return 'none'
  if (days === 7) return '7'
  if (days === 30) return '30'
  return 'custom'
}

function modeToPaymentMethod(
  duesMode: 'stripe' | 'paypal' | 'offline' | null,
  offlineMethod: 'cheque' | 'digital-transfer' | 'cash' | null,
): PaymentMethod | null {
  if (duesMode === 'stripe') return 'stripe'
  if (duesMode === 'paypal') return 'paypal'
  if (duesMode === 'offline' && offlineMethod) return offlineMethod
  return null
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageSection({ children }: { children: React.ReactNode }) {
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
        <Chip label={chip} size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#D8DDE7', color: '#3E5066' }} />
      )}
    </Box>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 0.5 }}>{children}</Typography>
  )
}

function SubSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box>
      <Divider sx={{ my: 2 }} />
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
        {label}
      </Typography>
      {children}
    </Box>
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

// ─── Payment method options ───────────────────────────────────────────────────

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; sub: string }[] = [
  { value: 'cheque',           label: 'Cheque',           sub: 'Members mail a cheque to your club' },
  { value: 'digital-transfer', label: 'Digital transfer', sub: 'Venmo, Zelle, PayPal, Interac e-Transfer' },
  { value: 'cash',             label: 'Cash',             sub: 'Collected in person at meetings' },
  { value: 'stripe',           label: 'Stripe',           sub: 'Online card payments — coming soon' },
  { value: 'paypal',           label: 'PayPal',           sub: 'Online card payments — coming soon' },
]

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initialDuesMode:           'stripe' | 'paypal' | 'offline' | null
  initialOfflineMethod:      'cheque' | 'digital-transfer' | 'cash' | null
  initialChequePayableTo:    string | null
  initialChequeMail:         string | null
  initialAnnualStandard:     number | null
  initialRenewalMonth:       number | null
  initialProrate:            boolean
  initialExemptHonorary:     boolean
  initialGracePeriodDays:    number | null
  initialDiscountCategories: DiscountCategory[]
  initialOnetimefeesEnabled: boolean
  initialApplicationFee:     number | null
  initialJoinFee:            number | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DuesPaymentClient({
  initialDuesMode,
  initialOfflineMethod,
  initialChequePayableTo,
  initialChequeMail,
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
  // Payment method
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethod | null>(() => modeToPaymentMethod(initialDuesMode, initialOfflineMethod))
  const [chequePayableTo,  setChequePayableTo]  = useState(initialChequePayableTo ?? '')
  const [chequeMail,       setChequeMail]       = useState(initialChequeMail ?? '')

  // Dues amounts
  const [annualStandard,   setAnnualStandard]   = useState(initialAnnualStandard?.toString() ?? '')
  const [renewalMonth,     setRenewalMonth]     = useState<number | null>(initialRenewalMonth ?? null)

  // Grace period
  const [gracePeriodMode,   setGracePeriodMode]   = useState<GracePeriodMode>(() => daysToMode(initialGracePeriodDays))
  const [gracePeriodCustom, setGracePeriodCustom] = useState(() => {
    const mode = daysToMode(initialGracePeriodDays)
    return mode === 'custom' ? (initialGracePeriodDays?.toString() ?? '') : ''
  })

  // Discount categories
  const [discountCategories,  setDiscountCategories]  = useState<DiscountCategory[]>(initialDiscountCategories)
  const [newCatLabel,         setNewCatLabel]         = useState('')
  const [newCatAmount,        setNewCatAmount]        = useState('')

  // Additional settings
  const [prorate,            setProrate]           = useState(initialProrate)
  const [exemptHonorary,     setExemptHonorary]    = useState(initialExemptHonorary)

  // One-time fees
  const [onetimefeesEnabled, setOnetimefeesEnabled] = useState(initialOnetimefeesEnabled)
  const [applicationFee,     setApplicationFee]     = useState(initialApplicationFee?.toString() ?? '')
  const [joinFee,            setJoinFee]            = useState(initialJoinFee?.toString() ?? '')

  // Dirty tracking
  const [isDirty, setIsDirty] = useState(false)

  function mark<T>(setter: (v: T) => void): (v: T) => void {
    return (v: T) => { setter(v); setIsDirty(true) }
  }
  function markFn<T>(setter: React.Dispatch<React.SetStateAction<T>>): React.Dispatch<React.SetStateAction<T>> {
    return (v) => { setter(v); setIsDirty(true) }
  }

  // Save
  const [saving, startSave]       = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')

  function getGracePeriodDays(): number | null {
    if (gracePeriodMode === 'none') return null
    if (gracePeriodMode === '7')    return 7
    if (gracePeriodMode === '30')   return 30
    return gracePeriodCustom ? parseInt(gracePeriodCustom, 10) : null
  }

  function getDuesMode(): 'stripe' | 'paypal' | 'offline' | null {
    if (paymentMethod === 'stripe') return 'stripe'
    if (paymentMethod === 'paypal') return 'paypal'
    if (paymentMethod)              return 'offline'
    return null
  }

  function getOfflineMethod(): 'cheque' | 'digital-transfer' | 'cash' | null {
    if (paymentMethod === 'cheque' || paymentMethod === 'digital-transfer' || paymentMethod === 'cash') {
      return paymentMethod
    }
    return null
  }

  function handleSave() {
    setSaveStatus('idle')
    startSave(async () => {
      const result = await saveDuesConfig({
        duesMode:           getDuesMode(),
        offlineMethod:      getOfflineMethod(),
        chequePayableTo:    paymentMethod === 'cheque' ? chequePayableTo || null : null,
        chequeMail:         paymentMethod === 'cheque' ? chequeMail || null : null,
        annualStandard:     annualStandard ? parseFloat(annualStandard) : null,
        renewalMonth,
        prorate,
        exemptHonorary,
        gracePeriodDays:    getGracePeriodDays(),
        discountCategories,
        onetimefeesEnabled,
        applicationFee:     applicationFee ? parseFloat(applicationFee) : null,
        joinFee:            joinFee ? parseFloat(joinFee) : null,
      })
      setSaveStatus(result.error ? 'error' : 'saved')
      if (!result.error) setIsDirty(false)
    })
  }

  function addCategory() {
    if (!newCatLabel.trim()) return
    markFn(setDiscountCategories)(prev => [...prev, { label: newCatLabel.trim(), amount: newCatAmount ? parseFloat(newCatAmount) : null }])
    setNewCatLabel('')
    setNewCatAmount('')
  }

  function removeCategory(index: number) {
    markFn(setDiscountCategories)(prev => prev.filter((_, i) => i !== index))
  }

  const noPaymentMethod = paymentMethod === null

  return (
    <Box sx={{ pb: '80px', maxWidth: 640 }}>

      {/* ── Payment collection ──────────────────────────────────────────────── */}
      <PageSection>Payment collection</PageSection>

      <Card>
        <CardHeader title="How will members pay?" />
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
          Choose how members pay their dues. You can change this at any time.
        </Typography>

        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
          {PAYMENT_OPTIONS.map(({ value, label, sub }) => {
            const active = paymentMethod === value
            const comingSoon = value === 'stripe' || value === 'paypal'
            return (
              <Box
                key={value}
                onClick={() => { mark(setPaymentMethod)(value) }}
                sx={{
                  px: 2, py: 1.25, borderRadius: 1.5, border: '1.5px solid',
                  borderColor: active ? 'primary.main' : 'divider',
                  bgcolor: active ? 'rgba(30,77,140,0.05)' : 'transparent',
                  cursor: 'pointer',
                  minWidth: 140,
                  opacity: comingSoon ? 0.65 : 1,
                  '&:hover': { borderColor: comingSoon ? 'divider' : 'primary.main' },
                }}
              >
                <Typography sx={{ fontSize: 13, fontWeight: active ? 600 : 400, color: active ? 'primary.main' : 'text.primary' }}>
                  {label}
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary', mt: 0.25, lineHeight: 1.4 }}>{sub}</Typography>
              </Box>
            )
          })}
        </Box>

        {/* Cheque details */}
        {paymentMethod === 'cheque' && (
          <Box sx={{ mt: 2.5 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Cheque payable to</FieldLabel>
                <TextField
                  size="small" fullWidth
                  value={chequePayableTo}
                  onChange={e => mark(setChequePayableTo)(e.target.value)}
                  placeholder="e.g. Riverside Camera Club"
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Mail to (address)</FieldLabel>
                <TextField
                  size="small" fullWidth
                  value={chequeMail}
                  onChange={e => mark(setChequeMail)(e.target.value)}
                  placeholder="123 Main St, City, Province"
                  multiline
                  minRows={2}
                />
              </Box>
            </Box>
          </Box>
        )}

        {/* Digital transfer note */}
        {paymentMethod === 'digital-transfer' && (
          <Box sx={{ mt: 2, px: 2, py: 1.5, bgcolor: 'rgba(0,0,0,0.03)', borderRadius: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
              Members will see a prompt to contact the club treasurer for payment details. You can add payment instructions to your homepage or club info page.
            </Typography>
          </Box>
        )}
      </Card>

      {/* ── Membership dues ─────────────────────────────────────────────────── */}
      <PageSection>Membership dues</PageSection>

      <Card>
        <CardHeader title="Annual dues" chip="Requires payment gateway" />

        {/* Warning when no payment method is selected */}
        {noPaymentMethod && (
          <Alert severity="warning" sx={{ mb: 2, py: 0.5, fontSize: 13 }}>
            Select a payment collection method above before setting dues amounts — members need to know how to pay.
          </Alert>
        )}

        {/* Dues amounts */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <FieldLabel>Standard member ($/year)</FieldLabel>
            <TextField
              size="small" fullWidth
              value={annualStandard}
              onChange={e => mark(setAnnualStandard)(e.target.value)}
              placeholder="0.00"
              slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography>, inputMode: 'decimal' } }}
            />
          </Box>
          <Box sx={{ flex: 1 }} />
        </Box>

        <SubSection label="Annual renewal month">
          <Select
            size="small"
            displayEmpty
            value={renewalMonth != null ? String(renewalMonth) : ''}
            onChange={e => { const v = e.target.value as string; mark(setRenewalMonth)(v === '' ? null : Number(v)) }}
            sx={{ fontSize: 13, minWidth: 200 }}
          >
            <MenuItem value="" disabled sx={{ fontSize: 13, color: 'text.hint' }}>Select…</MenuItem>
            {MONTHS.map((m, i) => (
              <MenuItem key={m} value={String(i + 1)} sx={{ fontSize: 13 }}>{m}</MenuItem>
            ))}
          </Select>
        </SubSection>

        <SubSection label="Grace period">
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <Select
              size="small"
              value={gracePeriodMode}
              onChange={e => { mark(setGracePeriodMode)(e.target.value as GracePeriodMode) }}
              sx={{ fontSize: 13, minWidth: 160 }}
            >
              <MenuItem value="none"   sx={{ fontSize: 13 }}>None</MenuItem>
              <MenuItem value="7"      sx={{ fontSize: 13 }}>7 days</MenuItem>
              <MenuItem value="30"     sx={{ fontSize: 13 }}>30 days</MenuItem>
              <MenuItem value="custom" sx={{ fontSize: 13 }}>Custom…</MenuItem>
            </Select>
            {gracePeriodMode === 'custom' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  size="small"
                  value={gracePeriodCustom}
                  onChange={e => {
                    if (/^\d*$/.test(e.target.value)) mark(setGracePeriodCustom)(e.target.value)
                  }}
                  placeholder="Days"
                  sx={{ width: 90 }}
                  slotProps={{ input: { inputMode: 'numeric' } }}
                />
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>days</Typography>
              </Box>
            )}
          </Box>
          <Typography sx={{ mt: 1, fontSize: 12, color: 'text.secondary' }}>
            How long after their renewal date a member retains access before their account lapses.
          </Typography>
        </SubSection>

        <SubSection label="Discount categories">
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
                slotProps={{ input: { inputMode: 'decimal' } }}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
              />
            </Box>
            <Button variant="outlined" color="secondary" size="small" onClick={addCategory} sx={{ mb: '1px' }}>
              Add
            </Button>
          </Box>
        </SubSection>

        <SubSection label="Additional settings">
          <Stack spacing={0.75}>
            <ToggleRow label="Pro-rate dues for mid-year joiners"  checked={prorate}       onChange={mark(setProrate)} />
            <ToggleRow label="Exempt honorary / lifetime members"  checked={exemptHonorary} onChange={mark(setExemptHonorary)} />
          </Stack>
        </SubSection>
      </Card>

      {/* ── One-time fees ──────────────────────────────────────────────────── */}
      <PageSection>One-time fees</PageSection>

      <Card>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
                Application &amp; join fees
              </Typography>
              <Chip label="Requires payment gateway" size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#D8DDE7', color: '#3E5066' }} />
            </Box>
            <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
              Optional one-time fees charged when a new member joins.
            </Typography>
          </Box>
          <Switch
            checked={onetimefeesEnabled}
            onChange={e => mark(setOnetimefeesEnabled)(e.target.checked)}
          />
        </Box>

        {onetimefeesEnabled && (
          <Box sx={{ mt: 2.5 }}>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Application fee ($/member)</FieldLabel>
                <TextField
                  size="small" fullWidth
                  value={applicationFee}
                  onChange={e => mark(setApplicationFee)(e.target.value)}
                  placeholder="0.00"
                  slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography>, inputMode: 'decimal' } }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Join / initiation fee ($/member)</FieldLabel>
                <TextField
                  size="small" fullWidth
                  value={joinFee}
                  onChange={e => mark(setJoinFee)(e.target.value)}
                  placeholder="0.00"
                  slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography>, inputMode: 'decimal' } }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Card>

      {/* ── Fixed save bar ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'fixed', bottom: 0, left: 224, right: 0,
        px: 8, py: 2,
        bgcolor: 'background.default',
        borderTop: '1px solid', borderColor: 'divider',
        zIndex: 100,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        <Box sx={{ mx: 'auto', width: '100%', maxWidth: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Button variant="contained" size="small" disabled={!isDirty || saving} onClick={handleSave} sx={{ fontSize: '18px' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {saveStatus === 'saved' && <Alert severity="success" sx={{ py: 0, px: 1.5 }}>Settings saved</Alert>}
          {saveStatus === 'error'  && <Alert severity="error"   sx={{ py: 0, px: 1.5 }}>Save failed — please try again</Alert>}
        </Box>
      </Box>

    </Box>
  )
}
