import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type DuesSettings = {
  club_name:              string
  dues_manual_methods:    string[] | null
  dues_cheque_payable_to: string | null
  dues_cheque_mail_to:    string | null
  dues_etransfer_email:   string | null
  dues_paypal_link:       string | null
  dues_venmo_handle:      string | null
  dues_cashapp_handle:    string | null
  dues_zelle_contact:     string | null
  dues_annual_standard:   number | null
  join_open:              boolean
}

function PaymentMethodCard({
  title,
  description,
  instructions,
  linkHref,
  linkLabel,
}: {
  title:        string
  description:  string
  instructions: string
  linkHref?:    string
  linkLabel?:   string
}) {
  return (
    <div style={{
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      background: 'var(--surface-2)',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </p>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {description}
      </p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
        {instructions}
        {linkHref && linkLabel && (
          <>
            {' '}
            <a
              href={linkHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--action-primary)', textDecoration: 'underline' }}
            >
              {linkLabel}
            </a>
          </>
        )}
      </p>
    </div>
  )
}

export default async function JoinPage() {
  const admin = createServiceClient()
  const ctx   = await getClubContext()
  const clubId   = ctx?.clubId
  const clubSlug = ctx?.clubSlug ?? ''

  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = Boolean(user)

  const [{ data: pageRaw }, { data: settingsRaw }] = await Promise.all([
    clubId
      ? (admin.from('pages').select('content').eq('slug', 'join-renew').eq('club_id', clubId).maybeSingle() as unknown as Promise<{ data: { content: string | null } | null }>)
      : Promise.resolve({ data: null }),
    clubId
      ? (admin.from('club_settings').select('club_name, dues_manual_methods, dues_cheque_payable_to, dues_cheque_mail_to, dues_etransfer_email, dues_paypal_link, dues_venmo_handle, dues_cashapp_handle, dues_zelle_contact, dues_annual_standard, join_open').eq('club_id', clubId).single() as unknown as Promise<{ data: DuesSettings | null }>)
      : Promise.resolve({ data: null }),
  ])

  const html         = pageRaw?.content ?? null
  const settings     = settingsRaw
  const methods      = (settings?.dues_manual_methods ?? []) as string[]
  const annualDues   = settings?.dues_annual_standard
  const joinOpen     = settings?.join_open ?? true

  const paymentCards: React.ReactNode[] = []

  if (methods.includes('paypal-link') && settings?.dues_paypal_link) {
    paymentCards.push(
      <PaymentMethodCard
        key="paypal"
        title="PayPal"
        description="Send payment via PayPal — no account required to pay with a credit or debit card."
        instructions={`Click the link to send your dues payment via PayPal.`}
        linkHref={settings.dues_paypal_link}
        linkLabel="Pay with PayPal"
      />
    )
  }

  if (methods.includes('venmo') && settings?.dues_venmo_handle) {
    paymentCards.push(
      <PaymentMethodCard
        key="venmo"
        title="Venmo"
        description="Send payment using the Venmo app. A Venmo account is required."
        instructions={`Open the Venmo app and send payment to ${settings.dues_venmo_handle}.`}
      />
    )
  }

  if (methods.includes('cashapp') && settings?.dues_cashapp_handle) {
    paymentCards.push(
      <PaymentMethodCard
        key="cashapp"
        title="Cash App"
        description="Send payment using the Cash App. A Cash App account is required."
        instructions={`Open the Cash App and send payment to ${settings.dues_cashapp_handle}.`}
      />
    )
  }

  if (methods.includes('zelle') && settings?.dues_zelle_contact) {
    paymentCards.push(
      <PaymentMethodCard
        key="zelle"
        title="Zelle"
        description="Send payment via Zelle through your bank app. A bank account with Zelle is required."
        instructions={`Send your payment via Zelle to ${settings.dues_zelle_contact}.`}
      />
    )
  }

  if (methods.includes('cheque') && (settings?.dues_cheque_payable_to || settings?.dues_cheque_mail_to)) {
    const payableTo  = settings?.dues_cheque_payable_to
    const mailTo     = settings?.dues_cheque_mail_to
    let instructions = 'Make your check payable to'
    if (payableTo) instructions += ` ${payableTo}`
    if (payableTo && mailTo) instructions += '.'
    if (mailTo) instructions += ` Mail to: ${mailTo}.`
    paymentCards.push(
      <PaymentMethodCard
        key="cheque"
        title="Check"
        description="Mail a personal check to the club."
        instructions={instructions}
      />
    )
  }

  if (methods.includes('etransfer') && settings?.dues_etransfer_email) {
    paymentCards.push(
      <PaymentMethodCard
        key="etransfer"
        title="Interac e-Transfer"
        description="Send an e-Transfer through your Canadian bank's online banking. No registration required by the recipient."
        instructions={`Send your e-Transfer to ${settings.dues_etransfer_email}.`}
      />
    )
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{
        fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
        color: 'var(--text-primary)', margin: '0 0 24px',
      }}>
        Join / Renew
      </h1>

      {/* Custom intro block */}
      {html && (
        <div
          dangerouslySetInnerHTML={{ __html: html }}
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: 'var(--text-primary)',
            marginBottom: 32,
          }}
        />
      )}

      {/* Dues amount */}
      {annualDues && (
        <div style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Annual membership dues</span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            ${annualDues.toFixed(2)}
          </span>
        </div>
      )}

      {/* Payment methods */}
      {paymentCards.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 600, color: 'var(--text-primary)',
            margin: '0 0 12px', letterSpacing: '-0.01em',
          }}>
            How to pay
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {paymentCards}
          </div>
        </div>
      )}

      {/* CTA — only for anonymous visitors */}
      {joinOpen && !isLoggedIn && (
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <p style={{ margin: 0, fontSize: 15, color: 'var(--text-secondary)' }}>
            Ready to become a member?
          </p>
          <Link
            href={`/${clubSlug}/apply`}
            style={{
              display: 'inline-block',
              background: 'var(--action-primary)',
              color: 'white',
              padding: '10px 24px',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Apply to join
          </Link>
        </div>
      )}
    </div>
  )
}
