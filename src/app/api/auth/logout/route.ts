import { NextRequest, NextResponse } from 'next/server';

/**
 * Handle user logout requests
 * POST /api/auth/logout
 */
export async function POST(request: NextRequest) {
  try {
    // Create response to clear the token cookie
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { status: 200 }
    );

    // Clear the JWT token cookie
    // Set expires to past date to ensure cookie is deleted
    // Use same path and domain as when setting the cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0), // Set to epoch time (1970-01-01)
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}