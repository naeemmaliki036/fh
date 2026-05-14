export const PHONE_REGEX = /^\+?[\d\s\-()]{7,20}$/;

export function isValidPhone(s: string): boolean {
  return PHONE_REGEX.test(s.trim());
}

export function sanitizePhone(raw: string): string {
  // Remove any character not in the allowed set
  let out = raw.replace(/[^\d+\-\s()]/g, "");
  // Ensure '+' only appears at position 0
  if (out.includes("+")) {
    const first = out[0] === "+" ? "+" : "";
    out = first + out.replace(/\+/g, "");
  }
  return out;
}
