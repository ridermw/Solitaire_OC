import type { DrawCount } from './klondike-solver';
import { DeckCodec, KlondikeSolver, WinnableDeckGenerator } from './klondike-solver';

export const encodeDeckId = (deckOrder: number[]): string => DeckCodec.encode(deckOrder);

export const decodeDeckId = (encoded: string): number[] => DeckCodec.decode(encoded);

export const isDeckWinnable = (
    deckOrder: number[],
    drawCount: DrawCount = 1,
    maxStates = 100000,
    maxDepth = 300
): boolean => {
    if (deckOrder.length !== 52) {
        console.error(
            `isDeckWinnable received invalid deck length: expected 52 cards, got ${deckOrder.length}.`
        );
        return false;
    }

    const solver = new KlondikeSolver({ maxStates, maxDepth });
    return solver.isSolvable(deckOrder, drawCount);
};

export const generateWinnableDeckOrder = (
    drawCount: DrawCount = 1,
    maxAttempts = 100,
    maxStates = 100000,
    maxDepth = 300
): number[] | null => {
    const generator = new WinnableDeckGenerator({ maxStates, maxDepth });
    return generator.generateWinnableDeck(maxAttempts, drawCount);
};
