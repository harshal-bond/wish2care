import 'dotenv/config';
/**
 * Boot-time environment validation.
 *
 * Anything exported here is read once at module load. A misconfigured
 * production deploy should crash on startup rather than come up serving
 * traffic with a known-public signing key — a crash-looping service is
 * visible in Railway immediately, silently-forgeable tokens are not.
 *
 * This module loads dotenv itself rather than assuming some earlier import
 * already did. Relying on that ordering meant a harmless import reshuffle
 * could make the checks below read an empty environment.
 */
/** The value the app used to silently fall back to. Never valid in production. */
const DEV_FALLBACK_SECRET = 'dev-secret-change-in-production';
/** Below this, a secret is brute-forceable offline from any captured token. */
const MIN_SECRET_LENGTH = 32;
const isProduction = process.env.NODE_ENV === 'production';
function fail(message) {
    throw new Error(`[env] ${message}\n` +
        '      Set it in the Railway service variables (Settings -> Variables) and redeploy.\n' +
        '      Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
}
function readJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (!isProduction) {
        if (!secret) {
            console.warn('[env] JWT_SECRET is not set — using the insecure development fallback. ' +
                'This would refuse to boot with NODE_ENV=production.');
            return DEV_FALLBACK_SECRET;
        }
        return secret;
    }
    if (!secret)
        fail('JWT_SECRET is required in production but is not set.');
    if (secret === DEV_FALLBACK_SECRET) {
        fail('JWT_SECRET is still the development fallback value, which is public in this repo.');
    }
    if (secret.length < MIN_SECRET_LENGTH) {
        fail(`JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (got ${secret.length}).`);
    }
    return secret;
}
export const JWT_SECRET = readJwtSecret();
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
//# sourceMappingURL=env.js.map