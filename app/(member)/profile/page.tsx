import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, display_name, bio, experience_level, shooting_interests, camera_brands, member_number, membership_class, membership_status, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  return (
    <div>
      <h1 className="mb-8 text-xl font-semibold text-content-primary">Profile settings</h1>
      <ProfileClient profile={profile} />
    </div>
  )
}
