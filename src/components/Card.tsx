import React from 'react';
import type { Card as CardType } from '../types/game';
import { getCardColor } from '../utils/cardUtils';

interface CardProps {
  card: CardType;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
}

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

export const Card: React.FC<CardProps> = ({ card, onClick, className = '', isSelected = false }) => {
  if (!card.isFaceUp) {
    return (
      <div 
        onClick={onClick}
        className={`w-20 h-28 bg-blue-800 rounded-lg border-2 border-white shadow-md flex items-center justify-center cursor-pointer ${className}`}
      >
        <div className="w-16 h-24 border border-blue-600 rounded opacity-50 bg-pattern"></div>
      </div>
    );
  }

  const color = getCardColor(card.suit);
  const colorClass = color === 'red' ? 'text-red-600' : 'text-black';
  const selectedClass = isSelected ? 'ring-2 ring-yellow-400 transform -translate-y-2' : '';

  return (
    <div 
      onClick={onClick}
      className={`w-20 h-28 bg-white rounded-lg border border-gray-300 shadow-md flex flex-col justify-between p-1 cursor-pointer select-none transition-transform ${colorClass} ${selectedClass} ${className}`}
    >
      <div className="text-left text-sm font-bold leading-none">
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
      
      <div className="text-center text-2xl">{SUIT_SYMBOLS[card.suit]}</div>

      <div className="text-right text-sm font-bold leading-none transform rotate-180">
        <div>{card.rank}</div>
        <div>{SUIT_SYMBOLS[card.suit]}</div>
      </div>
    </div>
  );
};
