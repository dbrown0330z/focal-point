import { createClient } from '@/lib/supabase/server'
import SentMessagesClient from './SentMessagesClient'

export const dynamic = 'force-dynamic'

export default async function SentMessagesPage() {
  const supabase = await createClient()
  const { data: messages } = await supabase
    .from('sent_messages')
    .select('id, subject, sent_to, sent_at, sent_by')
    .order('sent_at', { ascending: false })
    .limit(100)

  return <SentMessagesClient messages={messages ?? []} />
}
