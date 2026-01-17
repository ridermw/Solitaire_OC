// Mock the audio module completely for tests
import { vi } from 'vitest';

export const playCardFlipSound = vi.fn();
export const playMoveSound = vi.fn();
export const playWinSound = vi.fn();
export const playShuffleSound = vi.fn();
