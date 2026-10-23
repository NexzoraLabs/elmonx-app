const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isValidPassword(value: string): boolean {
  return value.length >= 8;
}

/**
 * A real calendar date in YYYY-MM-DD that is in the past (no 2026-99-99, no 31 Feb, no future
 * birthdays). The date pickers on the website only allow such dates.
 */
export function isValidBirthDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  const isRealDate = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return isRealDate && year >= 1900 && date.getTime() < Date.now();
}
