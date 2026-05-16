'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import type { CompetitionConfig } from '@/types/competition'
import type { Json } from '@/types/database'

export async function saveTemplate(name: string, config: CompetitionConfig) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competition_templates')
    .insert({ name, config: config as unknown as Json })
  if (error) throw new Error(error.message)
  revalidatePath('/admin/competitions/templates')
}

export async function updateTemplate(id: string, name: string, config: CompetitionConfig) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competition_templates')
    .update({ name, config: config as unknown as Json, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/competitions/templates')
}

export async function deleteTemplate(id: string) {
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('competition_templates')
    .delete()
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/competitions/templates')
}
