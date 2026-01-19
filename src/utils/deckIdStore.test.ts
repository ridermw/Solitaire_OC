import { describe, it, expect, vi } from 'vitest';
import { getRandomDeckId } from './deckIdStore';

describe('getRandomDeckId', () => {
  it('returns null when list is empty', () => {
    expect(getRandomDeckId([])).toBeNull();
  });

  it('returns a stable choice based on Math.random', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.6);
    const id = getRandomDeckId(['a', 'b', 'c', 'd']);
    expect(id).toBe('c');
    vi.mocked(Math.random).mockRestore();
  });
});
