import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { comparePassword } from '../../../../../lib/password';
import { signToken } from '../../../../../lib/auth';

/**
 * Handle user login requests
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    // Read username and password from request body
    const { username, password } = await request.json();

    // Validate required fields
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username }
    });

    // If user not found
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Compare provided password with hashed one in DB
    const isPasswordValid = await comparePassword(password, user.password);

    // If password mismatch
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = signToken({
      userId: user.id,
      username: user.username
    });

    // Create response and set httpOnly cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username
        }
      },
      { status: 200 }
    );

    // Set JWT token into an httpOnly cookie
    // httpOnly: prevents JS access to cookie for security
    // secure: only over HTTPS in production
    // sameSite: 'strict' to mitigate CSRF
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
