import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'

export const dynamic = 'force-dynamic'

type ResourceRow = {
  id:           string
  source_type:  string
  visibility:   string
  url:          string | null
  file_path:    string | null
  file_name:    string | null
  file_mime:    string | null
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clubSlug: string; id: string }> }
) {
  const { clubSlug, id } = await params
  const base      = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin     = createServiceClient()
  const ctx       = await getClubContext()
  const clubId    = ctx?.clubId

  // Determine viewer visibility level
  let maxVisibility: 'public' | 'members' | 'board' = 'public'
  if (user && clubId) {
    const { data: membership } = await admin
      .from('club_memberships')
      .select('role, membership_status')
      .eq('user_id', user.id)
      .eq('club_id', clubId)
      .maybeSingle()

    const isActive = ['active', 'complimentary'].includes(membership?.membership_status ?? '')
    if (isActive) {
      maxVisibility = 'members'
      if ((membership?.role as string) === 'admin' || (membership?.role as string) === 'board') {
        maxVisibility = 'board'
      }
    }
  }

  // Fetch resource
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: resource, error } = await (admin as any)
    .from('resources')
    .select('id, source_type, visibility, url, file_path, file_name, file_mime')
    .eq('id', id)
    .eq('club_id', clubId ?? '')
    .eq('status', 'published')
    .single() as { data: ResourceRow | null; error: unknown }

  if (error || !resource) {
    return new NextResponse('Not found', { status: 404 })
  }

  // Check access
  const visOrder = { public: 0, members: 1, board: 2 }
  if (visOrder[resource.visibility as keyof typeof visOrder] > visOrder[maxVisibility]) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/${clubSlug}/login?return=/${clubSlug}/r/${id}`, base)
      )
    }
    return new NextResponse('Not found', { status: 404 })
  }

  const download = req.nextUrl.searchParams.get('download') === '1'

  // Link resource → redirect
  if (resource.source_type === 'link') {
    return NextResponse.redirect(resource.url ?? '/')
  }

  // Video resource → log view (future), redirect to video page
  if (resource.source_type === 'video') {
    return NextResponse.redirect(new URL(`/${clubSlug}/resources/v/${id}`, base))
  }

  // File resource → signed URL
  if (!resource.file_path) {
    return new NextResponse('File not available', { status: 404 })
  }

  const isPdf = resource.file_mime?.includes('pdf')
  const disposition = (!download && isPdf) ? undefined : resource.file_name ?? undefined

  const { data: signed, error: signErr } = await admin
    .storage
    .from('resources')
    .createSignedUrl(resource.file_path, 3600, {
      download: disposition,
    })

  if (signErr || !signed?.signedUrl) {
    return new NextResponse('Could not generate file link', { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
