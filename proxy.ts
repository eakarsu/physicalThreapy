import { NextRequest, NextResponse } from 'next/server';

const PAGE_BOUNDARY = ['/dashboard', '/patients', '/appointments', '/sessions', '/billing', '/messages', '/settings'];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith('/api/ai/') || /^\/api\/(patients|appointments|sessions|billing|messages)(\/|$)/.test(path)) {
    return NextResponse.json(
      {
        error: 'Legacy unscoped clinical route is disabled',
        code: 'LEGACY_CLINICAL_BOUNDARY',
        replacement: '/api/clinical',
      },
      { status: 410, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (PAGE_BOUNDARY.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return NextResponse.redirect(new URL('/care-workflow', request.url), 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/patients/:path*', '/appointments/:path*', '/sessions/:path*',
    '/billing/:path*', '/messages/:path*', '/settings/:path*', '/api/ai/:path*',
    '/api/patients/:path*', '/api/appointments/:path*', '/api/sessions/:path*',
    '/api/billing/:path*', '/api/messages/:path*',
  ],
};
