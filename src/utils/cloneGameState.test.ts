import { describe, it, expect } from 'vitest';
import { cloneGameState } from './cloneGameState';
import type { GameState } from '../types/game';

const makeState = (): GameState => ({
  stock: [{ id: 's1', suit: 'hearts', rank: 'A', isFaceUp: false }],
  waste: [{ id: 'w1', suit: 'spades', rank: 'K', isFaceUp: true }],
  foundations: {
    hearts: [{ id: 'fh1', suit: 'hearts', rank: '2', isFaceUp: true }],
    diamonds: [],
    clubs: [],
    spades: [],
  },
  tableau: [[{ id: 't1', suit: 'clubs', rank: 'Q', isFaceUp: true }], [] , [], [], [], [], []],
  score: 42,
});

describe('cloneGameState', () => {
  it('deep clones game state fields', () => {
    const state = makeState();
    const cloned = cloneGameState(state);

    expect(cloned).toEqual(state);
    expect(cloned).not.toBe(state);
    expect(cloned.stock).not.toBe(state.stock);
    expect(cloned.waste).not.toBe(state.waste);
    expect(cloned.tableau).not.toBe(state.tableau);
    expect(cloned.foundations.hearts).not.toBe(state.foundations.hearts);
  });
});
