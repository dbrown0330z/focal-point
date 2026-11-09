'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId, requireClubSlug } from '@/lib/club-context'

export type DiscountCategory = { label: string; amount: number | null }

export type DuesConfigPayload = {
  duesMode:            'stripe' | 'paypal' | 'offline' | null
  annualStandard:      number | null
  renewalMonth:        number
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

  // Save dues_mode to clubs
  if (payload.duesMode !== null) {
    const { error } = await admin
      .from('clubs')
      .update({ dues_mode: payload.duesMode })
      .eq('id', clubId)
    if (error) return { error: error.message }
  }

  // Save all other dues config to club_settings
  const { error } = await admin
    .from('club_settings')
    .update({
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
