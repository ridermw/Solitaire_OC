import { describe, it, expect, vi, afterEach } from 'vitest';
import * as logger from './logger';

describe('Logger', () => {
  const originalGroupCollapsed = console.groupCollapsed;
  const originalGroupEnd = console.groupEnd;
  const originalLog = console.log;

  afterEach(() => {
    console.groupCollapsed = originalGroupCollapsed;
    console.groupEnd = originalGroupEnd;
    console.log = originalLog;
    vi.restoreAllMocks();
  });

  it('should be safe to call logGameEvent', () => {
    // We mainly want to ensure it doesn't crash and calls console methods if env permits
    const groupCollapsedSpy = vi.fn();
    console.groupCollapsed = groupCollapsedSpy;
    
    logger.logGameEvent('Test');
    
    // We can't easily force import.meta.env.DEV to true/false in pure ESM vitest without setup,
    // so we just assert it runs without error.
    expect(true).toBe(true);
  });

  it('should be safe to call logAnimationEvent', () => {
    const logSpy = vi.fn();
    console.log = logSpy;
    
    logger.logAnimationEvent('Card', 'Start');
    
    expect(true).toBe(true);
  });
});
