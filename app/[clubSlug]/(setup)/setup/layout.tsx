import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Club Setup — Focal Point' }

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center">
        {/* Focal Point wordmark */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="h-8 w-8 text-[#1A6FC4]" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5"/>
            <circle cx="16" cy="16" r="5" fill="currentColor"/>
            <line x1="16" y1="2" x2="16" y2="8"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="2"  y1="16" x2="8"  y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-xl font-bold text-gray-900 tracking-tight">Focal Point</span>
        </div>
        <p className="text-sm text-gray-500">Club Setup</p>
      </div>
      {children}
    </div>
  )
}
