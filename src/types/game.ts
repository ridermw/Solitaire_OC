export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type DrawCount = 1 | 3;

export const isValidDrawCount = (count: number | undefined): count is DrawCount => {
  return count === 1 || count === 3;
};

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
  isFaceUp: boolean;
}

export type PileType = 'stock' | 'waste' | 'foundation' | 'tableau';

export interface GameState {
  stock: Card[];
  waste: Card[];
  foundations: { [key in Suit]: Card[] };
  tableau: Card[][];
  score: number;
}
