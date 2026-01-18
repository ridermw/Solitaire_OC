import { AnimatePresence, motion } from 'framer-motion';
import { Card as CardComponent } from './Card';
import type { Card } from '../types/game';

interface TableauProps {
  piles: Card[][];
  selectedCardId?: string;
  isDealing: boolean;
  onCardClick: (card: Card, pileIndex: number, cardIndex: number) => void;
  onCardDragEnd: (card: Card, pileIndex: number, cardIndex: number, point: { x: number; y: number }) => void;
  onEmptyClick: (pileIndex: number) => void;
}

export const Tableau = ({
  piles,
  selectedCardId,
  isDealing,
  onCardClick,
  onCardDragEnd,
  onEmptyClick,
}: TableauProps) => (
  <div className="flex justify-between gap-2 md:gap-4 mt-12">
    {piles.map((pile, pileIndex) => (
      <div
        key={pileIndex}
        className="relative w-24 h-96"
        onClick={() => {
          if (pile.length === 0) {
            onEmptyClick(pileIndex);
          }
        }}
        data-drop-zone={`tableau-${pileIndex}`}
      >
        {pile.length === 0 && (
          <div className="w-24 h-36 border border-green-700 rounded-lg bg-green-900 bg-opacity-10 absolute top-0 left-0"></div>
        )}

        <AnimatePresence>
          {pile.map((card, cardIndex) => (
            <motion.div
              key={card.id}
              className="absolute"
              style={{ zIndex: cardIndex }}
              initial={
                isDealing
                  ? {
                      x: -200 + pileIndex * -50,
                      y: -200,
                      opacity: 0,
                      scale: 0.5,
                    }
                  : false
              }
              animate={{
                x: 0,
                y: cardIndex * 24,
                opacity: 1,
                scale: 1,
              }}
              transition={{
                delay: isDealing ? pileIndex * 0.1 + cardIndex * 0.05 : 0,
                type: 'spring',
                stiffness: 200,
                damping: 25,
              }}
            >
              <CardComponent
                card={card}
                onClick={() => onCardClick(card, pileIndex, cardIndex)}
                onDragEnd={
                  card.isFaceUp
                    ? (_event, info, draggedCard) => {
                        onCardDragEnd(draggedCard, pileIndex, cardIndex, {
                          x: info.point.x,
                          y: info.point.y,
                        });
                      }
                    : undefined
                }
                isSelected={selectedCardId === card.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    ))}
  </div>
);
