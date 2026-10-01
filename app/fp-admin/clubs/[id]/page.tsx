import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import ClubDetailClient from './ClubDetailClient'

export const dynamic = 'force-dynamic'

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Auth gate
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createServiceClient()
  const { data: profile } = await admin.from('profiles').select('is_fp_admin').eq('id', user.id).single()
  if (!profile?.is_fp_admin) redirect('/')

  const { data: club } = await (admin as any)
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single()

  if (!club) redirect('/fp-admin/clubs')

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link href="/fp-admin/clubs" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        All clubs
      </Link>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{club.name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">{club.slug}</span>
            {club.location && <span className="ml-2">{club.location}</span>}
          </p>
        </div>
        <StatusBadge status={club.status} />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <Section title="Contact">
          <Row label="Name">{[club.admin_first_name, club.admin_last_name].filter(Boolean).join(' ') || '—'}</Row>
          <Row label="Email">
            <a href={`mailto:${club.contact_email}`} className="text-blue-600 hover:underline">{club.contact_email}</a>
          </Row>
        </Section>

        <Section title="Timeline">
          <Row label="Applied">{formatDate(club.submitted_at ?? club.created_at)}</Row>
          <Row label="Approved">{formatDate(club.approved_at)}</Row>
          <Row label="Invite sent">{formatDate(club.invite_sent_at)}</Row>
        </Section>
      </div>

      {/* Interactive section: actions + notes */}
      <ClubDetailClient club={club} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:   'bg-yellow-100 text-yellow-800',
    active:    'bg-green-100 text-green-800',
    suspended: 'bg-red-100 text-red-800',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${styles[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{title}</h2>
      <dl className="space-y-2">{children}</dl>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-sm text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-900 text-right">{children}</dd>
    </div>
  )
}
