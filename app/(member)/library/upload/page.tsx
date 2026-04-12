import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UploadForm from '@/components/library/UploadForm'

export default async function UploadPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-content-primary">Add to library</h1>
      <UploadForm userId={user.id} />
    </div>
  )
}
