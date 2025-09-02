import bcrypt from 'bcryptjs';

/**
 * Hash a plaintext password
 * @param password - plaintext password
 * @returns hashed password string
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate salt and hash password using 12 rounds
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plaintext password with a hashed password
 * @param password - plaintext password
 * @param hashedPassword - hashed password stored in the database
 * @returns whether the password matches
 */
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
