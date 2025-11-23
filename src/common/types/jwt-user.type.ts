/**
 * JWT User Type
 * Type for the user object from JWT payload
 */

export interface JwtUser {
  userId: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

