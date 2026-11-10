'use client'

import { useState, useTransition } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  Checkbox,
  Divider,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { saveDuesConfig, type DiscountCategory, type ManualMethod } from './actions'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GracePeriodMode = 'none' | '7' | '30' | 'custom'

function daysToMode(days: number | null): GracePeriodMode {
  if (!days) return 'none'
  if (days === 7) return '7'
  if (days === 30) return '30'
  return 'custom'
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Payment method definitions ───────────────────────────────────────────────

type MethodDef = {
  value:       ManualMethod
  label:       string
  region:      string
  description: string
  fieldLabel:  string
  placeholder: string
}

const MANUAL_METHODS: MethodDef[] = [
  {
    value:       'etransfer',
    label:       'Interac e-Transfer',
    region:      'Canada',
    description: 'Members send from their bank app to your email address.',
    fieldLabel:  'Email to receive transfers',
    placeholder: 'treasurer@yourclub.ca',
  },
  {
    value:       'zelle',
    label:       'Zelle',
    region:      'US',
    description: 'Members send from their bank app to your email or phone number.',
    fieldLabel:  'Email or phone number',
    placeholder: 'treasurer@yourclub.com',
  },
  {
    value:       'venmo',
    label:       'Venmo',
    region:      'US',
    description: 'Members pay via the Venmo app to your Venmo handle.',
    fieldLabel:  'Your Venmo handle',
    placeholder: '@yourclubname',
  },
  {
    value:       'paypal-link',
    label:       'PayPal',
    region:      'Worldwide',
    description: 'Members pay via their PayPal account using your PayPal.me link.',
    fieldLabel:  'Your PayPal.me link or username',
    placeholder: 'paypal.me/yourclub',
  },
  {
    value:       'cheque',
    label:       'Cheque',
    region:      'All',
    description: 'Members mail a cheque to your club.',
    fieldLabel:  '',
    placeholder: '',
  },
]

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
      <Divider sx={{ mt: 3, mb: 2 }} />
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

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  initialEnabledMethods:     ManualMethod[]
  initialChequePayableTo:    string | null
  initialChequeMail:         string | null
  initialEtransferEmail:     string | null
  initialPaypalLink:         string | null
  initialVenmoHandle:        string | null
  initialZelleContact:       string | null
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
  initialEnabledMethods,
  initialChequePayableTo,
  initialChequeMail,
  initialEtransferEmail,
  initialPaypalLink,
  initialVenmoHandle,
  initialZelleContact,
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
  // Payment methods (multi-select)
  const [enabledMethods,  setEnabledMethods]  = useState<ManualMethod[]>(initialEnabledMethods)
  const [chequePayableTo, setChequePayableTo] = useState(initialChequePayableTo ?? '')
  const [chequeMail,      setChequeMail]      = useState(initialChequeMail ?? '')
  const [etransferEmail,  setEtransferEmail]  = useState(initialEtransferEmail ?? '')
  const [paypalLink,      setPaypalLink]      = useState(initialPaypalLink ?? '')
  const [venmoHandle,     setVenmoHandle]     = useState(initialVenmoHandle ?? '')
  const [zelleContact,    setZelleContact]    = useState(initialZelleContact ?? '')

  // Dues amounts
  const [annualStandard, setAnnualStandard] = useState(initialAnnualStandard?.toString() ?? '')
  const [renewalMonth,   setRenewalMonth]   = useState<number | null>(initialRenewalMonth ?? null)

  // Grace period
  const [gracePeriodMode,   setGracePeriodMode]   = useState<GracePeriodMode>(() => daysToMode(initialGracePeriodDays))
  const [gracePeriodCustom, setGracePeriodCustom] = useState(() => {
    const mode = daysToMode(initialGracePeriodDays)
    return mode === 'custom' ? (initialGracePeriodDays?.toString() ?? '') : ''
  })

  // Discount categories
  const [discountCategoriesEnabled, setDiscountCategoriesEnabled] = useState(initialDiscountCategories.length > 0)
  const [discountCategories,  setDiscountCategories]  = useState<DiscountCategory[]>(initialDiscountCategories)
  const [newCatLabel,         setNewCatLabel]         = useState('')
  const [newCatAmount,        setNewCatAmount]        = useState('')

  // Additional settings
  const [prorate,         setProrate]        = useState(initialProrate)
  const [exemptHonorary,  setExemptHonorary] = useState(initialExemptHonorary)

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

  function toggleMethod(method: ManualMethod, checked: boolean) {
    setIsDirty(true)
    setEnabledMethods(prev =>
      checked ? [...prev, method] : prev.filter(m => m !== method)
    )
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

  function handleSave() {
    setSaveStatus('idle')
    startSave(async () => {
      const result = await saveDuesConfig({
        enabledMethods,
        chequePayableTo:  enabledMethods.includes('cheque')      ? chequePayableTo || null : null,
        chequeMail:       enabledMethods.includes('cheque')      ? chequeMail || null : null,
        etransferEmail:   enabledMethods.includes('etransfer')   ? etransferEmail || null : null,
        paypalLink:       enabledMethods.includes('paypal-link') ? paypalLink || null : null,
        venmoHandle:      enabledMethods.includes('venmo')       ? venmoHandle || null : null,
        zelleContact:     enabledMethods.includes('zelle')       ? zelleContact || null : null,
        annualStandard:   annualStandard ? parseFloat(annualStandard) : null,
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

  const noPaymentMethod = enabledMethods.length === 0

  return (
    <Box sx={{ pb: '80px', maxWidth: 640 }}>

      {/* ── Payment collection ──────────────────────────────────────────────── */}
      <PageSection>Payment collection</PageSection>

      <Card>
        <CardHeader title="How will members pay?" />
        <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5 }}>
          Select all the methods you accept. Members will see payment instructions for each when joining or renewing. You confirm payments manually in the Members section.
        </Typography>

        {/* Manual methods */}
        <Stack spacing={1.5}>
          {MANUAL_METHODS.map(method => {
            const enabled = enabledMethods.includes(method.value)
            return (
              <Box key={method.value}>
                <Box
                  sx={{
                    display: 'flex', alignItems: 'flex-start', gap: 1.25,
                    px: 1.5, pt: 1.25, pb: enabled ? 0.75 : 1.25,
                    border: '1.5px solid',
                    borderColor: enabled ? 'primary.main' : 'divider',
                    bgcolor: enabled ? 'rgba(30,77,140,0.04)' : 'transparent',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleMethod(method.value, !enabled)}
                >
                  <Checkbox
                    checked={enabled}
                    size="small"
                    onChange={e => { e.stopPropagation(); toggleMethod(method.value, e.target.checked) }}
                    sx={{ p: 0, mt: '1px', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 600, color: enabled ? 'primary.main' : 'text.primary' }}>
                        {method.label}
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{method.region}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.4, mt: 0.25 }}>
                      {method.description}
                    </Typography>
                  </Box>
                </Box>

                {/* Config field(s) for this method when enabled */}
                {enabled && method.value !== 'cheque' && (
                  <Box sx={{ mt: 1, px: 0.5 }}>
                    <FieldLabel>{method.fieldLabel}</FieldLabel>
                    <TextField
                      size="small"
                      fullWidth
                      value={
                        method.value === 'etransfer'   ? etransferEmail :
                        method.value === 'zelle'       ? zelleContact :
                        method.value === 'venmo'       ? venmoHandle :
                        paypalLink
                      }
                      onChange={e => {
                        if (method.value === 'etransfer')   mark(setEtransferEmail)(e.target.value)
                        else if (method.value === 'zelle')  mark(setZelleContact)(e.target.value)
                        else if (method.value === 'venmo')  mark(setVenmoHandle)(e.target.value)
                        else                                mark(setPaypalLink)(e.target.value)
                      }}
                      placeholder={method.placeholder}
                      sx={{ bgcolor: 'background.paper' }}
                    />
                  </Box>
                )}
                {enabled && method.value === 'cheque' && (
                  <Box sx={{ mt: 1, px: 0.5, display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <FieldLabel>Cheque payable to</FieldLabel>
                      <TextField
                        size="small" fullWidth
                        value={chequePayableTo}
                        onChange={e => mark(setChequePayableTo)(e.target.value)}
                        placeholder="e.g. Riverside Camera Club"
                        sx={{ bgcolor: 'background.paper' }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <FieldLabel>Mail cheques to</FieldLabel>
                      <TextField
                        size="small" fullWidth
                        value={chequeMail}
                        onChange={e => mark(setChequeMail)(e.target.value)}
                        placeholder="123 Main St, City, Province"
                        multiline minRows={2}
                        sx={{ bgcolor: 'background.paper' }}
                      />
                    </Box>
                  </Box>
                )}
              </Box>
            )
          })}
        </Stack>

        {/* Coming soon: integrated gateways */}
        <SubSection label="Online payments — coming soon">
          <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
            Accept card payments directly on this site with automatic confirmation. No manual tracking needed.
          </Typography>
          <Stack spacing={1}>
            {[
              { label: 'Stripe',          sub: 'All major credit and debit cards' },
              { label: 'PayPal Checkout', sub: 'PayPal, Venmo (US), credit cards' },
            ].map(({ label, sub }) => (
              <Box
                key={label}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 1.5, py: 1.25, border: '1.5px solid', borderColor: 'divider',
                  borderRadius: 1.5, opacity: 0.6,
                }}
              >
                <Checkbox checked={false} size="small" disabled sx={{ p: 0, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.disabled' }}>{label}</Typography>
                  <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.25 }}>{sub}</Typography>
                </Box>
                <Chip label="Coming soon" size="small" sx={{ fontSize: 11, height: 20, bgcolor: '#D8DDE7', color: '#3E5066' }} />
              </Box>
            ))}
          </Stack>
        </SubSection>
      </Card>

      {/* ── Membership dues ─────────────────────────────────────────────────── */}
      <PageSection>Membership dues</PageSection>

      <Card>
        <CardHeader title="Annual dues" />

        {noPaymentMethod && (
          <Alert severity="warning" sx={{ mb: 2, py: 0.5, fontSize: 13 }}>
            Select at least one payment method above — members need to know how to pay before they can join.
          </Alert>
        )}

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

        <SubSection label="Additional settings">
          <Stack spacing={0.75}>
            {/* Discount categories toggle — first */}
            <ToggleRow
              label="Discount categories (seniors, students, etc.)"
              checked={discountCategoriesEnabled}
              onChange={v => { mark(setDiscountCategoriesEnabled)(v); if (!v) markFn(setDiscountCategories)([]) }}
            />
            {discountCategoriesEnabled && (
              <Box sx={{ pl: 1.5, pt: 0.5 }}>
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
              </Box>
            )}
            <ToggleRow label="Pro-rate dues for mid-year joiners"  checked={prorate}        onChange={mark(setProrate)} />
            <ToggleRow label="Exempt honorary / lifetime members"  checked={exemptHonorary} onChange={mark(setExemptHonorary)} />
          </Stack>
        </SubSection>
      </Card>

      {/* ── One-time fees ──────────────────────────────────────────────────── */}
      <PageSection>One-time fees</PageSection>

      <Card>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: 'text.primary' }}>
              Application &amp; join fees
            </Typography>
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
