import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AboutPage() {
  const supabase = await createClient()
  const admin = createServiceClient()

  const [{ data: { user } }, { data: settingsRaw }, { data: pageRaw }] = await Promise.all([
    supabase.auth.getUser(),
    admin.from('club_settings').select('club_name').single() as Promise<{ data: { club_name: string } | null }>,
    admin
      .from('pages')
      .select('id, content')
      .eq('slug', 'about')
      .single() as Promise<{ data: { id: string; content: string | null } | null }>,
  ])

  const clubName   = settingsRaw?.club_name ?? 'Our Camera Club'
  const html       = pageRaw?.content ?? null
  const isLoggedIn = Boolean(user)

  return (
    <div>

      {/* Page title */}
      <div className="mb-10">
        <h1
          className="font-[family-name:var(--font-lora)] font-bold text-content-primary"
          style={{ fontSize: '28px', letterSpacing: '-0.02em', lineHeight: 1.25 }}
        >
          About our club
        </h1>
        <p
          className="mt-1 font-[family-name:var(--font-lora)] text-content-secondary"
          style={{ fontSize: '17px', fontWeight: 500 }}
        >
          {clubName}
        </p>
      </div>

      {/* Rich-text content from editor */}
      {html ? (
        <div
          className="about-page-content"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="rounded-xl border border-border-default bg-surface-1 px-6 py-10 text-center">
          <p className="text-sm text-content-secondary">
            Club information coming soon. Check back later.
          </p>
        </div>
      )}

      {/* Join CTA — visitors only */}
      {!isLoggedIn && (
        <div className="mt-14 max-w-2xl rounded-xl border border-border-default bg-surface-1 px-6 py-7">
          <h3 className="mb-1 text-base font-semibold text-content-primary">Interested in joining?</h3>
          <p className="mb-4 text-sm text-content-secondary leading-relaxed">
            Membership is open to anyone with a passion for photography.
          </p>
          <Link
            href="/apply"
            className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ background: 'var(--action-primary)' }}
          >
            Apply for membership
          </Link>
        </div>
      )}
    </div>
  )
}
