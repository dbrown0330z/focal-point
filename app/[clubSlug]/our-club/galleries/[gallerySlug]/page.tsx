import { redirect } from 'next/navigation'

export default async function ClubGalleryRedirect({
  params,
}: {
  params: Promise<{ clubSlug: string; gallerySlug: string }>
}) {
  const { clubSlug, gallerySlug } = await params
  redirect(`/${clubSlug}/gallery/${gallerySlug}`)
}
