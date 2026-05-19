'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'

export async function submitImage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  const ctx = await getClubContext()
  const slug = ctx?.clubSlug ?? ''
  if (!user) redirect('/login')

  const competitionId = formData.get('competition_id') as string
  const categoryId    = formData.get('category_id') as string
  const imageId       = formData.get('image_id') as string

  // Verify competition is still open
  const { data: competition } = await supabase
    .from('competitions')
    .select('status, submission_limit')
    .eq('id', competitionId)
    .single()

  if (competition?.status !== 'open') {
    redirect(`/${slug}/competitions/${competitionId}?error=Competition+is+not+open+for+submissions`)
  }

  // Check member hasn't hit their limit
  const { count } = await supabase
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('competition_id', competitionId)
    .eq('member_id', user.id)
    .eq('status', 'submitted')

  if ((count ?? 0) >= (competition?.submission_limit ?? 0)) {
    redirect(`/${slug}/competitions/${competitionId}?error=Submission+limit+reached`)
  }

  const { error } = await admin.from('submissions').insert({
    competition_id: competitionId,
    category_id: categoryId,
    image_id: imageId,
    member_id: user.id,
  })

  if (error) {
    // Most likely the partial unique index — image already submitted somewhere
    const msg = error.code === '23505'
      ? 'That photo is already submitted to another competition'
      : error.message
    redirect(`/${slug}/competitions/${competitionId}?error=` + encodeURIComponent(msg))
  }

  revalidatePath(`/${slug}/competitions/${competitionId}`)
  redirect(`/${slug}/competitions/${competitionId}`)
}

export async function withdrawSubmission(submissionId: string, competitionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const ctx = await getClubContext()
  const slug = ctx?.clubSlug ?? ''

  await supabase
    .from('submissions')
    .update({ status: 'withdrawn' })
    .eq('id', submissionId)
    .eq('member_id', user.id) // ensure ownership

  revalidatePath(`/${slug}/competitions/${competitionId}`)
}
