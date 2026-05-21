import { redirect } from 'next/navigation'

export default async function ContentPage({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params
  redirect(`/${clubSlug}/admin/content/navigation`)
}
