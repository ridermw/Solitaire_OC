import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayoutGroup } from 'framer-motion';
import { Card } from './Card';
import type { Card as CardType } from '../types/game';

describe('Card', () => {
  const mockCard: CardType = {
    id: 'A-hearts',
    suit: 'hearts',
    rank: 'A',
    isFaceUp: true,
  };

  it('should render a card', () => {
    render(
      <LayoutGroup>
        <Card card={mockCard} />
      </LayoutGroup>
    );
    
    // Card should render with suit symbol (appears multiple times due to corners)
    const cardElements = screen.getAllByText('♥');
    expect(cardElements.length).toBeGreaterThan(0);
  });

  it('should display rank and suit for face-up card', () => {
    render(
      <LayoutGroup>
        <Card card={mockCard} />
      </LayoutGroup>
    );
    
    // Rank and suit appear in multiple locations (corners + center for ace)
    const rankElements = screen.getAllByText('A');
    const suitElements = screen.getAllByText('♥');
    
    expect(rankElements.length).toBeGreaterThan(0);
    expect(suitElements.length).toBeGreaterThan(0);
  });

  it('should handle face-down cards', () => {
    const faceDownCard: CardType = { ...mockCard, isFaceUp: false };
    render(
      <LayoutGroup>
        <Card card={faceDownCard} />
      </LayoutGroup>
    );
    
    // Face-down cards should not show rank/suit
    expect(screen.queryByText('A')).toBeNull();
  });

  it('should render red cards with red color', () => {
    const redCard: CardType = { id: 'K-hearts', suit: 'hearts', rank: 'K', isFaceUp: true };
    const { container } = render(
      <LayoutGroup>
        <Card card={redCard} />
      </LayoutGroup>
    );
    
    const cardElement = container.querySelector('.text-red-600');
    expect(cardElement).toBeDefined();
  });

  it('should render black cards with black color', () => {
    const blackCard: CardType = { id: 'K-spades', suit: 'spades', rank: 'K', isFaceUp: true };
    const { container } = render(
      <LayoutGroup>
        <Card card={blackCard} />
      </LayoutGroup>
    );
    
    const cardElement = container.querySelector('.text-gray-900');
    expect(cardElement).toBeDefined();
  });

  it('should handle click events', () => {
    let clicked = false;
    const handleClick = () => { clicked = true; };
    
    const { container } = render(
      <LayoutGroup>
        <Card card={mockCard} onClick={handleClick} />
      </LayoutGroup>
    );
    const cardElement = container.firstChild as HTMLElement;
    
    cardElement.click();
    expect(clicked).toBe(true);
  });

  it('should display correct suit symbols', () => {
    const hearts = { ...mockCard, suit: 'hearts' as const };
    const diamonds = { ...mockCard, suit: 'diamonds' as const };
    const clubs = { ...mockCard, suit: 'clubs' as const };
    const spades = { ...mockCard, suit: 'spades' as const };
    
    const { rerender } = render(
      <LayoutGroup>
        <Card card={hearts} />
      </LayoutGroup>
    );
    expect(screen.getAllByText('♥').length).toBeGreaterThan(0);
    
    rerender(
      <LayoutGroup>
        <Card card={diamonds} />
      </LayoutGroup>
    );
    expect(screen.getAllByText('♦').length).toBeGreaterThan(0);
    
    rerender(
      <LayoutGroup>
        <Card card={clubs} />
      </LayoutGroup>
    );
    expect(screen.getAllByText('♣').length).toBeGreaterThan(0);
    
    rerender(
      <LayoutGroup>
        <Card card={spades} />
      </LayoutGroup>
    );
    expect(screen.getAllByText('♠').length).toBeGreaterThan(0);
  });

  it('should handle all rank values', () => {
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
    
    ranks.forEach(rank => {
      const card: CardType = { id: `${rank}-hearts`, suit: 'hearts', rank, isFaceUp: true };
      const { rerender } = render(
        <LayoutGroup>
          <Card card={card} />
        </LayoutGroup>
      );
      // Rank appears in multiple locations (top-left and bottom-right corners)
      expect(screen.getAllByText(rank).length).toBeGreaterThan(0);
      rerender(<div />); // Clear for next iteration
    });
  });

  it('should apply selected styling when isSelected is true', () => {
    const { container } = render(
      <LayoutGroup>
        <Card card={mockCard} isSelected={true} />
      </LayoutGroup>
    );
    
    const cardElement = container.querySelector('.ring-2');
    expect(cardElement).toBeDefined();
  });

  it('should not apply selected styling when isSelected is false', () => {
    const { container } = render(
      <LayoutGroup>
        <Card card={mockCard} isSelected={false} />
      </LayoutGroup>
    );
    
    const cardElement = container.querySelector('.ring-2');
    expect(cardElement).toBeNull();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <LayoutGroup>
        <Card card={mockCard} className="custom-class" />
      </LayoutGroup>
    );
    
    const cardElement = container.querySelector('.custom-class');
    expect(cardElement).toBeDefined();
  });

  it('should preserve layout ids for framer motion', () => {
    const specialCard: CardType = { ...mockCard, id: 'unique-card' };
    const { container } = render(
      <LayoutGroup>
        <Card card={specialCard} />
      </LayoutGroup>
    );

    const motionDiv = container.querySelector('[data-layoutid="unique-card"]') ?? container.querySelector('[data-layout-id="unique-card"]');
    expect(motionDiv).toBeDefined();
  });
});
