import { describe, expect, it } from '@jest/globals';
import { isValidBirthDate, isValidEmail } from '@/utils/auth-validation';

describe('isValidBirthDate', () => {
  it('accepts real past dates', () => {
    expect(isValidBirthDate('1990-02-28')).toBe(true);
    expect(isValidBirthDate('2000-02-29')).toBe(true);
  });

  it('rejects impossible, malformed and future dates', () => {
    expect(isValidBirthDate('2026-99-99')).toBe(false);
    expect(isValidBirthDate('1990-02-31')).toBe(false);
    expect(isValidBirthDate('1990-2-3')).toBe(false);
    expect(isValidBirthDate('2999-01-01')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('checks the basic shape', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('not-an-email')).toBe(false);
  });
});
