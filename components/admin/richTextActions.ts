'use server'

import { createServiceClient } from '@/lib/supabase/service'

export async function uploadContentImage(
  formData: FormData,
): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  const ext  = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `content/${crypto.randomUUID()}.${ext}`

  const supabase = createServiceClient()
  const { error } = await supabase.storage.from('images').upload(path, file, {
    contentType:  file.type,
    cacheControl: '31536000',
    upsert:       false,
  })

  if (error) return { error: error.message }

  const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path)
  return { url: publicUrl }
}
