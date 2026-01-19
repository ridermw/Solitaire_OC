import type { Card, GameState } from '../types/game';
import { createDeck, shuffleDeck } from './cardUtils';

const INITIAL_GAME_STATE: GameState = {
  stock: [],
  waste: [],
  foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
  tableau: [[], [], [], [], [], [], []],
  score: 0,
};

export const dealNewGame = (): GameState => {
    const baseDeck = createDeck();
    const idToIndex = new Map(baseDeck.map((card, index) => [card.id, index]));
    const deck = shuffleDeck(baseDeck);
    const deckOrder = deck.map(card => idToIndex.get(card.id) ?? 0);

    return dealGameFromDeckOrder(deckOrder);
};

export const dealGameFromDeckOrder = (deckOrder: number[]): GameState => {
    const baseDeck = createDeck();
    const orderedDeck = deckOrder.map(index => ({ ...baseDeck[index] }));
    const tableau: Card[][] = [[], [], [], [], [], [], []];
    let cardIndex = 0;

    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = orderedDeck[cardIndex++];
        tableau[i].push({
          ...card,
          isFaceUp: j === i,
        });
      }
    }

    return {
        ...INITIAL_GAME_STATE,
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] },
        stock: orderedDeck.slice(cardIndex).map(card => ({ ...card, isFaceUp: false })),
        tableau,
    };
};
