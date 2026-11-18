import { AppFooter } from '@/components/layout/AppFooter'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: '#141414' }}
    >
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <svg className="h-7 w-7" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--action-primary)' }}>
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2.5"/>
              <circle cx="16" cy="16" r="5" fill="currentColor"/>
              <line x1="16" y1="2" x2="16" y2="8"  stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="16" y1="24" x2="16" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="2"  y1="16" x2="8"  y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="24" y1="16" x2="30" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-lora, Lora, Georgia, serif)', fontSize: '22px', fontWeight: 700, color: '#E8E8E8' }}>
              Focal Point
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#9E9E9E', marginTop: '4px' }}>Your camera club, online.</p>
        </div>

        <div
          className="w-full max-w-sm rounded-xl p-8"
          style={{
            background: '#1E1E1E',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {children}
        </div>
      </div>

      <AppFooter variant="auth" />
    </div>
  )
}
