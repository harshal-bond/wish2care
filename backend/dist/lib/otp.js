import crypto from 'crypto';
export function generateOtp() {
    return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}
/**
 * Dev-mode stub — no SMS provider is wired up yet. Logs the code and
 * returns it so the route handler can echo it back in the API response.
 * Swapping in a real provider later means replacing only this function.
 */
export async function sendOtpSms(phone, code) {
    console.log(`[DEV OTP] ${phone}: ${code}`);
    return code;
}
//# sourceMappingURL=otp.js.map