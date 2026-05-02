import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

/** Replace template tokens with real club values */
function substituteTokens(html: string, values: {
  clubName: string
  clubLocation: string
  contactEmail: string
  year: string
}): string {
  return html
    .replace(/\[\[Club Name\]\]/g,          values.clubName)
    .replace(/\[\[Club Location\]\]/g,       values.clubLocation || values.clubName)
    .replace(/\[\[Club Contact Email\]\]/g,  values.contactEmail || 'the club administrator')
    .replace(/\[\[Current Year\]\]/g,        values.year)
}

export default async function TermsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const { data } = await supabase
    .from('club_settings')
    .select('club_name, club_location, contact_email, membership_terms_source, membership_terms_content, membership_terms_file_path')
    .single() as {
      data: {
        club_name: string
        club_location: string | null
        contact_email: string | null
        membership_terms_source: string
        membership_terms_content: string | null
        membership_terms_file_path: string | null
      } | null
    }

  // Custom uploaded document — redirect to storage URL
  if (data?.membership_terms_source === 'custom' && data.membership_terms_file_path) {
    const fileUrl = data.membership_terms_file_path.startsWith('http')
      ? data.membership_terms_file_path
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/club-assets/${data.membership_terms_file_path}`
    redirect(fileUrl)
  }

  const clubName = data?.club_name ?? 'Our Camera Club'
  const html = data?.membership_terms_content
    ? substituteTokens(data.membership_terms_content, {
        clubName,
        clubLocation: data.club_location ?? '',
        contactEmail: data.contact_email ?? '',
        year:         new Date().getFullYear().toString(),
      })
    : null

  return (
    <div className="min-h-screen bg-surface-0">
      <header className="border-b border-border-default bg-surface-2">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <Link href="/" className="text-sm font-semibold text-content-primary">{clubName}</Link>
          <Link href="/apply" className="text-sm text-action-primary hover:underline">Apply for membership →</Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">

        {html ? (
          <div
            className="about-page-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-10 text-center">
            <p className="text-sm text-content-secondary">Membership terms are being prepared. Please check back soon.</p>
          </div>
        )}

      </main>
    </div>
  )
}
