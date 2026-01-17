import { describe, it, expect } from 'vitest';
import { dealNewGame } from './gameLogic';

describe('gameLogic', () => {
  describe('dealNewGame', () => {
    it('should return a valid GameState object', () => {
      const state = dealNewGame();
      
      expect(state).toHaveProperty('stock');
      expect(state).toHaveProperty('waste');
      expect(state).toHaveProperty('foundations');
      expect(state).toHaveProperty('tableau');
      expect(state).toHaveProperty('score');
    });

    it('should initialize waste pile as empty', () => {
      const state = dealNewGame();
      expect(state.waste).toEqual([]);
    });

    it('should initialize foundations as empty', () => {
      const state = dealNewGame();
      expect(state.foundations.hearts).toEqual([]);
      expect(state.foundations.diamonds).toEqual([]);
      expect(state.foundations.clubs).toEqual([]);
      expect(state.foundations.spades).toEqual([]);
    });

    it('should initialize score as 0', () => {
      const state = dealNewGame();
      expect(state.score).toBe(0);
    });

    it('should create 7 tableau piles', () => {
      const state = dealNewGame();
      expect(state.tableau).toHaveLength(7);
    });

    it('should deal correct number of cards to each tableau pile', () => {
      const state = dealNewGame();
      
      // First pile should have 1 card, second 2, etc.
      for (let i = 0; i < 7; i++) {
        expect(state.tableau[i]).toHaveLength(i + 1);
      }
    });

    it('should deal 28 cards total to tableau (1+2+3+4+5+6+7)', () => {
      const state = dealNewGame();
      const totalTableauCards = state.tableau.reduce((sum, pile) => sum + pile.length, 0);
      expect(totalTableauCards).toBe(28);
    });

    it('should have 24 cards in stock (52 - 28)', () => {
      const state = dealNewGame();
      expect(state.stock).toHaveLength(24);
    });

    it('should use all 52 cards from the deck', () => {
      const state = dealNewGame();
      const totalTableauCards = state.tableau.reduce((sum, pile) => sum + pile.length, 0);
      const totalCards = totalTableauCards + state.stock.length + state.waste.length;
      expect(totalCards).toBe(52);
    });

    it('should have only the top card face up in each tableau pile', () => {
      const state = dealNewGame();
      
      state.tableau.forEach((pile) => {
        pile.forEach((card, cardIndex) => {
          const isTopCard = cardIndex === pile.length - 1;
          if (isTopCard) {
            expect(card.isFaceUp).toBe(true);
          } else {
            expect(card.isFaceUp).toBe(false);
          }
        });
      });
    });

    it('should have all stock cards face down', () => {
      const state = dealNewGame();
      state.stock.forEach(card => {
        expect(card.isFaceUp).toBe(false);
      });
    });

    it('should create unique card IDs across all piles', () => {
      const state = dealNewGame();
      const allCards = [
        ...state.stock,
        ...state.waste,
        ...state.tableau.flat(),
      ];
      
      const ids = allCards.map(c => c.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(52);
    });

    it('should produce different deals on multiple calls', () => {
      const state1 = dealNewGame();
      const state2 = dealNewGame();
      
      // Check if any difference exists in the first 5 tableau cards
      let isDifferent = false;
      for (let i = 0; i < 5 && i < state1.tableau[0].length; i++) {
        if (state1.tableau[i][0].id !== state2.tableau[i][0].id) {
          isDifferent = true;
          break;
        }
      }
      
      // Also check stock
      if (!isDifferent && state1.stock[0].id !== state2.stock[0].id) {
        isDifferent = true;
      }
      
      // This could theoretically fail, but probability is very low
      expect(isDifferent).toBe(true);
    });

    it('should have valid card structure', () => {
      const state = dealNewGame();
      const firstCard = state.tableau[0][0];
      
      expect(firstCard).toHaveProperty('id');
      expect(firstCard).toHaveProperty('suit');
      expect(firstCard).toHaveProperty('rank');
      expect(firstCard).toHaveProperty('isFaceUp');
      
      expect(['hearts', 'diamonds', 'clubs', 'spades']).toContain(firstCard.suit);
      expect(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']).toContain(firstCard.rank);
    });

    it('should contain all suits in the deal', () => {
      const state = dealNewGame();
      const allCards = [
        ...state.stock,
        ...state.tableau.flat(),
      ];
      
      const suits = new Set(allCards.map(c => c.suit));
      expect(suits.size).toBe(4);
      expect(suits.has('hearts')).toBe(true);
      expect(suits.has('diamonds')).toBe(true);
      expect(suits.has('clubs')).toBe(true);
      expect(suits.has('spades')).toBe(true);
    });

    it('should contain all ranks in the deal', () => {
      const state = dealNewGame();
      const allCards = [
        ...state.stock,
        ...state.tableau.flat(),
      ];
      
      const ranks = new Set(allCards.map(c => c.rank));
      expect(ranks.size).toBe(13);
      
      const expectedRanks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
      expectedRanks.forEach(rank => {
        expect(ranks.has(rank)).toBe(true);
      });
    });

    it('should have exactly 13 cards of each suit', () => {
      const state = dealNewGame();
      const allCards = [
        ...state.stock,
        ...state.tableau.flat(),
      ];
      
      const heartCount = allCards.filter(c => c.suit === 'hearts').length;
      const diamondCount = allCards.filter(c => c.suit === 'diamonds').length;
      const clubCount = allCards.filter(c => c.suit === 'clubs').length;
      const spadeCount = allCards.filter(c => c.suit === 'spades').length;
      
      expect(heartCount).toBe(13);
      expect(diamondCount).toBe(13);
      expect(clubCount).toBe(13);
      expect(spadeCount).toBe(13);
    });

    it('should have exactly 4 cards of each rank', () => {
      const state = dealNewGame();
      const allCards = [
        ...state.stock,
        ...state.tableau.flat(),
      ];
      
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
      ranks.forEach(rank => {
        const count = allCards.filter(c => c.rank === rank).length;
        expect(count).toBe(4);
      });
    });
  });
});
