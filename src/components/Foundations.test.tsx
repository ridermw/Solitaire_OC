import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { Card, Suit } from '../types/game';
import { Foundations } from './Foundations';

vi.mock('./Card', () => ({
  Card: ({ card, onClick }: { card: Card; onClick?: () => void }) => (
    <button type="button" data-testid={`card-${card.id}`} onClick={onClick}>
      {card.rank}
    </button>
  ),
}));

const createCard = (overrides: Partial<Card>): Card => ({
  id: overrides.id ?? 'card-1',
  suit: overrides.suit ?? 'hearts',
  rank: overrides.rank ?? 'A',
  isFaceUp: overrides.isFaceUp ?? true,
});

const createFoundations = (overrides?: Partial<Record<Suit, Card[]>>): Record<Suit, Card[]> => ({
  hearts: [],
  diamonds: [],
  clubs: [],
  spades: [],
  ...overrides,
});

describe('Foundations', () => {
  it('renders suit placeholders and allows empty click', () => {
    const onEmptyClick = vi.fn();
    render(
      <Foundations
        foundations={createFoundations()}
        onCardClick={vi.fn()}
        onEmptyClick={onEmptyClick}
      />
    );

    const emptySlots = screen.getAllByText((text) => ['♥', '♦', '♣', '♠'].includes(text));
    expect(emptySlots).toHaveLength(4);

    fireEvent.click(emptySlots[0].closest('div') as Element);
    expect(onEmptyClick).toHaveBeenCalledWith('hearts');
  });

  it('renders top cards and triggers card click', () => {
    const topCard = createCard({ id: 'heart-ace', suit: 'hearts' });
    const onCardClick = vi.fn();
    render(
      <Foundations
        foundations={createFoundations({ hearts: [topCard] })}
        onCardClick={onCardClick}
        onEmptyClick={vi.fn()}
        selectedCardId={topCard.id}
      />
    );

    fireEvent.click(screen.getByTestId('card-heart-ace'));
    expect(onCardClick).toHaveBeenCalledWith(topCard, 'foundation-hearts');
  });
});
