import { createServiceClient } from '@/lib/supabase/service'

export type FooterVariant = 'auth' | 'app' | 'judge'

export async function AppFooter({ variant }: { variant: FooterVariant }) {
  const service = createServiceClient()
  const { data } = await service.from('club_settings').select('club_name').single()
  const clubName = data?.club_name ?? 'Our Camera Club'
  const year     = new Date().getFullYear()
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
        .app-footer-logo {
          display: inline-block;
          line-height: 0;
          text-decoration: none;
        }
        /* light mode: show light logo, hide dark logo */
        .app-footer-logo-light { display: inline; }
        .app-footer-logo-dark  { display: none;   }
        @media (prefers-color-scheme: dark) {
          .app-footer-logo-light { display: none;   }
          .app-footer-logo-dark  { display: inline; }
        }
        .app-footer-logo img {
          width: 150px;
          height: auto;
          display: block;
        }
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

            {/* Logo — one per mode, CSS toggles visibility */}
            <a href="/" aria-label="Focal Point home" className="app-footer-logo">
              <span className="app-footer-logo-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fp-logo-light.svg" alt="Focal Point" width={150} height={51} />
              </span>
              <span className="app-footer-logo-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/fp-logo-dark.svg" alt="Focal Point" width={150} height={51} />
              </span>
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
