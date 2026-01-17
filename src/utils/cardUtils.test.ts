import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDeck, shuffleDeck, getCardColor, getRankValue, isOppositeColor } from './cardUtils';
import type { Card } from '../types/game';

describe('cardUtils', () => {
  describe('createDeck', () => {
    it('should create a deck with 52 cards', () => {
      const deck = createDeck();
      expect(deck).toHaveLength(52);
    });

    it('should create 13 cards for each suit', () => {
      const deck = createDeck();
      const hearts = deck.filter(c => c.suit === 'hearts');
      const diamonds = deck.filter(c => c.suit === 'diamonds');
      const clubs = deck.filter(c => c.suit === 'clubs');
      const spades = deck.filter(c => c.suit === 'spades');

      expect(hearts).toHaveLength(13);
      expect(diamonds).toHaveLength(13);
      expect(clubs).toHaveLength(13);
      expect(spades).toHaveLength(13);
    });

    it('should create cards with all ranks from A to K', () => {
      const deck = createDeck();
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      
      const hearts = deck.filter(c => c.suit === 'hearts');
      const heartRanks = hearts.map(c => c.rank);
      
      ranks.forEach(rank => {
        expect(heartRanks).toContain(rank);
      });
    });

    it('should create cards with face down by default', () => {
      const deck = createDeck();
      deck.forEach(card => {
        expect(card.isFaceUp).toBe(false);
      });
    });

    it('should create cards with unique IDs', () => {
      const deck = createDeck();
      const ids = deck.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(52);
    });

    it('should create cards with correct ID format', () => {
      const deck = createDeck();
      const aceOfHearts = deck.find(c => c.rank === 'A' && c.suit === 'hearts');
      expect(aceOfHearts?.id).toBe('A-hearts');
    });
  });

  describe('shuffleDeck', () => {
    it('should return a deck with the same number of cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      expect(shuffled).toHaveLength(52);
    });

    it('should not modify the original deck', () => {
      const deck = createDeck();
      const originalFirst = deck[0];
      shuffleDeck(deck);
      expect(deck[0]).toEqual(originalFirst);
    });

    it('should contain all the same cards', () => {
      const deck = createDeck();
      const shuffled = shuffleDeck(deck);
      
      const originalIds = deck.map(c => c.id).sort();
      const shuffledIds = shuffled.map(c => c.id).sort();
      
      expect(shuffledIds).toEqual(originalIds);
    });

    it('should shuffle cards (probabilistic test)', () => {
      // Mock Math.random to ensure deterministic shuffle
      const mockRandom = vi.spyOn(Math, 'random');
      mockRandom.mockReturnValueOnce(0.5).mockReturnValueOnce(0.3).mockReturnValueOnce(0.7);
      
      const deck = createDeck();
      shuffleDeck(deck);
      
      // With mocked random, the shuffle should be deterministic
      // At least verify it's been called during shuffle
      expect(mockRandom).toHaveBeenCalled();
      
      mockRandom.mockRestore();
    });

    it('should produce different order on multiple calls (probabilistic)', () => {
      const deck = createDeck();
      const shuffle1 = shuffleDeck(deck);
      const shuffle2 = shuffleDeck(deck);
      
      // It's extremely unlikely (but not impossible) for two shuffles to be identical
      // Check that at least one position differs
      let isDifferent = false;
      for (let i = 0; i < shuffle1.length; i++) {
        if (shuffle1[i].id !== shuffle2[i].id) {
          isDifferent = true;
          break;
        }
      }
      
      // This could theoretically fail, but the probability is 1/52! which is essentially 0
      expect(isDifferent).toBe(true);
    });
  });

  describe('getCardColor', () => {
    it('should return red for hearts', () => {
      expect(getCardColor('hearts')).toBe('red');
    });

    it('should return red for diamonds', () => {
      expect(getCardColor('diamonds')).toBe('red');
    });

    it('should return black for clubs', () => {
      expect(getCardColor('clubs')).toBe('black');
    });

    it('should return black for spades', () => {
      expect(getCardColor('spades')).toBe('black');
    });
  });

  describe('getRankValue', () => {
    it('should return 1 for Ace', () => {
      expect(getRankValue('A')).toBe(1);
    });

    it('should return correct values for number cards', () => {
      expect(getRankValue('2')).toBe(2);
      expect(getRankValue('3')).toBe(3);
      expect(getRankValue('4')).toBe(4);
      expect(getRankValue('5')).toBe(5);
      expect(getRankValue('6')).toBe(6);
      expect(getRankValue('7')).toBe(7);
      expect(getRankValue('8')).toBe(8);
      expect(getRankValue('9')).toBe(9);
      expect(getRankValue('10')).toBe(10);
    });

    it('should return correct values for face cards', () => {
      expect(getRankValue('J')).toBe(11);
      expect(getRankValue('Q')).toBe(12);
      expect(getRankValue('K')).toBe(13);
    });

    it('should have ascending values from A to K', () => {
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
      const values = ranks.map(getRankValue);
      
      for (let i = 1; i < values.length; i++) {
        expect(values[i]).toBeGreaterThan(values[i - 1]);
      }
    });
  });

  describe('isOppositeColor', () => {
    let redCard: Card;
    let blackCard: Card;
    let anotherRedCard: Card;
    let anotherBlackCard: Card;

    beforeEach(() => {
      redCard = { id: '5-hearts', suit: 'hearts', rank: '5', isFaceUp: true };
      blackCard = { id: '6-spades', suit: 'spades', rank: '6', isFaceUp: true };
      anotherRedCard = { id: '7-diamonds', suit: 'diamonds', rank: '7', isFaceUp: true };
      anotherBlackCard = { id: '8-clubs', suit: 'clubs', rank: '8', isFaceUp: true };
    });

    it('should return true for red card and black card', () => {
      expect(isOppositeColor(redCard, blackCard)).toBe(true);
      expect(isOppositeColor(blackCard, redCard)).toBe(true);
    });

    it('should return false for two red cards', () => {
      expect(isOppositeColor(redCard, anotherRedCard)).toBe(false);
    });

    it('should return false for two black cards', () => {
      expect(isOppositeColor(blackCard, anotherBlackCard)).toBe(false);
    });

    it('should return true for hearts and clubs', () => {
      const heart = { id: 'K-hearts', suit: 'hearts' as const, rank: 'K' as const, isFaceUp: true };
      const club = { id: 'Q-clubs', suit: 'clubs' as const, rank: 'Q' as const, isFaceUp: true };
      expect(isOppositeColor(heart, club)).toBe(true);
    });

    it('should return true for diamonds and spades', () => {
      const diamond = { id: 'J-diamonds', suit: 'diamonds' as const, rank: 'J' as const, isFaceUp: true };
      const spade = { id: '10-spades', suit: 'spades' as const, rank: '10' as const, isFaceUp: true };
      expect(isOppositeColor(diamond, spade)).toBe(true);
    });

    it('should return false for hearts and diamonds', () => {
      const heart = { id: '9-hearts', suit: 'hearts' as const, rank: '9' as const, isFaceUp: true };
      const diamond = { id: '8-diamonds', suit: 'diamonds' as const, rank: '8' as const, isFaceUp: true };
      expect(isOppositeColor(heart, diamond)).toBe(false);
    });

    it('should return false for clubs and spades', () => {
      const club = { id: '7-clubs', suit: 'clubs' as const, rank: '7' as const, isFaceUp: true };
      const spade = { id: '6-spades', suit: 'spades' as const, rank: '6' as const, isFaceUp: true };
      expect(isOppositeColor(club, spade)).toBe(false);
    });
  });
});
