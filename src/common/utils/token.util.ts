import { createHash, randomBytes } from 'crypto';

/** Returns a cryptographically secure random hex string (64 chars by default) */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

/** SHA-256 hash of a token — safe to store in the database */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
