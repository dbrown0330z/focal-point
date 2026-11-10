import { createServiceClient } from '@/lib/supabase/service'
import { requireClubId } from '@/lib/club-context'
import DuesPaymentClient from './DuesPaymentClient'
import type { ManualMethod } from './actions'

export default async function DuesPaymentPage() {
  const clubId = await requireClubId()
  const admin  = createServiceClient()

  const [{ data: club }, { data: settings }] = await Promise.all([
    admin.from('clubs').select('dues_mode').eq('id', clubId).single(),
    admin.from('club_settings').select('dues_manual_methods, dues_cheque_payable_to, dues_cheque_mail_to, dues_etransfer_email, dues_paypal_link, dues_venmo_handle, dues_cashapp_handle, dues_zelle_contact, dues_annual_standard, dues_renewal_month, dues_prorate, dues_exempt_honorary, dues_grace_period_days, dues_discount_categories, dues_onetimefees_enabled, dues_application_fee, dues_join_fee').eq('club_id', clubId).single(),
  ])

  return (
    <DuesPaymentClient
      initialEnabledMethods={(settings?.dues_manual_methods ?? []) as ManualMethod[]}
      initialChequePayableTo={settings?.dues_cheque_payable_to ?? null}
      initialChequeMail={settings?.dues_cheque_mail_to ?? null}
      initialEtransferEmail={settings?.dues_etransfer_email ?? null}
      initialPaypalLink={settings?.dues_paypal_link ?? null}
      initialVenmoHandle={settings?.dues_venmo_handle ?? null}
      initialCashappHandle={settings?.dues_cashapp_handle ?? null}
      initialZelleContact={settings?.dues_zelle_contact ?? null}
      initialAnnualStandard={settings?.dues_annual_standard ?? null}
      initialRenewalMonth={settings?.dues_renewal_month ?? null}
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
