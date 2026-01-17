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
    const deck = shuffleDeck(createDeck());
    const tableau: Card[][] = [[], [], [], [], [], [], []];
    let cardIndex = 0;
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j <= i; j++) {
        const card = deck[cardIndex++];
        tableau[i].push({
          ...card,
          isFaceUp: j === i,
        });
      }
    }
    return {
        ...INITIAL_GAME_STATE,
        foundations: { hearts: [], diamonds: [], clubs: [], spades: [] }, // Explicitly reset foundations
        stock: deck.slice(cardIndex),
        tableau,
    };
};
