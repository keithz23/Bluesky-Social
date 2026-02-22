import { randomBytes } from "crypto";

const CODE_LENGTH = 10;
export function generateResetCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(CODE_LENGTH);
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `${code.slice(0, 5)}-${code.slice(5)}`; // XXXXX-XXXXX
}