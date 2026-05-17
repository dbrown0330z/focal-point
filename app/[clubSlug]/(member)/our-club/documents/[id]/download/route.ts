import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type DocRow = { file_path: string; file_name: string; mime_type: string | null }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Auth check — must be active member
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  if (!user) return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'))

  // Fetch the document record
  const { data: doc, error } = await admin
    .from('documents')
    .select('file_path, file_name, mime_type')
    .eq('id', id)
    .is('deleted_at', null)
    .single() as { data: DocRow | null; error: Error | null }

  if (error || !doc) {
    return new NextResponse('Document not found', { status: 404 })
  }

  // Generate a signed URL (60 min TTL)
  const { data: signed, error: signErr } = await admin
    .storage
    .from('documents')
    .createSignedUrl(doc.file_path, 3600, {
      download: doc.file_name,
    })

  if (signErr || !signed?.signedUrl) {
    return new NextResponse('Could not generate download link', { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
