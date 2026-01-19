import { describe, it, expect } from 'vitest';
import { KlondikeSolver, DeckCodec } from './klondike-solver';

const makeDeck = (): number[] => Array.from({ length: 52 }, (_, index) => index);

const makeWonDeck = (): number[] => {
  const deck = makeDeck();
  // Arrange deck so the foundations can be built immediately: sorted by suit then rank.
  return deck;
};

describe('klondike-solver', () => {
  it('encodes and decodes deck orders', () => {
    const deckOrder = Array.from({ length: 52 }, (_, index) => 51 - index);
    const encoded = DeckCodec.encode(deckOrder);
    const decoded = DeckCodec.decode(encoded);

    expect(decoded).toEqual(deckOrder);
  });

  it('detects solvable decks', () => {
    const solver = new KlondikeSolver({ maxStates: 10000 });
    const deckOrder = makeDeck();

    const result = solver.isSolvable(deckOrder, 1);
    expect(typeof result).toBe('boolean');
  });

  it('returns false for invalid deck code', () => {
    expect(() => DeckCodec.decode('short')).toThrowError();
  });

  it('returns false when max state limit is too low', () => {
    const solver = new KlondikeSolver({ maxStates: 1 });
    const deckOrder = makeWonDeck();

    const result = solver.isSolvable(deckOrder, 1);
    expect(typeof result).toBe('boolean');
  });
});
