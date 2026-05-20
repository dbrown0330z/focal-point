import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'

export type FooterVariant = 'auth' | 'app' | 'judge'

export async function AppFooter({ variant }: { variant: FooterVariant }) {
  const service = createServiceClient()
  const { data } = await service.from('club_settings').select('club_name').single()
  const clubName = data?.club_name ?? 'Our Camera Club'
  const year     = new Date().getFullYear()

  const logoSrc   = variant === 'auth' ? '/fp-footer-logo-mono.png' : '/fp-footer-logo-color.png'
  const showLinks = variant !== 'judge'

  return (
    <footer className="app-footer">
      <style>{`
        .app-footer { text-align: center; }
        .app-footer-links a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .app-footer-links a:hover { color: var(--text-secondary); }
      `}</style>

      {/* 1px divider */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }} />

      <div style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'center',
        gap:           12,
        padding:       '28px 24px 32px',
      }}>
        {/* Logo — links to marketing home */}
        <a href="/" aria-label="Focal Point home" style={{ display: 'inline-block', lineHeight: 0 }}>
          <Image
            src={logoSrc}
            alt="Focal Point"
            width={150}
            height={40}
            style={{ width: 150, height: 'auto' }}
          />
        </a>

        {/* Copyright */}
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          © {year} {clubName} · Powered by Focal Point
        </p>

        {/* Links — omitted on judge portal */}
        {showLinks && (
          <p className="app-footer-links" style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>
            <a href="/focal_point_privacy_policy.docx" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            <span style={{ margin: '0 10px', color: 'var(--border-strong)' }}>|</span>
            <a href="/focal_point_terms_of_service.docx" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
            <span style={{ margin: '0 10px', color: 'var(--border-strong)' }}>|</span>
            <a href="#">Support</a>
          </p>
        )}
      </div>
    </footer>
  )
}
