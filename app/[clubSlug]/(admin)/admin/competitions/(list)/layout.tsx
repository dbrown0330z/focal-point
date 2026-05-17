import CompetitionsTabNav from '../CompetitionsTabNav'
import { requireClubSlug } from '@/lib/club-context'

export default async function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  const clubSlug = await requireClubSlug()
  return (
    <div>
      <div className="mb-3">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Competitions</h1>
      </div>
      <CompetitionsTabNav clubSlug={clubSlug} />
      {children}
    </div>
  )
}
