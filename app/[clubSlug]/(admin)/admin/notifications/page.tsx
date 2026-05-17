import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import SentMessagesClient from './SentMessagesClient'

export const dynamic = 'force-dynamic'

export default async function SentMessagesPage() {
  const supabase = await createClient()
  const admin = createServiceClient()
  const { data: messages } = await admin
    .from('sent_messages')
    .select('id, subject, sent_to, sent_at, sent_by')
    .order('sent_at', { ascending: false })
    .limit(100)

  return <SentMessagesClient messages={messages ?? []} />
}
