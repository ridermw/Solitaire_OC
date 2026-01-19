import { describe, it, expect } from 'vitest';
import { isValidDrawCount } from './game';

describe('isValidDrawCount', () => {
  it('returns true for 1', () => {
    expect(isValidDrawCount(1)).toBe(true);
  });

  it('returns true for 3', () => {
    expect(isValidDrawCount(3)).toBe(true);
  });

  it('returns false for other numbers', () => {
    expect(isValidDrawCount(0)).toBe(false);
    expect(isValidDrawCount(2)).toBe(false);
    expect(isValidDrawCount(5)).toBe(false);
    expect(isValidDrawCount(-1)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidDrawCount(undefined)).toBe(false);
  });
});
