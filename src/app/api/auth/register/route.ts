import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { hashPassword } from '../../../../../lib/password';

/**
 * Handle user registration requests
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    // Read username, password, and reference code from request body
    const { username, password, referenceCode } = await request.json();

    // Validate required fields
    if (!username || !password || !referenceCode) {
      return NextResponse.json(
        { error: 'Username, password, and reference code are required' },
        { status: 400 }
      );
    }

    // Validate reference code
    if (referenceCode.toLowerCase() !== 'aibuild') {
      return NextResponse.json(
        { error: 'Invalid reference code' },
        { status: 403 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user in database
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword
      },
      // Return only required fields (exclude password)
      select: {
        id: true,
        username: true
      }
    });

    // Return success response
    return NextResponse.json(
      { 
        message: 'Registration successful',
        user: user
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
