import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card as CardComponent } from './Card';
import type { Card } from '../types/game';

interface WastePileProps {
  waste: Card[];
  selectedCardId?: string;
  onCardClick: (card: Card) => void;
  onCardDragEnd: (card: Card, point: { x: number; y: number }) => void;
}

export const WastePile = ({ waste, selectedCardId, onCardClick, onCardDragEnd }: WastePileProps) => {
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);

  if (waste.length === 0) return <div className="relative w-24 h-36"></div>;

  const visibleCount = 3;
  const startIndex = Math.max(0, waste.length - visibleCount);
  const visibleWaste = waste.slice(startIndex);

  return (
    <div className="relative w-24 h-36">
      <AnimatePresence>
        {visibleWaste.map((card, idx) => {
          const isTopCard = idx === visibleWaste.length - 1;
          const offset = idx * 24;

          return (
            <motion.div
              key={card.id}
              className="absolute top-0 left-0"
              style={{ zIndex: draggingCardId === card.id ? 1000 : idx }}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: offset, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <CardComponent
                card={card}
                onClick={() => {
                  if (isTopCard) {
                    onCardClick(card);
                  }
                }}
                onDragStart={isTopCard ? () => setDraggingCardId(card.id) : undefined}
                onDragEnd={
                  isTopCard
                    ? (_event, info, draggedCard) => {
                        setDraggingCardId(null);
                        onCardDragEnd(draggedCard, { x: info.point.x, y: info.point.y });
                      }
                    : undefined
                }
                isSelected={isTopCard && selectedCardId === card.id}
                className={!isTopCard ? 'brightness-90' : ''}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
