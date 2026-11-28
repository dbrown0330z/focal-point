'use server'

import { revalidatePath } from 'next/cache'

// Called after navigation publish so the member layout re-renders with fresh data.
export async function revalidateNavCache(): Promise<void> {
  revalidatePath('/', 'layout')
}
