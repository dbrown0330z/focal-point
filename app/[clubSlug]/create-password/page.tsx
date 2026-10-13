import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import CreatePasswordForm from './CreatePasswordForm'

export default async function CreatePasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>
  searchParams: Promise<{ uid?: string }>
}) {
  const { clubSlug } = await params
  const { uid } = await searchParams

  if (!uid) redirect(`/${clubSlug}/login`)

  const admin = createServiceClient()

  const { data: club } = await (admin as any)
    .from('clubs')
    .select('contact_email, admin_first_name, status')
    .eq('slug', clubSlug)
    .maybeSingle()

  if (!club || club.status !== 'active') redirect(`/${clubSlug}/login`)

  // Verify the uid belongs to this club's contact email
  const { data: { user } } = await admin.auth.admin.getUserById(uid)
  if (!user || user.email !== club.contact_email) redirect(`/${clubSlug}/login`)

  return (
    <CreatePasswordForm
      clubSlug={clubSlug}
      uid={uid}
      firstName={club.admin_first_name ?? ''}
    />
  )
}
