'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export async function createImageRecord(data: {
  title: string
  description: string
  storage_path: string
  exif_data: Record<string, unknown> | null
}): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.from('images').insert({
    owner_id: user.id,
    title:        data.title,
    description:  data.description || null,
    storage_path: data.storage_path,
    exif_data:    data.exif_data as Json,
  })

  if (error) redirect('/library/upload?error=' + encodeURIComponent(error.message))

  revalidatePath('/library')
  redirect('/library')
}

export async function deleteImage(imageId: string, storagePath: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Delete DB record first — FK restrict will block if image has any submissions
  const { error } = await supabase
    .from('images')
    .delete()
    .eq('id', imageId)
    .eq('owner_id', user.id)

  if (error) {
    // FK violation means the image has been submitted to a competition
    revalidatePath('/library')
    return { error: 'This image has been submitted to a competition and cannot be deleted.' }
  }

  // DB record gone — clean up storage
  await supabase.storage.from('images').remove([storagePath])

  revalidatePath('/library')
  return { error: null }
}
