import CompetitionsTabNav from '../CompetitionsTabNav'

export default function CompetitionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3">
        <h1 className="text-[22px] font-bold tracking-[-0.015em] text-content-primary">Competitions</h1>
      </div>
      <CompetitionsTabNav />
      {children}
    </div>
  )
}
