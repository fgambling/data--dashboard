import jwt from 'jsonwebtoken';

// Interface definition for JWT payload
export interface JWTPayload {
  userId: number;
  username: string;
}

/**
 * Generate a JWT token
 * @param payload - JWT payload data
 * @returns JWT token string
 */
export function signToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  // Generate JWT with 24-hour expiration
  return jwt.sign(payload, secret, { expiresIn: '24h' });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns decoded payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  
  try {
    // Verify and decode JWT
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    // Return null if token is invalid or expired
    console.error('JWT verification failed:', error);
    return null;
  }
}
