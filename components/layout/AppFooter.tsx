import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/service'

export type FooterVariant = 'auth' | 'app' | 'judge'

export async function AppFooter({ variant }: { variant: FooterVariant }) {
  const service = createServiceClient()
  const { data } = await service.from('club_settings').select('club_name').single()
  const clubName = data?.club_name ?? 'Our Camera Club'
  const year     = new Date().getFullYear()

  const logoSrc   = variant === 'auth' ? '/fp-footer-logo-mono.png' : '/fp-footer-logo-color.png'
  // color: 880×300  mono: 860×300
  const logoH     = variant === 'auth' ? Math.round(150 * 300 / 860) : Math.round(150 * 300 / 880)
  const showLinks = variant !== 'judge'

  return (
    <footer>
      <style>{`
        .app-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .app-footer-divider {
          border: none;
          border-top: 1px solid var(--border-subtle);
          margin: 0;
        }
        .app-footer-body {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 0 28px;
          text-align: center;
        }
        .app-footer-logo { display: inline-block; line-height: 0; }
        .app-footer-logo img { width: 150px; height: auto; }
        .app-footer-copy {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.5;
        }
        .app-footer-links {
          font-size: 12px;
          margin: 0;
          line-height: 1.5;
        }
        .app-footer-links a {
          color: var(--text-tertiary);
          text-decoration: none;
          transition: color 0.15s;
        }
        .app-footer-links a:hover { color: var(--text-secondary); }
        .app-footer-sep {
          margin: 0 10px;
          color: var(--border-strong);
        }
      `}</style>

      {/* Spacer above divider so footer doesn't crowd page content */}
      <div style={{ paddingTop: 48 }}>
        <div className="app-footer-inner">
          <hr className="app-footer-divider" />
          <div className="app-footer-body">
            {/* Logo — links to marketing home */}
            <a href="/" aria-label="Focal Point home" className="app-footer-logo">
              <Image
                src={logoSrc}
                alt="Focal Point"
                width={variant === 'auth' ? 860 : 880}
                height={300}
                style={{ width: 150, height: 'auto', background: 'transparent' }}
              />
            </a>

            {/* Copyright */}
            <p className="app-footer-copy">
              © {year} {clubName} · Powered by Focal Point
            </p>

            {/* Links — omitted on judge portal */}
            {showLinks && (
              <p className="app-footer-links">
                <a href="/focal_point_privacy_policy.docx" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>
                <span className="app-footer-sep">|</span>
                <a href="/focal_point_terms_of_service.docx" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
                <span className="app-footer-sep">|</span>
                <a href="#">Support</a>
              </p>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
