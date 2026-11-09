import crypto from "crypto";

export interface PasswordStrengthResult {
  score: number; // 0 (weakest) to 4 (strongest)
  isStrongEnough: boolean;
  issues: string[];
}

/**
 * Evaluates password complexity without external dependencies.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const issues: string[] = [];

  if (!password || password.length < 8) {
    issues.push("Password must be at least 8 characters long");
  }
  if (!/[a-z]/.test(password)) {
    issues.push("Password must contain at least one lowercase letter");
  }
  if (!/[A-Z]/.test(password)) {
    issues.push("Password must contain at least one uppercase letter");
  }
  if (!/[0-9]/.test(password)) {
    issues.push("Password must contain at least one number");
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    issues.push("Password must contain at least one special symbol");
  }

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password) && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

  return {
    score: Math.min(score, 4),
    isStrongEnough: issues.length === 0,
    issues,
  };
}

/**
 * Secure password hashing using Node.js crypto.scrypt
 * Returns format: scrypt$N=16384,r=8,p=1$<saltHex>$<derivedKeyHex>
 */
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(32).toString("hex");
    crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`scrypt$N=16384,r=8,p=1$${salt}$${derivedKey.toString("hex")}`);
    });
  });
}

/**
 * Verifies password against stored scrypt hash using timingSafeEqual
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const parts = storedHash.split("$");
      if (parts.length !== 4 || parts[0] !== "scrypt") {
        return resolve(false);
      }
      const salt = parts[2];
      const originalKey = Buffer.from(parts[3], "hex");

      crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (err, derivedKey) => {
        if (err) return resolve(false);
        if (derivedKey.length !== originalKey.length) return resolve(false);
        const match = crypto.timingSafeEqual(derivedKey, originalKey);
        resolve(match);
      });
    } catch {
      resolve(false);
    }
  });
}

/**
 * Hashes an opaque token using SHA-256 for secure database storage
 */
export function hashToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Generates an opaque cryptographically random 64-byte hex token and its SHA-256 hash
 */
export function generateOpaqueToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = hashToken(rawToken);
  return { rawToken, tokenHash };
}
