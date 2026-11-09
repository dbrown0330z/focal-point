'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'

export type DiscountCategory = { label: string; amount: number | null }

export type DuesConfigPayload = {
  duesMode:            'stripe' | 'paypal' | 'offline' | null
  offlineMethod:       'cheque' | 'digital-transfer' | 'cash' | null
  chequePayableTo:     string | null
  chequeMail:          string | null
  annualStandard:      number | null
  renewalMonth:        number | null
  prorate:             boolean
  exemptHonorary:      boolean
  gracePeriodDays:     number | null
  discountCategories:  DiscountCategory[]
  onetimefeesEnabled:  boolean
  applicationFee:      number | null
  joinFee:             number | null
}

export async function saveDuesConfig(payload: DuesConfigPayload): Promise<{ error?: string }> {
  const clubId   = await requireClubId()
  const clubSlug = await requireClubSlug()
  const admin    = createServiceClient()

  if (payload.duesMode !== null) {
    const { error } = await admin
      .from('clubs')
      .update({ dues_mode: payload.duesMode })
      .eq('id', clubId)
    if (error) return { error: error.message }
  }

  const { error } = await admin
    .from('club_settings')
    .update({
      dues_offline_method:       payload.offlineMethod,
      dues_cheque_payable_to:    payload.chequePayableTo,
      dues_cheque_mail_to:       payload.chequeMail,
      dues_annual_standard:      payload.annualStandard,
      dues_renewal_month:        payload.renewalMonth,
      dues_prorate:              payload.prorate,
      dues_exempt_honorary:      payload.exemptHonorary,
      dues_grace_period_days:    payload.gracePeriodDays,
      dues_discount_categories:  payload.discountCategories,
      dues_onetimefees_enabled:  payload.onetimefeesEnabled,
      dues_application_fee:      payload.onetimefeesEnabled ? payload.applicationFee : null,
      dues_join_fee:             payload.onetimefeesEnabled ? payload.joinFee : null,
    })
    .eq('club_id', clubId)

  if (error) return { error: error.message }

  revalidatePath(`/${clubSlug}/admin`, 'layout')
  revalidatePath(`/${clubSlug}/admin/dues-payment`)
  return {}
}
