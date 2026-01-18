import { describe, it, expect } from 'vitest';
describe('VITE_APP_VERSION', () => {
  it('uses a semantic version string', () => {
    expect(import.meta.env.VITE_APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
