'use server'

import { revalidatePath }         from 'next/cache'
import { createServiceClient }    from '@/lib/supabase/service'
import { getClubContext }         from '@/lib/club-context'
import type { SocialAccount, SocialPlatform } from './types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function db() { return createServiceClient() as any }

export async function getSocialAccounts(): Promise<SocialAccount[]> {
  const ctx = await getClubContext()
  if (!ctx?.clubId) return []
  const { data } = await db()
    .from('club_social_accounts')
    .select('id, platform, url, label, sort_order')
    .eq('club_id', ctx.clubId)
    .order('sort_order')
  return (data ?? []) as SocialAccount[]
}

export async function addSocialAccount(
  platform: SocialPlatform,
  url: string,
  label: string | null,
): Promise<{ error?: string; account?: SocialAccount }> {
  const ctx = await getClubContext()
  if (!ctx?.clubId) return { error: 'Not authenticated' }

  const { data: existing } = await db()
    .from('club_social_accounts')
    .select('sort_order')
    .eq('club_id', ctx.clubId)
    .order('sort_order', { ascending: false })
    .limit(1)
  const nextOrder: number = ((existing?.[0]?.sort_order ?? -1) as number) + 1

  const { data, error } = await db()
    .from('club_social_accounts')
    .insert({ club_id: ctx.clubId, platform, url, label, sort_order: nextOrder })
    .select('id, platform, url, label, sort_order')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return { account: data as SocialAccount }
}

export async function deleteSocialAccount(id: string): Promise<{ error?: string }> {
  const ctx = await getClubContext()
  if (!ctx?.clubId) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('club_social_accounts')
    .delete()
    .eq('id', id)
    .eq('club_id', ctx.clubId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return {}
}

export async function updatePanelShownSocials(ids: string[]): Promise<{ error?: string }> {
  const ctx = await getClubContext()
  if (!ctx?.clubId) return { error: 'Not authenticated' }
  const { error } = await db()
    .from('club_settings')
    .update({ panel_shown_social_ids: ids, updated_at: new Date().toISOString() })
    .eq('club_id', ctx.clubId)
  if (error) return { error: error.message }
  revalidatePath('/', 'layout')
  return {}
}
