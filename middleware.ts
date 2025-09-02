import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

/**
 * Next.js Middleware - route protection
 * Intercepts all requests and checks authentication status
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = ['/dashboard'];
  
  // Public routes (should not be visited by authenticated users)
  const publicRoutes = ['/login', '/register'];

  // Read JWT token from cookies
  const token = request.cookies.get('token')?.value;

  // Check whether current path is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // Check whether current path is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If visiting a protected route
  if (isProtectedRoute) {
    // No token: redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      // Add redirect query param so we can return after login
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate token
    const payload = verifyToken(token);
    if (!payload) {
      // Invalid token: clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Token valid: allow
    return NextResponse.next();
  }

  // Visiting a public route while authenticated
  if (isPublicRoute && token) {
    // Validate token
    const payload = verifyToken(token);
    if (payload) {
      // Already authenticated: redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      // Invalid token: clear cookie and allow public route
      const response = NextResponse.next();
      response.cookies.delete('token');
      return response;
    }
  }

  // Otherwise allow
  return NextResponse.next();
}

/**
 * Middleware matcher configuration
 * Controls which paths are processed by this middleware
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - other static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
};
