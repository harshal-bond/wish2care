export declare function generateOtp(): string;
/**
 * Dev-mode stub — no SMS provider is wired up yet. Logs the code and
 * returns it so the route handler can echo it back in the API response.
 * Swapping in a real provider later means replacing only this function.
 */
export declare function sendOtpSms(phone: string, code: string): Promise<string>;
//# sourceMappingURL=otp.d.ts.map