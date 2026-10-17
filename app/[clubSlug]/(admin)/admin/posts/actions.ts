'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext, requireClubId } from '@/lib/club-context'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  const _ctx = await getClubContext()
  if (!user) redirect(`/${_ctx?.clubSlug ?? ''}/login`)

  const title     = (formData.get('title') as string).trim()
  const body      = (formData.get('body')  as string).trim()
  const publish   = formData.get('publish') === '1'
  const clubId    = await requireClubId()

  const { error } = await admin.from('posts').insert({
    author_id:    user.id,
    club_id:      clubId,
    title,
    body,
    published_at: publish ? new Date().toISOString() : null,
  })

  if (error) redirect('/admin/posts/new?error=' + encodeURIComponent(error.message))

  revalidatePath('/admin/posts')
  redirect('/admin/posts')
}

export async function updatePost(
  id: string,
  data: { title: string; body: string; published_at: string | null },
): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .update(data)
    .eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/admin/posts')
  revalidatePath(`/admin/posts/${id}`)
  return { error: null }
}

export async function deletePost(id: string): Promise<{ error: string | null }> {
  const admin = createServiceClient()
  const { error } = await admin.from('posts').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/posts')
  return { error: null }
}
