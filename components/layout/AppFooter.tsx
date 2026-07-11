import { createServiceClient } from '@/lib/supabase/service'
import { getClubContext } from '@/lib/club-context'

export type FooterVariant = 'auth' | 'app' | 'judge'

// SVG logos (light/dark) are served from /public.
// Mono PNG is the fallback while SVGs aren't available.
const LOGO_LIGHT = '/fp-logo-light.svg'
const LOGO_DARK  = '/fp-logo-dark.svg'

const MARKETING_URL = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'focalpointhq.com'}?ref=app`

export async function AppFooter({ variant }: { variant: FooterVariant }) {
  const ctx     = await getClubContext()
  const service = createServiceClient()
  let clubName = 'Our Camera Club'
  if (ctx?.clubId) {
    const { data } = await service.from('club_settings').select('club_name').eq('club_id', ctx.clubId).single()
    clubName = data?.club_name ?? clubName
  }
  const year      = new Date().getFullYear()
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
          opacity: 0.65;
          transition: opacity 0.2s ease;
        }
        .app-footer-logo:hover { opacity: 1; }
        /* light mode (no .dark class): show light logo */
        .app-footer-logo-light { display: block; }
        .app-footer-logo-dark  { display: none;  }
        /* dark mode (.dark class on <html>): show dark logo */
        :root.dark .app-footer-logo-light { display: none;  }
        :root.dark .app-footer-logo-dark  { display: block; }
        .app-footer-logo img {
          width: 120px;
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

      <div style={{ paddingTop: 48 }}>
        <div className="app-footer-inner">
          <hr className="app-footer-divider" />
          <div className="app-footer-body">

            <a href={MARKETING_URL} target="_blank" rel="noopener noreferrer" aria-label="Focal Point home" className="app-footer-logo">
              {/* Light-mode logo */}
              <span className="app-footer-logo-light">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_LIGHT} alt="Focal Point" width={120} height={41} />
              </span>
              {/* Dark-mode logo */}
              <span className="app-footer-logo-dark">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO_DARK} alt="Focal Point" width={120} height={41} />
              </span>
            </a>

            <p className="app-footer-copy">
              © {year} {clubName} · Powered by Focal Point
            </p>

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
