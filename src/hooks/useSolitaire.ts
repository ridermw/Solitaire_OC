import { useState, useEffect } from 'react';
import { getRankValue, isOppositeColor } from '../utils/cardUtils';
import { dealNewGame } from '../utils/gameLogic';
import { isGameWinnable } from '../utils/solver';
import type { Card, GameState, Suit } from '../types/game';

const INITIAL_GAME_STATE: GameState = {
  stock: [],
  waste: [],
  foundations: {
    hearts: [],
    diamonds: [],
    clubs: [],
    spades: [],
  },
  tableau: [[], [], [], [], [], [], []],
  score: 0,
};

export const useSolitaire = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [selectedCard, setSelectedCard] = useState<{ card: Card, source: string, index?: number } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [drawCount, setDrawCount] = useState<1 | 3>(1);

  useEffect(() => {
    startNewGame();
  }, []); // Run only on mount

  const startNewGame = async (overrideDrawCount?: 1 | 3) => {
    setIsGenerating(true);
    const count = overrideDrawCount ?? drawCount;

    // Use setTimeout to allow UI to render loading state if needed
    setTimeout(() => {
        let attempts = 0;
        let winnableGame: GameState | null = null;
        
        while (attempts < 20 && !winnableGame) { 
            const candidate = dealNewGame();
            if (isGameWinnable(candidate, count)) { // Pass draw count to solver
                winnableGame = candidate;
            }
            attempts++;
        }

        // Fallback
        if (!winnableGame) {
             console.warn("Could not find provably winnable game in attempts, dealing random.");
             winnableGame = dealNewGame();
        }

        setGameState(winnableGame);
        setSelectedCard(null);
        setIsGenerating(false);
    }, 10);
  };

  const changeDrawCount = (newCount: 1 | 3) => {
      setDrawCount(newCount);
      startNewGame(newCount);
  };

  const drawCard = () => {
    if (gameState.stock.length === 0) {
      // Recycle waste to stock
      const newStock = [...gameState.waste].reverse().map(c => ({ ...c, isFaceUp: false }));
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [],
      }));
    } else {
      const newStock = [...gameState.stock];
      const cardsToDraw: Card[] = [];
      
      const count = Math.min(drawCount, newStock.length);
      for (let i = 0; i < count; i++) {
           const card = newStock.pop()!;
           card.isFaceUp = true;
           cardsToDraw.push(card);
      }
      
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [...prev.waste, ...cardsToDraw],
      }));
    }
    setSelectedCard(null);
  };

  const handleCardClick = (card: Card, source: string, index?: number) => {
    if (!card.isFaceUp && source.startsWith('tableau')) {
        return;
    }

    // If card is from stock (and facedown), ignore (drawCard handles clicks on stock pile itself)
    if (source === 'stock') return;

    if (!selectedCard) {
      // Select card if valid source
      if (source === 'waste' || source.startsWith('tableau') || source.startsWith('foundation')) {
         setSelectedCard({ card, source, index });
      }
    } else {
      // Attempt move
      if (selectedCard.card.id === card.id) {
        setSelectedCard(null); // Deselect
      } else {
        attemptMove(selectedCard, { source, index });
      }
    }
  };

  const attemptMove = (
    from: { card: Card, source: string, index?: number },
    to: { source: string, index?: number }
  ) => {
    // Logic for moving to Foundation
    if (to.source.startsWith('foundation')) {
      const suit = to.source.split('-')[1] as Suit;
      if (from.card.suit === suit) {
        const foundationPile = gameState.foundations[suit];
        const targetRankVal = foundationPile.length > 0 ? getRankValue(foundationPile[foundationPile.length - 1].rank) : 0;
        
        if (getRankValue(from.card.rank) === targetRankVal + 1) {
             executeMove(from, to);
             return;
        }
      }
    }

    // Logic for moving to Tableau
    if (to.source.startsWith('tableau')) {
        const tableauIndex = parseInt(to.source.split('-')[1]);
        const targetPile = gameState.tableau[tableauIndex];
        
        if (targetPile.length === 0) {
            // Only King can go to empty tableau
            if (from.card.rank === 'K') {
                executeMove(from, to);
            }
        } else {
            const targetCard = targetPile[targetPile.length - 1];
            if (isOppositeColor(from.card, targetCard) && getRankValue(from.card.rank) === getRankValue(targetCard.rank) - 1) {
                executeMove(from, to);
            }
        }
    }

    setSelectedCard(null);
  };
  
  const handleEmptyTableauClick = (tableauIndex: number) => {
      if (selectedCard && selectedCard.card.rank === 'K') {
          executeMove(selectedCard, { source: `tableau-${tableauIndex}` });
      }
  };

  const executeMove = (
    from: { card: Card, source: string, index?: number },
    to: { source: string, index?: number }
  ) => {
      let newGameState = { ...gameState };
      let cardsToMove: Card[] = [];

      // Remove from source
      if (from.source === 'waste') {
          newGameState.waste = newGameState.waste.slice(0, -1);
          cardsToMove = [from.card];
      } else if (from.source.startsWith('tableau')) {
          const tIndex = parseInt(from.source.split('-')[1]);
          const splitIndex = from.index!; // Must exist for tableau source
          cardsToMove = newGameState.tableau[tIndex].slice(splitIndex);
          newGameState.tableau[tIndex] = newGameState.tableau[tIndex].slice(0, splitIndex);
          
          // Flip new top card if needed
          if (newGameState.tableau[tIndex].length > 0) {
              const topCard = newGameState.tableau[tIndex][newGameState.tableau[tIndex].length - 1];
              if (!topCard.isFaceUp) {
                   // Clone to avoid mutation
                   const newTop = { ...topCard, isFaceUp: true };
                   newGameState.tableau[tIndex][newGameState.tableau[tIndex].length - 1] = newTop;
              }
          }
      } else if (from.source.startsWith('foundation')) {
          const suit = from.source.split('-')[1] as Suit;
          newGameState.foundations[suit] = newGameState.foundations[suit].slice(0, -1);
          cardsToMove = [from.card];
      }

      // Add to destination
      if (to.source.startsWith('tableau')) {
          const tIndex = parseInt(to.source.split('-')[1]);
          newGameState.tableau[tIndex] = [...newGameState.tableau[tIndex], ...cardsToMove];
      } else if (to.source.startsWith('foundation')) {
          const suit = to.source.split('-')[1] as Suit;
          // Foundations can only take one card at a time
          if (cardsToMove.length === 1) {
              newGameState.foundations[suit] = [...newGameState.foundations[suit], ...cardsToMove];
          } else {
              return; 
          }
      }

      setGameState(newGameState);
      setSelectedCard(null);
  };

  return {
    gameState,
    selectedCard,
    isGenerating,
    drawCount,
    startNewGame,
    changeDrawCount,
    drawCard,
    handleCardClick,
    handleEmptyTableauClick,
  };
};
