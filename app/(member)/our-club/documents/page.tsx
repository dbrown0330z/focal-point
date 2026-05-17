import { createServiceClient } from '@/lib/supabase/service'
import DocumentsClient from './DocumentsClient'

export const dynamic = 'force-dynamic'

export type DocumentRow = {
  id:          string
  title:       string
  description: string | null
  file_name:   string
  file_size:   number | null
  mime_type:   string | null
  file_path:   string
  sort_order:  number
  uploaded_at: string
  category:    { id: string; name: string } | null
}

type RawCategory = { id: string; name: string; sort_order: number }
type RawDocument = {
  id: string; title: string; description: string | null
  file_name: string; file_size: number | null; mime_type: string | null
  file_path: string; sort_order: number; uploaded_at: string; category_id: string | null
  document_categories: { id: string; name: string } | null
}

export default async function DocumentsPage() {
  const admin = createServiceClient()

  const [{ data: categoriesRaw }, { data: docsRaw }] = await Promise.all([
    admin
      .from('document_categories')
      .select('id, name, sort_order')
      .order('sort_order') as Promise<{ data: RawCategory[] | null }>,
    admin
      .from('documents')
      .select('id, title, description, file_name, file_size, mime_type, file_path, sort_order, uploaded_at, category_id, document_categories(id, name)')
      .is('deleted_at', null)
      .order('sort_order')
      .order('uploaded_at', { ascending: false }) as Promise<{ data: RawDocument[] | null }>,
  ])

  const categories = (categoriesRaw ?? []).map(c => ({ id: c.id, name: c.name }))

  const documents: DocumentRow[] = (docsRaw ?? []).map(d => ({
    id:          d.id,
    title:       d.title,
    description: d.description ?? null,
    file_name:   d.file_name,
    file_size:   d.file_size ?? null,
    mime_type:   d.mime_type ?? null,
    file_path:   d.file_path,
    sort_order:  d.sort_order,
    uploaded_at: d.uploaded_at,
    category:    d.document_categories ? { id: d.document_categories.id, name: d.document_categories.name } : null,
  }))

  return (
    <DocumentsClient
      documents={documents}
      categories={categories}
    />
  )
}
