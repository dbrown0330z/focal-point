'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { saveDuesConfig, type DiscountCategory, type ManualMethod } from './actions'
import { useUnsavedChanges } from '@/components/admin/UnsavedChangesProvider'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GracePeriodMode = 'none' | '7' | '30' | 'custom'

function daysToMode(days: number | null): GracePeriodMode {
  if (!days) return 'none'
  if (days === 7) return '7'
  if (days === 30) return '30'
  return 'custom'
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

// ─── Payment method definitions (ordered by likelihood of use) ────────────────

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
    value:       'paypal-link',
    label:       'PayPal',
    region:      'Worldwide',
    description: 'Members visit your PayPal.me link in a browser or the PayPal app to send payment. A PayPal account is required.',
    fieldLabel:  'Your PayPal.me link or username',
    placeholder: 'paypal.me/yourclub',
  },
  {
    value:       'venmo',
    label:       'Venmo',
    region:      'US',
    description: 'Members open the Venmo app, search for your handle, and send payment. A Venmo account is required.',
    fieldLabel:  'Your Venmo handle',
    placeholder: '@yourclubname',
  },
  {
    value:       'cashapp',
    label:       'Cash App',
    region:      'US',
    description: 'Members open Cash App and send payment to your $Cashtag. A Cash App account is required.',
    fieldLabel:  'Your $Cashtag',
    placeholder: '$yourclubname',
  },
  {
    value:       'zelle',
    label:       'Zelle',
    region:      'US',
    description: 'Members open their bank app, find Zelle, and send payment to your email or phone. No separate account needed — built into most US banks.',
    fieldLabel:  'Email or phone number',
    placeholder: 'treasurer@yourclub.com',
  },
  {
    value:       'cheque',
    label:       'Check',
    region:      'All',
    description: 'Members write a check and mail it to your club. No account required.',
    fieldLabel:  '',
    placeholder: '',
  },
  {
    value:       'etransfer',
    label:       'Interac e-Transfer',
    region:      'Canada',
    description: 'Members log into their online banking and send an e-Transfer to your email. No separate account needed — available through all major Canadian banks.',
    fieldLabel:  'Email to receive transfers',
    placeholder: 'treasurer@yourclub.ca',
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function Card({ children, sx }: { children: React.ReactNode; sx?: object }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: '20px 22px', mb: 2.5, ...sx }}>
      {children}
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
      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#26374C', textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1.5 }}>
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

// ─── Member preview panel ─────────────────────────────────────────────────────

type PreviewProps = {
  enabledMethods:  ManualMethod[]
  chequePayableTo: string
  chequeMail:      string
  etransferEmail:  string
  paypalLink:      string
  venmoHandle:     string
  cashappHandle:   string
  zelleContact:    string
  annualStandard:  string
}

function MemberPreview({ enabledMethods, chequePayableTo, chequeMail, etransferEmail, paypalLink, venmoHandle, cashappHandle, zelleContact, annualStandard }: PreviewProps) {
  const hasAny = enabledMethods.length > 0

  const methodDetails: Record<ManualMethod, { label: string; instruction: string; extra?: string }> = {
    'paypal-link': {
      label:       'PayPal',
      instruction: paypalLink
        ? `Visit ${paypalLink} in a browser or the PayPal app. A PayPal account is required.`
        : 'Visit your PayPal.me link in a browser or the PayPal app. A PayPal account is required.',
    },
    'venmo': {
      label:       'Venmo',
      instruction: venmoHandle
        ? `Open the Venmo app and search for ${venmoHandle}. A Venmo account is required.`
        : 'Open the Venmo app and search for your club handle. A Venmo account is required.',
    },
    'cashapp': {
      label:       'Cash App',
      instruction: cashappHandle
        ? `Open Cash App and send payment to ${cashappHandle}. A Cash App account is required.`
        : 'Open Cash App and send payment to the club $Cashtag. A Cash App account is required.',
    },
    'zelle': {
      label:       'Zelle',
      instruction: zelleContact
        ? `Open your bank app, find Zelle, and send payment to ${zelleContact}.`
        : 'Open your bank app, find Zelle, and send payment to the club email or phone number.',
    },
    'cheque': {
      label:       'Check',
      instruction: chequePayableTo
        ? `Write a check payable to "${chequePayableTo}" and mail it to:`
        : 'Write a check payable to the club and mail it to:',
      extra: chequeMail || undefined,
    },
    'etransfer': {
      label:       'Interac e-Transfer',
      instruction: etransferEmail
        ? `Log in to your online banking and send an Interac e-Transfer to ${etransferEmail}.`
        : 'Log in to your online banking and send an Interac e-Transfer to the club email address.',
    },
  }

  return (
    <Box sx={{
      position: 'sticky', top: 24,
      border: '1px solid', borderColor: 'divider',
      borderRadius: 2, overflow: 'hidden',
    }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.25, bgcolor: 'rgba(0,0,0,0.03)', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Member view preview
        </Typography>
      </Box>

      {/* Preview card */}
      <Box sx={{ p: 2.5, bgcolor: 'background.paper' }}>
        {!hasAny ? (
          <Typography sx={{ fontSize: 13, color: 'text.secondary', fontStyle: 'italic' }}>
            Select payment methods to see how they&apos;ll appear to members.
          </Typography>
        ) : (
          <>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
              How to pay your dues
            </Typography>
            {annualStandard && (
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2 }}>
                Annual membership: ${annualStandard}/year
              </Typography>
            )}
            <Stack spacing={1.5}>
              {enabledMethods.map(m => {
                const { label, instruction, extra } = methodDetails[m]
                return (
                  <Box key={m}>
                    <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{label}</Typography>
                    <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.25, lineHeight: 1.5 }}>{instruction}</Typography>
                    {extra && (
                      <Typography sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'pre-line', mt: 0.25 }}>{extra}</Typography>
                    )}
                  </Box>
                )
              })}
            </Stack>
            <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              Once payment is received, your membership will be activated by the club administrator.
            </Typography>
          </>
        )}
      </Box>
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
  initialCashappHandle:      string | null
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
  initialCashappHandle,
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
  const [activeTab, setActiveTab] = useState(0)
  const { isDirty, markDirty, markClean, registerSave } = useUnsavedChanges()

  // Payment methods (multi-select)
  const [enabledMethods,  setEnabledMethods]  = useState<ManualMethod[]>(initialEnabledMethods)
  const [chequePayableTo, setChequePayableTo] = useState(initialChequePayableTo ?? '')
  const [chequeMail,      setChequeMail]      = useState(initialChequeMail ?? '')
  const [etransferEmail,  setEtransferEmail]  = useState(initialEtransferEmail ?? '')
  const [paypalLink,      setPaypalLink]      = useState(initialPaypalLink ?? '')
  const [venmoHandle,     setVenmoHandle]     = useState(initialVenmoHandle ?? '')
  const [cashappHandle,   setCashappHandle]   = useState(initialCashappHandle ?? '')
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
  const [prorate,        setProrate]        = useState(initialProrate)
  const [exemptHonorary, setExemptHonorary] = useState(initialExemptHonorary)

  // One-time fees
  const [onetimefeesEnabled, setOnetimefeesEnabled] = useState(initialOnetimefeesEnabled)
  const [applicationFee,     setApplicationFee]     = useState(initialApplicationFee?.toString() ?? '')
  const [joinFee,            setJoinFee]            = useState(initialJoinFee?.toString() ?? '')

  function mark<T>(setter: (v: T) => void): (v: T) => void {
    return (v: T) => { setter(v); markDirty() }
  }
  function markFn<T>(setter: React.Dispatch<React.SetStateAction<T>>): React.Dispatch<React.SetStateAction<T>> {
    return (v) => { setter(v); markDirty() }
  }

  function toggleMethod(method: ManualMethod, checked: boolean) {
    markDirty()
    setEnabledMethods(prev => checked ? [...prev, method] : prev.filter(m => m !== method))
  }

  // Validation: each selected method must have its required field filled
  const methodFieldMap: Partial<Record<ManualMethod, string>> = {
    'paypal-link': paypalLink,
    'venmo':       venmoHandle,
    'cashapp':     cashappHandle,
    'zelle':       zelleContact,
    'etransfer':   etransferEmail,
    'cheque':      chequePayableTo,
  }
  const missingFields = enabledMethods.filter(m => !(methodFieldMap[m] ?? '').trim())
  const hasValidationErrors = missingFields.length > 0

  // Save
  const [saving, startSave]         = useTransition()
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle')
  const handleSaveRef = useRef(handleSave)
  useEffect(() => { handleSaveRef.current = handleSave })
  useEffect(() => { registerSave(() => handleSaveRef.current()) }, [registerSave])

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
        cashappHandle:    enabledMethods.includes('cashapp')     ? cashappHandle || null : null,
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
      if (!result.error) markClean()
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

  return (
    <Box sx={{ pb: '80px' }}>

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h1" sx={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'text.primary' }}>
          Dues &amp; Payments
        </Typography>
        <Typography sx={{ mt: 0.5, fontSize: 13, color: 'text.secondary' }}>
          Configure membership fees and how members pay.
        </Typography>
      </Box>

      {/* ── Tabs ──────────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        sx={{ mb: 4, borderBottom: '1px solid', borderColor: 'divider' }}
      >
        <Tab label="Member Dues" sx={{ textTransform: 'none' }} />
        <Tab label="Payment Methods" sx={{ textTransform: 'none' }} />
      </Tabs>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 0 — MEMBER DUES
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <Box sx={{ maxWidth: 640 }}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#131F2E' }}>Annual dues</Typography>
            </Box>

            {enabledMethods.length === 0 && (
              <Alert severity="warning" sx={{ mb: 2, py: 0.5, fontSize: 13 }}>
                No payment methods configured yet.{' '}
                <Box component="span"
                  onClick={() => setActiveTab(1)}
                  sx={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Set them up on the Payment Methods tab.
                </Box>
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
                size="small" displayEmpty
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
                  onChange={e => mark(setGracePeriodMode)(e.target.value as GracePeriodMode)}
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
                      onChange={e => { if (/^\d*$/.test(e.target.value)) mark(setGracePeriodCustom)(e.target.value) }}
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
                          <Typography sx={{ fontSize: 13, flex: 1 }}>{label}</Typography>
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
                          size="small" fullWidth value={newCatLabel}
                          onChange={e => setNewCatLabel(e.target.value)}
                          placeholder="e.g. Senior (65+)"
                          onKeyDown={e => e.key === 'Enter' && addCategory()}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <FieldLabel>Discount ($)</FieldLabel>
                        <TextField
                          size="small" fullWidth value={newCatAmount}
                          onChange={e => setNewCatAmount(e.target.value)}
                          placeholder="e.g. 20"
                          slotProps={{ input: { inputMode: 'decimal' } }}
                          onKeyDown={e => e.key === 'Enter' && addCategory()}
                        />
                      </Box>
                      <Button variant="outlined" color="secondary" size="small" onClick={addCategory} sx={{ mb: '1px' }}>Add</Button>
                    </Box>
                  </Box>
                )}
                <ToggleRow label="Pro-rate dues for mid-year joiners"  checked={prorate}        onChange={mark(setProrate)} />
                <ToggleRow label="Exempt honorary / lifetime members"  checked={exemptHonorary} onChange={mark(setExemptHonorary)} />
              </Stack>
            </SubSection>
          </Card>

          {/* One-time fees */}
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#131F2E' }}>Application &amp; join fees</Typography>
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mt: 0.5 }}>
                  Optional one-time fees charged when a new member joins.
                </Typography>
              </Box>
              <Switch checked={onetimefeesEnabled} onChange={e => mark(setOnetimefeesEnabled)(e.target.checked)} />
            </Box>
            {onetimefeesEnabled && (
              <Box sx={{ mt: 2.5 }}>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <FieldLabel>Application fee ($/member)</FieldLabel>
                    <TextField
                      size="small" fullWidth value={applicationFee}
                      onChange={e => mark(setApplicationFee)(e.target.value)}
                      placeholder="0.00"
                      slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography>, inputMode: 'decimal' } }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <FieldLabel>Join / initiation fee ($/member)</FieldLabel>
                    <TextField
                      size="small" fullWidth value={joinFee}
                      onChange={e => mark(setJoinFee)(e.target.value)}
                      placeholder="0.00"
                      slotProps={{ input: { startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography>, inputMode: 'decimal' } }}
                    />
                  </Box>
                </Box>
              </Box>
            )}
          </Card>
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1 — PAYMENT METHODS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', maxWidth: 920 }}>

          {/* ── Left: method selection ──────────────────────────────────── */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Card sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: 15, fontWeight: 600, mb: 0.5, color: '#131F2E' }}>Members pay you directly</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 2.5 }}>
                Members send payment using their own bank or app. You confirm receipt and activate their membership manually in the Members section.
              </Typography>

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
                          borderRadius: 1.5, cursor: 'pointer',
                        }}
                        onClick={() => toggleMethod(method.value, !enabled)}
                      >
                        <Checkbox
                          checked={enabled} size="small"
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

                      {/* Config fields */}
                      {enabled && method.value !== 'cheque' && (
                        <Box sx={{ mt: 1, px: 0.5 }}>
                          <FieldLabel>{method.fieldLabel}</FieldLabel>
                          <TextField
                            size="small" fullWidth
                            value={
                              method.value === 'etransfer' ? etransferEmail :
                              method.value === 'zelle'     ? zelleContact :
                              method.value === 'venmo'     ? venmoHandle :
                              method.value === 'cashapp'   ? cashappHandle :
                              paypalLink
                            }
                            onChange={e => {
                              if (method.value === 'etransfer')      mark(setEtransferEmail)(e.target.value)
                              else if (method.value === 'zelle')     mark(setZelleContact)(e.target.value)
                              else if (method.value === 'venmo')     mark(setVenmoHandle)(e.target.value)
                              else if (method.value === 'cashapp')   mark(setCashappHandle)(e.target.value)
                              else                                   mark(setPaypalLink)(e.target.value)
                            }}
                            placeholder={method.placeholder}
                          />
                        </Box>
                      )}
                      {enabled && method.value === 'cheque' && (
                        <Box sx={{ mt: 1, px: 0.5, display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <FieldLabel>Check payable to</FieldLabel>
                            <TextField size="small" fullWidth value={chequePayableTo}
                              onChange={e => mark(setChequePayableTo)(e.target.value)}
                              placeholder="e.g. Riverside Camera Club" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <FieldLabel>Mail checks to</FieldLabel>
                            <TextField size="small" fullWidth value={chequeMail}
                              onChange={e => mark(setChequeMail)(e.target.value)}
                              placeholder="123 Main St, City, Province"
                              multiline minRows={2} />
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )
                })}
              </Stack>

              {/* Coming soon: integrated gateways */}
              <SubSection label="Members pay on this site — coming soon">
                <Typography sx={{ fontSize: 13, color: 'text.secondary', mb: 1.5 }}>
                  Card payments processed directly on your site — no manual confirmation needed.
                </Typography>
                <Stack spacing={1}>
                  {[
                    { label: 'Stripe',          sub: 'All major credit and debit cards' },
                    { label: 'PayPal Checkout', sub: 'PayPal, Venmo (US), credit cards' },
                  ].map(({ label, sub }) => (
                    <Box key={label} sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 1.5, py: 1.25, border: '1.5px solid', borderColor: 'divider',
                      borderRadius: 1.5, opacity: 0.6,
                    }}>
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
          </Box>

          {/* ── Right: live preview ─────────────────────────────────────── */}
          <Box sx={{ width: 268, flexShrink: 0 }}>
            <MemberPreview
              enabledMethods={enabledMethods}
              chequePayableTo={chequePayableTo}
              chequeMail={chequeMail}
              etransferEmail={etransferEmail}
              paypalLink={paypalLink}
              venmoHandle={venmoHandle}
              cashappHandle={cashappHandle}
              zelleContact={zelleContact}
              annualStandard={annualStandard}
            />
          </Box>
        </Box>
      )}

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
          <Button variant="contained" size="small" disabled={!isDirty || saving || hasValidationErrors} onClick={handleSave} sx={{ fontSize: '18px' }}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
          {hasValidationErrors && isDirty && (
            <Alert severity="warning" sx={{ py: 0, px: 1.5 }}>Fill in the required field for each selected payment method</Alert>
          )}
          {saveStatus === 'saved' && !isDirty && <Alert severity="success" sx={{ py: 0, px: 1.5 }}>Settings saved</Alert>}
          {saveStatus === 'error'  && <Alert severity="error"   sx={{ py: 0, px: 1.5 }}>Save failed — please try again</Alert>}
        </Box>
      </Box>

    </Box>
  )
}
