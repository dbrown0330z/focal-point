import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every request except:
     *  - Next.js internals (_next/static, _next/image)
     *  - Static assets (svg, png, jpg, ico, etc.)
     * The session-refresh call must run even on public pages so the
     * Supabase auth cookie is kept alive on active browsers.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
