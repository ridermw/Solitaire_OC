import React from 'react';
import type { Card as CardType, Rank } from '../types/game';
import { getCardColor, getRankValue } from '../utils/cardUtils';
import { motion, useDragControls, type PanInfo } from 'framer-motion';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
  onDragStart?: (card: CardType) => void;
  onDragEnd?: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo, card: CardType) => void;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

// Map number of pips to standard grid positions (row, col) roughly
// We'll use a flex/grid layout helper for this.
const getPips = (rank: string, suit: string) => {
    const value = getRankValue(rank as Rank);
    const symbol = SUIT_SYMBOLS[suit];
    
    // Face cards have special art usually, we'll just use a big centered symbol + J/Q/K text for now or simple pattern
    if (['J', 'Q', 'K'].includes(rank)) {
        return (
            <div className="w-full h-full flex items-center justify-center relative">
                 <div className="text-6xl opacity-20 absolute">{symbol}</div>
                 <div className="text-4xl font-bold z-10">{rank}</div>
            </div>
        );
    }
    
    if (rank === 'A') {
        return (
             <div className="w-full h-full flex items-center justify-center">
                 <div className="text-6xl">{symbol}</div>
            </div>
        );
    }

    // Generate pips for numbers 2-10
    // Simplified column layout approach
    const pipCount = value;

    // Standard patterns
    // 2: Top/Bottom Center (Actually top/bottom middle usually, but let's do simple column distribution)
    // 3: Top/Center/Bottom Center
    // 4: 2 corners Top/Bottom
    // 5: 4 corners + Center
    // 6: 2 rows of 3 usually (side columns)
    // 7: 6 sides + 1 top center
    // 8: 6 sides + 2 center
    // 9: 8 sides + 1 center
    // 10: 8 sides + 2 center (top/bottom)

    // Define active grid cells for each number
    // Let's manually place pips with absolute positioning percentages for "classic" look
    
    const positions: Record<number, number[][]> = {
        2: [[50, 20], [50, 80]], // Top Mid, Bot Mid
        3: [[50, 20], [50, 50], [50, 80]],
        4: [[30, 25], [70, 25], [30, 75], [70, 75]], // Moved closer horizontally and vertically
        5: [[30, 25], [70, 25], [30, 75], [70, 75], [50, 50]],
        6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
        7: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75], [50, 35]],
        8: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75], [50, 35], [50, 65]],
        9: [[30, 25], [70, 25], [30, 42], [70, 42], [30, 58], [70, 58], [30, 75], [70, 75], [50, 50]],
        10: [[30, 25], [70, 25], [30, 42], [70, 42], [30, 58], [70, 58], [30, 75], [70, 75], [50, 30], [50, 70]],
    };

    const currentPos = positions[pipCount];
    if (!currentPos) return <div className="text-4xl">{symbol}</div>;

    return (
        <div className="relative w-full h-full">
            {currentPos.map((pos, i) => (
                <div 
                    key={i} 
                    className="absolute text-xl transform -translate-x-1/2 -translate-y-1/2" 
                    style={{ left: `${pos[0]}%`, top: `${pos[1]}%` }}
                >
                    {symbol}
                </div>
            ))}
        </div>
    );
};

export const Card: React.FC<CardProps> = ({ card, onClick, className = '', isSelected = false, onDragStart, onDragEnd }) => {
  const isFaceUp = card.isFaceUp;
  const color = getCardColor(card.suit);
  const colorClass = color === 'red' ? 'text-red-600' : 'text-black';
  const selectedClass = isSelected ? 'ring-2 ring-yellow-400' : '';
  const controls = useDragControls();

  const cardContent = !isFaceUp ? (
      <div className={`w-24 h-36 bg-blue-800 rounded-lg border-2 border-white shadow-md flex items-center justify-center cursor-pointer ${className}`}>
        <div className="w-20 h-32 border border-blue-600 rounded opacity-50 bg-pattern"></div>
      </div>
  ) : (
    <div 
      className={`w-24 h-36 bg-white rounded-lg border border-gray-300 shadow-md flex flex-col justify-between p-2 cursor-pointer select-none ${colorClass} ${selectedClass} ${className}`}
    >
      <div className="text-left text-lg font-bold leading-none flex flex-col items-center w-6">
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      <div className="absolute inset-4 flex justify-center items-center pointer-events-none">
          {getPips(card.rank, card.suit)}
      </div>

      <div className="text-right text-lg font-bold leading-none transform rotate-180 flex flex-col items-center w-6 self-end">
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  );

  // If face down or not draggable (logic handled by parent usually, but we assume face up cards in play are draggable)
  const isDraggable = isFaceUp && !!onDragEnd;

  return (
    <motion.div
      layoutId={card.id}
      data-layout-id={card.id}
      initial={false}
      onClick={onClick}
      className="relative"
      drag={isDraggable}
      dragSnapToOrigin={true} // Always snap back if not handled
      onDragStart={() => onDragStart?.(card)}
      onDragEnd={(e, info) => onDragEnd && onDragEnd(e, info, card)}
      dragControls={controls}
      dragElastic={0.1}
      whileDrag={{ scale: 1.1, zIndex: 100, cursor: 'grabbing' }}
      whileHover={{ scale: isDraggable ? 1.05 : 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      style={{ touchAction: 'none' }} // Prevent scrolling on mobile while dragging
    >
        {cardContent}
    </motion.div>
  );
};
