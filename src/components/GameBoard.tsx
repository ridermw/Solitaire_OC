import type { Card, Suit } from '../types/game';
import { Foundations } from './Foundations';
import { StockPile } from './StockPile';
import { Tableau } from './Tableau';
import { WastePile } from './WastePile';

interface GameBoardProps {
  stockCount: number;
  waste: Card[];
  foundations: Record<Suit, Card[]>;
  tableau: Card[][];
  selectedCardId?: string;
  isDealing: boolean;
  isGenerating: boolean;
  onDrawCard: () => void;
  onCardClick: (card: Card, source: string, index?: number) => void;
  onEmptyTableauClick: (pileIndex: number) => void;
  onEmptyFoundationClick: (suit: Suit) => void;
  onDragMove: (from: { card: Card; source: string; index?: number }, toSource: string) => void;
}

export const GameBoard = ({
  stockCount,
  waste,
  foundations,
  tableau,
  selectedCardId,
  isDealing,
  isGenerating,
  onDrawCard,
  onCardClick,
  onEmptyTableauClick,
  onEmptyFoundationClick,
  onDragMove,
}: GameBoardProps) => {
  const handleDrop = (point: { x: number; y: number }, from: { card: Card; source: string; index?: number }) => {
    const elem = document.elementFromPoint(point.x, point.y);
    const dropZone = elem?.closest('[data-drop-zone]');

    if (dropZone) {
      const sourceId = dropZone.getAttribute('data-drop-zone');
      if (sourceId) {
        onDragMove(from, sourceId);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between mb-8 gap-4">
        <div className="flex gap-8">
          <StockPile
            hasStock={stockCount > 0}
            onDraw={onDrawCard}
            isDisabled={isGenerating || (stockCount === 0 && waste.length === 0)}
          />
          <WastePile
            waste={waste}
            selectedCardId={selectedCardId}
            onCardClick={(card) => onCardClick(card, 'waste')}
            onCardDragEnd={(card, point) => handleDrop(point, { card, source: 'waste' })}
          />
        </div>

        <Foundations
          foundations={foundations}
          selectedCardId={selectedCardId}
          onCardClick={onCardClick}
          onEmptyClick={onEmptyFoundationClick}
        />
      </div>

      <Tableau
        piles={tableau}
        selectedCardId={selectedCardId}
        isDealing={isDealing}
        onCardClick={(card, pileIndex, cardIndex) => onCardClick(card, `tableau-${pileIndex}`, cardIndex)}
        onCardDragEnd={(card, pileIndex, cardIndex, point) =>
          handleDrop(point, { card, source: `tableau-${pileIndex}`, index: cardIndex })
        }
        onEmptyClick={onEmptyTableauClick}
      />
    </div>
  );
};
