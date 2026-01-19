import { describe, it, expect } from 'vitest';
import { encodeDeckId, decodeDeckId, isDeckWinnable } from './solver';

describe('solver', () => {
  describe('deck codec', () => {
    it('encodes and decodes a deck order', () => {
      const deckOrder = Array.from({ length: 52 }, (_, index) => 51 - index);
      const encoded = encodeDeckId(deckOrder);
      const decoded = decodeDeckId(encoded);

      expect(decoded).toEqual(deckOrder);
    });
  });

  describe('isDeckWinnable', () => {
    it('returns a boolean for deck orders', () => {
      const deckOrder = Array.from({ length: 52 }, (_, index) => index);
      const result = isDeckWinnable(deckOrder, 1, 1000);
      expect(typeof result).toBe('boolean');
    });

    it('returns false for invalid deck order length', () => {
      const result = isDeckWinnable([], 1, 1000);
      expect(result).toBe(false);
    });
  });
});
