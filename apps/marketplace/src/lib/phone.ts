export const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

export function isValidPhone(s: string): boolean {
  return PHONE_REGEX.test(s.trim());
}

export function sanitizePhone(raw: string): string {
  let out = raw.replace(/[^\d+\-\s()]/g, "");
  if (out.includes("+")) {
    const first = out[0] === "+" ? "+" : "";
    out = first + out.replace(/\+/g, "");
  }
  return out;
}
