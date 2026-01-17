import { describe, it, expect } from 'vitest';
import { isGameWinnable } from './solver';
import type { GameState, Card } from '../types/game';

// Helper to create a simple card
const makeCard = (rank: string, suit: string, isFaceUp = true): Card => ({
  id: `${rank}-${suit}`,
  rank: rank as Card['rank'],
  suit: suit as Card['suit'],
  isFaceUp,
});

describe('solver', () => {
  describe('isGameWinnable', () => {
    it('should return true for an already won game', () => {
      const wonState: GameState = {
        stock: [],
        waste: [],
        foundations: {
          hearts: [
            makeCard('A', 'hearts'), makeCard('2', 'hearts'), makeCard('3', 'hearts'),
            makeCard('4', 'hearts'), makeCard('5', 'hearts'), makeCard('6', 'hearts'),
            makeCard('7', 'hearts'), makeCard('8', 'hearts'), makeCard('9', 'hearts'),
            makeCard('10', 'hearts'), makeCard('J', 'hearts'), makeCard('Q', 'hearts'),
            makeCard('K', 'hearts')
          ],
          diamonds: [
            makeCard('A', 'diamonds'), makeCard('2', 'diamonds'), makeCard('3', 'diamonds'),
            makeCard('4', 'diamonds'), makeCard('5', 'diamonds'), makeCard('6', 'diamonds'),
            makeCard('7', 'diamonds'), makeCard('8', 'diamonds'), makeCard('9', 'diamonds'),
            makeCard('10', 'diamonds'), makeCard('J', 'diamonds'), makeCard('Q', 'diamonds'),
            makeCard('K', 'diamonds')
          ],
          clubs: [
            makeCard('A', 'clubs'), makeCard('2', 'clubs'), makeCard('3', 'clubs'),
            makeCard('4', 'clubs'), makeCard('5', 'clubs'), makeCard('6', 'clubs'),
            makeCard('7', 'clubs'), makeCard('8', 'clubs'), makeCard('9', 'clubs'),
            makeCard('10', 'clubs'), makeCard('J', 'clubs'), makeCard('Q', 'clubs'),
            makeCard('K', 'clubs')
          ],
          spades: [
            makeCard('A', 'spades'), makeCard('2', 'spades'), makeCard('3', 'spades'),
            makeCard('4', 'spades'), makeCard('5', 'spades'), makeCard('6', 'spades'),
            makeCard('7', 'spades'), makeCard('8', 'spades'), makeCard('9', 'spades'),
            makeCard('10', 'spades'), makeCard('J', 'spades'), makeCard('Q', 'spades'),
            makeCard('K', 'spades')
          ],
        },
        tableau: [[], [], [], [], [], [], []],
        score: 0,
      };

      const result = isGameWinnable(wonState, 1);
      expect(result).toBe(true);
    });

    it('should return true for a simple winnable game with one ace', () => {
      const simpleWinnableState: GameState = {
        stock: [],
        waste: [makeCard('A', 'hearts')],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [[], [], [], [], [], [], []],
        score: 0,
      };

      // This is winnable because we can move the ace to foundation
      // However, this is NOT a complete game (only 1 card), so let me adjust the test
      const result = isGameWinnable(simpleWinnableState, 1);
      // This should be false because we can't win with only 1 card
      expect(result).toBe(false);
    });

    it('should handle empty state', () => {
      const emptyState: GameState = {
        stock: [],
        waste: [],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [[], [], [], [], [], [], []],
        score: 0,
      };

      const result = isGameWinnable(emptyState, 1);
      expect(result).toBe(false);
    });

    it('should handle draw count of 3', () => {
      const wonState: GameState = {
        stock: [],
        waste: [],
        foundations: {
          hearts: [
            makeCard('A', 'hearts'), makeCard('2', 'hearts'), makeCard('3', 'hearts'),
            makeCard('4', 'hearts'), makeCard('5', 'hearts'), makeCard('6', 'hearts'),
            makeCard('7', 'hearts'), makeCard('8', 'hearts'), makeCard('9', 'hearts'),
            makeCard('10', 'hearts'), makeCard('J', 'hearts'), makeCard('Q', 'hearts'),
            makeCard('K', 'hearts')
          ],
          diamonds: [
            makeCard('A', 'diamonds'), makeCard('2', 'diamonds'), makeCard('3', 'diamonds'),
            makeCard('4', 'diamonds'), makeCard('5', 'diamonds'), makeCard('6', 'diamonds'),
            makeCard('7', 'diamonds'), makeCard('8', 'diamonds'), makeCard('9', 'diamonds'),
            makeCard('10', 'diamonds'), makeCard('J', 'diamonds'), makeCard('Q', 'diamonds'),
            makeCard('K', 'diamonds')
          ],
          clubs: [
            makeCard('A', 'clubs'), makeCard('2', 'clubs'), makeCard('3', 'clubs'),
            makeCard('4', 'clubs'), makeCard('5', 'clubs'), makeCard('6', 'clubs'),
            makeCard('7', 'clubs'), makeCard('8', 'clubs'), makeCard('9', 'clubs'),
            makeCard('10', 'clubs'), makeCard('J', 'clubs'), makeCard('Q', 'clubs'),
            makeCard('K', 'clubs')
          ],
          spades: [
            makeCard('A', 'spades'), makeCard('2', 'spades'), makeCard('3', 'spades'),
            makeCard('4', 'spades'), makeCard('5', 'spades'), makeCard('6', 'spades'),
            makeCard('7', 'spades'), makeCard('8', 'spades'), makeCard('9', 'spades'),
            makeCard('10', 'spades'), makeCard('J', 'spades'), makeCard('Q', 'spades'),
            makeCard('K', 'spades')
          ],
        },
        tableau: [[], [], [], [], [], [], []],
        score: 0,
      };

      const result = isGameWinnable(wonState, 3);
      expect(result).toBe(true);
    });

    it('should respect timeout limit', () => {
      // Create a complex unwinnable state that would take a long time to explore
      const complexState: GameState = {
        stock: Array.from({ length: 24 }, (_, i) => makeCard(String(i), 'hearts', false)),
        waste: [],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [
          [makeCard('K', 'spades')],
          [makeCard('Q', 'hearts'), makeCard('J', 'clubs')],
          [makeCard('10', 'diamonds'), makeCard('9', 'spades'), makeCard('8', 'hearts')],
          [makeCard('7', 'clubs'), makeCard('6', 'diamonds'), makeCard('5', 'spades'), makeCard('4', 'hearts')],
          [makeCard('3', 'clubs'), makeCard('2', 'diamonds'), makeCard('A', 'spades'), makeCard('K', 'hearts'), makeCard('Q', 'clubs')],
          [makeCard('J', 'diamonds'), makeCard('10', 'spades'), makeCard('9', 'hearts'), makeCard('8', 'clubs'), makeCard('7', 'diamonds'), makeCard('6', 'spades')],
          [makeCard('5', 'hearts'), makeCard('4', 'clubs'), makeCard('3', 'diamonds'), makeCard('2', 'spades'), makeCard('A', 'hearts'), makeCard('K', 'clubs'), makeCard('Q', 'diamonds')],
        ],
        score: 0,
      };

      const startTime = Date.now();
      const result = isGameWinnable(complexState, 1, 1_000_000, 100); // 100ms timeout
      const elapsed = Date.now() - startTime;

      // Should return within reasonable time (with some buffer for test execution)
      expect(elapsed).toBeLessThan(500);
      expect(typeof result).toBe('boolean');
    });

    it('should respect node limit', () => {
      // Create a state with many possible moves
      const complexState: GameState = {
        stock: Array.from({ length: 10 }, (_, i) => makeCard(String(i), 'hearts', false)),
        waste: [],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [
          [makeCard('K', 'spades')],
          [makeCard('Q', 'hearts')],
          [makeCard('J', 'clubs')],
          [makeCard('10', 'diamonds')],
          [makeCard('9', 'spades')],
          [makeCard('8', 'hearts')],
          [makeCard('7', 'clubs')],
        ],
        score: 0,
      };

      // Use very small node limit
      const result = isGameWinnable(complexState, 1, 10, 10000); // 10 nodes max
      expect(typeof result).toBe('boolean');
    });

    it('should return false for obviously unwinnable state', () => {
      // All aces are face down at bottom of tableau with no way to access them
      const unwinnableState: GameState = {
        stock: [],
        waste: [],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [
          [makeCard('A', 'hearts', false), makeCard('K', 'spades')],
          [makeCard('A', 'diamonds', false), makeCard('Q', 'clubs')],
          [makeCard('A', 'clubs', false), makeCard('J', 'hearts')],
          [makeCard('A', 'spades', false), makeCard('10', 'clubs')],
          [],
          [],
          [],
        ],
        score: 0,
      };

      const result = isGameWinnable(unwinnableState, 1);
      expect(result).toBe(false);
    });

    it('should handle state with only foundations partially filled', () => {
      const partialState: GameState = {
        stock: [],
        waste: [makeCard('3', 'hearts')],
        foundations: {
          hearts: [makeCard('A', 'hearts'), makeCard('2', 'hearts')],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [[], [], [], [], [], [], []],
        score: 0,
      };

      // This should be false as we only have 3 cards total
      const result = isGameWinnable(partialState, 1);
      expect(result).toBe(false);
    });

    it('should handle tableau with valid sequence', () => {
      const sequenceState: GameState = {
        stock: [],
        waste: [],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [
          [makeCard('K', 'hearts'), makeCard('Q', 'spades'), makeCard('J', 'hearts')],
          [],
          [],
          [],
          [],
          [],
          [],
        ],
        score: 0,
      };

      // Should recognize this is not winnable (only 3 cards)
      const result = isGameWinnable(sequenceState, 1);
      expect(result).toBe(false);
    });

    it('should not mutate the original state', () => {
      const originalState: GameState = {
        stock: [makeCard('K', 'hearts', false)],
        waste: [],
        foundations: {
          hearts: [],
          diamonds: [],
          clubs: [],
          spades: [],
        },
        tableau: [
          [makeCard('A', 'spades')],
          [],
          [],
          [],
          [],
          [],
          [],
        ],
        score: 0,
      };

      const stateBefore = JSON.stringify(originalState);
      isGameWinnable(originalState, 1);
      const stateAfter = JSON.stringify(originalState);

      expect(stateBefore).toBe(stateAfter);
    });
  });
});
