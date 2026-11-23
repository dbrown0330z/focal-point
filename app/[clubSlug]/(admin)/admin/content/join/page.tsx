import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import JoinPageEditor, { type DuesSummary } from './JoinPageEditor'
import type { ManualMethod } from '@/app/[clubSlug]/(admin)/admin/dues-payment/actions'

export const dynamic = 'force-dynamic'

export default async function AdminJoinPage() {
  const admin    = createServiceClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any
  const ctx    = await getClubContext()
  const clubId = ctx?.clubId

  const [pageResult, settingsResult] = await Promise.all([
    clubId
      ? (adminAny.from('pages').select('id, content').eq('slug', 'join-renew').eq('club_id', clubId).maybeSingle() as Promise<{ data: { id: string; content: string | null } | null }>)
      : Promise.resolve({ data: null }),
    clubId
      ? admin.from('club_settings').select(
          'dues_annual_standard, dues_manual_methods, dues_cheque_payable_to, dues_cheque_mail_to, dues_etransfer_email, dues_paypal_link, dues_venmo_handle, dues_cashapp_handle, dues_zelle_contact'
        ).eq('club_id', clubId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const s = settingsResult.data
  const enabledMethods = (s?.dues_manual_methods ?? []) as ManualMethod[]
  const annualAmount   = s?.dues_annual_standard ? parseFloat(String(s.dues_annual_standard)) : null

  const duesSummary: DuesSummary = {
    annualAmount: annualAmount && annualAmount > 0 ? annualAmount : null,
    methods: enabledMethods,
    chequePayableTo:  s?.dues_cheque_payable_to  ?? null,
    chequeMail:       s?.dues_cheque_mail_to      ?? null,
    etransferEmail:   s?.dues_etransfer_email     ?? null,
    paypalLink:       s?.dues_paypal_link         ?? null,
    venmoHandle:      s?.dues_venmo_handle        ?? null,
    cashappHandle:    s?.dues_cashapp_handle      ?? null,
    zelleContact:     s?.dues_zelle_contact       ?? null,
  }

  return (
    <JoinPageEditor
      pageId={pageResult.data?.id ?? null}
      initialContent={pageResult.data?.content ?? '<p>Welcome! We\'d love to have you as a member of our club. Here\'s everything you need to know about joining or renewing your membership.</p>'}
      clubSlug={ctx?.clubSlug ?? ''}
      duesSummary={duesSummary}
    />
  )
}
