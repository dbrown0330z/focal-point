import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computeImageHash, hashSimilarity } from '@/lib/images/phash'

const SIMILARITY_THRESHOLD = 0.90

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { storagePath } = await req.json() as { storagePath: string }
  if (!storagePath) return NextResponse.json({ error: 'storagePath required' }, { status: 400 })

  // Download from public storage bucket
  const { data: blob, error: dlErr } = await supabase.storage
    .from('images')
    .download(storagePath)

  if (dlErr || !blob) {
    // Non-fatal — return empty result so the flow can continue
    return NextResponse.json({ hash: null, matches: [] })
  }

  const buffer = Buffer.from(await blob.arrayBuffer())
  let hash: string | null = null
  try {
    hash = await computeImageHash(buffer)
  } catch {
    return NextResponse.json({ hash: null, matches: [] })
  }

  // Fetch all user images that have a completed hash to compare against
  const { data: existingImages } = await supabase
    .from('images')
    .select('id, title, storage_path, p_hash')
    .eq('owner_id', user.id)
    .eq('p_hash_status', 'complete')
    .not('p_hash', 'is', null)

  const matches: Array<{ imageId: string; title: string; similarity: number; thumbUrl: string }> = []
  for (const img of existingImages ?? []) {
    if (!img.p_hash) continue
    const sim = hashSimilarity(hash, img.p_hash)
    if (sim >= SIMILARITY_THRESHOLD) {
      const { data: { publicUrl: thumbUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(img.storage_path)
      matches.push({ imageId: img.id, title: img.title, similarity: sim, thumbUrl })
    }
  }

  // Sort strongest match first
  matches.sort((a, b) => b.similarity - a.similarity)

  return NextResponse.json({ hash, matches })
}
