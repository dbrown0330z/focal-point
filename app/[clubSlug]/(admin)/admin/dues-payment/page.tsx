import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import DuesPaymentClient from './DuesPaymentClient'

export default async function DuesPaymentPage() {
  const clubId = await requireClubId()
  const admin  = createServiceClient()

  const [{ data: club }, { data: settings }] = await Promise.all([
    admin.from('clubs').select('dues_mode').eq('id', clubId).single(),
    admin.from('club_settings').select(
      'dues_annual_standard, dues_renewal_month, dues_prorate, dues_exempt_honorary,' +
      'dues_grace_period_days, dues_discount_categories,' +
      'dues_onetimefees_enabled, dues_application_fee, dues_join_fee'
    ).eq('club_id', clubId).single(),
  ])

  return (
    <DuesPaymentClient
      initialDuesMode={(club?.dues_mode as 'stripe' | 'paypal' | 'offline' | null) ?? null}
      initialAnnualStandard={settings?.dues_annual_standard ?? null}
      initialRenewalMonth={settings?.dues_renewal_month ?? 1}
      initialProrate={settings?.dues_prorate ?? false}
      initialExemptHonorary={settings?.dues_exempt_honorary ?? false}
      initialGracePeriodDays={settings?.dues_grace_period_days ?? null}
      initialDiscountCategories={(settings?.dues_discount_categories as Array<{ label: string; amount: number | null }>) ?? []}
      initialOnetimefeesEnabled={settings?.dues_onetimefees_enabled ?? false}
      initialApplicationFee={settings?.dues_application_fee ?? null}
      initialJoinFee={settings?.dues_join_fee ?? null}
    />
  )
}
