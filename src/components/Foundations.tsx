import { Card as CardComponent } from './Card';
import type { Card, Suit } from '../types/game';

interface FoundationsProps {
  foundations: Record<Suit, Card[]>;
  selectedCardId?: string;
  onCardClick: (card: Card, source: string) => void;
  onEmptyClick: (suit: Suit) => void;
}

const SUIT_ORDER: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const Foundations = ({
  foundations,
  selectedCardId,
  onCardClick,
  onEmptyClick,
}: FoundationsProps) => (
  <div className="flex gap-4">
    {SUIT_ORDER.map((suit) => {
      const pile = foundations[suit];
      const topCard = pile[pile.length - 1];

      return (
        <div
          key={suit}
          className="w-24 h-36 border-2 border-green-700 rounded-lg flex items-center justify-center bg-green-900 bg-opacity-20"
          onClick={() => {
            if (pile.length === 0) {
              onEmptyClick(suit);
            }
          }}
          data-drop-zone={`foundation-${suit}`}
        >
          {topCard ? (
            <CardComponent
              key={topCard.id}
              card={topCard}
              onClick={() => onCardClick(topCard, `foundation-${suit}`)}
              isSelected={selectedCardId === topCard.id}
            />
          ) : (
            <div className="text-3xl text-green-800 opacity-50">{SUIT_SYMBOLS[suit]}</div>
          )}
        </div>
      );
    })}
  </div>
);
