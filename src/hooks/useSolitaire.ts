import { useState, useEffect, useRef } from 'react';
import { getRankValue, isOppositeColor } from '../utils/cardUtils';
import { dealGameFromDeckOrder } from '../utils/gameLogic';
import { getRandomDeckId } from '../utils/deckIdStore';
import { decodeDeckId } from '../utils/solver';
import { logGameEvent } from '../utils/logger';
import { playCardFlipSound, playMoveSound, playShuffleSound, playWinSound } from '../utils/audio';
import { cloneGameState } from '../utils/cloneGameState';
import type { Card, GameState, Suit } from '../types/game';
import { isValidDrawCount } from '../types/game';

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
  const [drawCount, setDrawCount] = useState<1 | 3>(3); // Default to 3
  const drawCountRef = useRef<1 | 3>(3); // Track current drawCount for async operations
  const [autoMoveEnabled, setAutoMoveEnabled] = useState(true); // Default to Auto Move On
  const [deckId, setDeckId] = useState('');
  // Track queued deck with the draw count it was generated for
  const [nextDeck, setNextDeck] = useState<{ id: string; drawCount: 1 | 3 } | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const isMountedRef = useRef(true);
  
  // Animation state for dealing
  const [isDealing, setIsDealing] = useState(false);
  const [gameKey, setGameKey] = useState(0);
  // Undo history stack
  const [history, setHistory] = useState<GameState[]>([]);

  // Helper to deep clone state to avoid reference mutation issues
  const cloneState = cloneGameState;

  // Helper to push current state to history before mutation
  const pushToHistory = (currentState: GameState) => {
    setHistory(prev => [...prev, cloneState(currentState)]);
  };

  const undo = () => {
      if (history.length === 0) return;
      
      const previousState = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setGameState(previousState);
      setSelectedCard(null);
      logGameEvent('Undo Performed');
  };

  const queueNextDeck = (count: 1 | 3) => {
    if (workerRef.current) {
      workerRef.current.postMessage({ drawCount: count });
    }
  };

  const startGameWithDeckId = async (
    selectedDeckId: string,
    count: 1 | 3,
    bumpKey: boolean
  ) => {
    if (bumpKey) {
      setGameKey(prev => prev + 1);
    }

    setIsGenerating(true);
    setIsDealing(true);

    setHistory([]);
    setGameState({
        stock: [],
        waste: [],
        foundations: {
            hearts: [],
            diamonds: [],
            clubs: [],
            spades: []
        },
        tableau: [[],[],[],[],[],[],[]],
        score: 0
    });
    setSelectedCard(null);

    logGameEvent('Starting Winnable Game', { drawCount: count, deckId: selectedDeckId });
    playShuffleSound();

    try {
      const deckOrder = decodeDeckId(selectedDeckId);
      const foundGame = dealGameFromDeckOrder(deckOrder);

      setDeckId(selectedDeckId);
      logGameEvent('Game Generated', { score: foundGame.score, deckId: selectedDeckId });
      setGameState(foundGame);
      setSelectedCard(null);
      setIsGenerating(false);
      setIsDealing(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logGameEvent('Deck Load Failed', { deckId: selectedDeckId, message });
      // Clear the invalid deck ID from input
      setDeckId('');
      setIsGenerating(false);
      setIsDealing(false);
      
      // If we have a next deck ready for this draw count, start a new game to recover
      // Otherwise the user will need to wait for generation or enter a valid ID
      if (nextDeck && nextDeck.drawCount === count) {
        const recoveryDeckId = nextDeck.id;
        setNextDeck(null);
        // Use setTimeout to avoid state update during render
        setTimeout(() => {
          startGameWithDeckId(recoveryDeckId, count, false);
          queueNextDeck(count);
        }, 0);
      }
    }
  };

  const startNewGame = async (overrideDrawCount?: 1 | 3) => {
    const count = isValidDrawCount(overrideDrawCount) ? overrideDrawCount : drawCount;

    // Only use queued deck if it was generated for the current draw count
    if (!nextDeck || nextDeck.drawCount !== count) {
      // Invalidate stale deck and request a new one for the correct draw count
      setNextDeck(null);
      queueNextDeck(count);
      return;
    }

    const selectedDeckId = nextDeck.id;
    setNextDeck(null);

    await startGameWithDeckId(selectedDeckId, count, true);
    queueNextDeck(count);
  };

  useEffect(() => {
    isMountedRef.current = true;

    const loadDeckIds = async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}winnable-decks.json`);
        if (!isMountedRef.current) return;
        
        const data = await response.json();
        if (!isMountedRef.current) return;
        
        if (Array.isArray(data)) {
          const ids = data.filter((id): id is string => typeof id === 'string');
          const initialId = getRandomDeckId(ids);
          if (initialId) {
            // Use ref to get current drawCount (avoids stale closure)
            const currentDrawCount = drawCountRef.current;
            setNextDeck({ id: initialId, drawCount: currentDrawCount });
            startGameWithDeckId(initialId, currentDrawCount, false);
            queueNextDeck(currentDrawCount);
          }
        }
      } catch (error) {
        if (!isMountedRef.current) return;
        const message = error instanceof Error ? error.message : String(error);
        logGameEvent('Deck List Load Failed', { message });
      }
    };

    const startWorker = () => {
      const worker = new Worker(new URL('../workers/winnableDeckWorker.ts', import.meta.url), { type: 'module' });
      worker.onmessage = (event: MessageEvent<{
        deckId: string | null;
        drawCount: 1 | 3;
        status?: 'attempt-start' | 'attempt-end';
        attempt?: number;
        success?: boolean;
      }>) => {
        if (!isMountedRef.current) {
          return;
        }

        if (event.data.status === 'attempt-start') {
          console.log('Winnable deck attempt started', { attempt: event.data.attempt });
          return;
        }

        if (event.data.status === 'attempt-end') {
          console.log('Winnable deck attempt finished', {
            attempt: event.data.attempt,
            success: event.data.success,
            deckId: event.data.deckId,
          });
          return;
        }

        // Only store the deck if it was successfully generated
        if (event.data.deckId) {
          setNextDeck({ id: event.data.deckId, drawCount: event.data.drawCount });
        }
      };
      workerRef.current = worker;
    };

    loadDeckIds();
    startWorker();

    return () => {
      isMountedRef.current = false;
      workerRef.current?.terminate();
      workerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeDrawCount = (newCount: 1 | 3) => {
      setDrawCount(newCount);
      drawCountRef.current = newCount;
      startNewGame(newCount);
  };

  const toggleAutoMove = () => {
      setAutoMoveEnabled(prev => !prev);
  };

  const drawCard = () => {
    logGameEvent('Draw Clicked', {
      isGenerating,
      isDealing,
      drawCount,
      stockCount: gameState.stock.length,
      wasteCount: gameState.waste.length,
    });

    if (isGenerating) {
      logGameEvent('Draw Blocked', { reason: 'generating' });
      return;
    }

    if (gameState.stock.length === 0 && gameState.waste.length === 0) {
      logGameEvent('Draw Blocked', { reason: 'empty' });
      return;
    }

    pushToHistory(gameState);

    if (gameState.stock.length === 0) {
      logGameEvent('Stock Recycled', { wasWasteSize: gameState.waste.length });
      // Recycle waste to stock
      const newStock = [...gameState.waste].reverse().map(c => ({ ...c, isFaceUp: false }));
      setGameState(prev => ({
        ...prev,
        stock: newStock,
        waste: [],
      }));
      playCardFlipSound();
      setSelectedCard(null);
      return;
    }

    const newStock = [...gameState.stock];
    const cardsToDraw: Card[] = [];

    const count = Math.min(drawCount, newStock.length);
    for (let i = 0; i < count; i++) {
      const card = newStock.pop();
      if (!card) {
        break;
      }
      card.isFaceUp = true;
      cardsToDraw.push(card);
    }

    if (cardsToDraw.length === 0) {
      logGameEvent('Draw Blocked', {
        reason: 'no-cards-drawn',
        stockCount: gameState.stock.length,
        filteredStockCount: newStock.length,
        drawCount,
      });
      return;
    }

    logGameEvent('Cards Drawn', { count: cardsToDraw.length, cards: cardsToDraw });

    setGameState(prev => ({
      ...prev,
      stock: newStock,
      waste: [...prev.waste, ...cardsToDraw],
    }));
    playCardFlipSound();
    setSelectedCard(null);
  };

  const loadDeckById = () => {
    if (!deckId) {
      return;
    }

    startGameWithDeckId(deckId, drawCount, true);
  };

  const handleCardClick = (card: Card, source: string, index?: number) => {
    if (!card.isFaceUp && source.startsWith('tableau')) {
        return;
    }

    // If card is from stock (and facedown), ignore (drawCard handles clicks on stock pile itself)
    if (source === 'stock') return;

    const isTableauSource = source.startsWith('tableau');
    const isTopTableauCard = isTableauSource
      ? index === gameState.tableau[parseInt(source.split('-')[1])].length - 1
      : true;

    if (autoMoveEnabled) {
         // Try to find a valid move immediately
         if (attemptAutoMove({ card, source, index }, isTopTableauCard)) {
             setSelectedCard(null); // Clear selection if moved
             return;
         }
         // If no move found, standard UX is to select it if it can't move, so manual move is possible.
    }

    if (!selectedCard) {
      // Select card if valid source
      if (source === 'waste' || source.startsWith('tableau') || source.startsWith('foundation')) {
         logGameEvent('Card Selected', { card, source, index });
         setSelectedCard({ card, source, index });
      }
    } else {
      // Attempt move
      if (selectedCard.card.id === card.id) {
        logGameEvent('Card Deselected', { card });
        setSelectedCard(null); // Deselect
      } else {
        logGameEvent('Move Attempted (Click)', { from: selectedCard, to: { source, index } });
        attemptMove(selectedCard, { source, index });
      }
    }
  };

  const attemptAutoMove = (
    from: { card: Card, source: string, index?: number },
    isTopTableauCard: boolean
  ): boolean => {
      const isTableauSource = from.source.startsWith('tableau');
      const tableauIndex = isTableauSource ? parseInt(from.source.split('-')[1]) : null;
      const tableauCards = isTableauSource && tableauIndex !== null
        ? gameState.tableau[tableauIndex].slice(from.index ?? 0)
        : [from.card];
      const hasFaceDownCard = tableauCards.some(card => !card.isFaceUp);

      const isValidRun = () => {
        if (tableauCards.length <= 1) {
          return true;
        }

        for (let i = 0; i < tableauCards.length - 1; i += 1) {
          const current = tableauCards[i];
          const next = tableauCards[i + 1];
          if (!isOppositeColor(current, next)) return false;
          if (getRankValue(current.rank) !== getRankValue(next.rank) + 1) return false;
        }

        return true;
      };

      // Priority 1: Move to Foundation
      if (!isTableauSource || isTopTableauCard) {
        const suit = from.card.suit;
        const foundationPile = gameState.foundations[suit];
        const targetRankVal = foundationPile.length > 0 ? getRankValue(foundationPile[foundationPile.length - 1].rank) : 0;

        if (getRankValue(from.card.rank) === targetRankVal + 1) {
          logGameEvent('Auto Move Success (Foundation)', { card: from.card, target: `foundation-${suit}` });
          executeMove(from, { source: `foundation-${suit}` });
          return true;
        }
      }

      // Priority 2: Move to Tableau
      if (hasFaceDownCard || !isValidRun()) {
        logGameEvent('Auto Move Failed', { card: from.card });
        return false;
      }

      const isKing = from.card.rank === 'K';

      for (let i = 0; i < 7; i++) {
          const pile = gameState.tableau[i];
          if (pile.length === 0) {
              if (isKing) {
                   if (from.source.startsWith('tableau') && from.index === 0) continue;
                   logGameEvent('Auto Move Success (Tableau King)', { card: from.card, target: `tableau-${i}` });
                   executeMove(from, { source: `tableau-${i}` });
                   return true;
              }
          } else {
              const targetCard = pile[pile.length - 1];
              if (isOppositeColor(from.card, targetCard) && getRankValue(from.card.rank) === getRankValue(targetCard.rank) - 1) {
                  logGameEvent('Auto Move Success (Tableau)', { card: from.card, target: `tableau-${i}` });
                  executeMove(from, { source: `tableau-${i}` });
                  return true;
              }
          }
      }

      logGameEvent('Auto Move Failed', { card: from.card });
      return false;
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
      // For dropping on empty tableau
      if (selectedCard && selectedCard.card.rank === 'K') {
          executeMove(selectedCard, { source: `tableau-${tableauIndex}` });
      }
  };

  // Exposed method for drag and drop to execute a move directly
  const handleDragMove = (from: { card: Card, source: string, index?: number }, toSource: string) => {
       logGameEvent('Move Attempted (Drag)', { from, toSource });
       attemptMove(from, { source: toSource });
  };

  const executeMove = (
    from: { card: Card, source: string, index?: number },
    to: { source: string, index?: number }
  ) => {
      // Save current state to history before executing move
      pushToHistory(gameState);

      // Deep clone current state for the new state to prevent mutation of the state we just pushed to history
      const newGameState = cloneState(gameState);
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
              logGameEvent('Invalid Move (Multiple cards to foundation)', { cardsToMove });
              return; 
          }
      }

      logGameEvent('Move Executed', { from: from.source, to: to.source, cards: cardsToMove.map(c => c.id) });
      setGameState(newGameState);
      playMoveSound();
      setSelectedCard(null);
  };

  useEffect(() => {
    if (Object.values(gameState.foundations).every(pile => pile.length === 13)) {
        playWinSound();
    }
  }, [gameState.foundations]);

  return {
    gameState,
    selectedCard,
    isGenerating,
    isDealing,
    drawCount,
    autoMoveEnabled,
    deckId,
    setDeckId,
    loadDeckById,
    startNewGame,
    changeDrawCount,
    toggleAutoMove,
    drawCard,
    handleCardClick,
    handleEmptyTableauClick,
    handleDragMove,
    gameKey,
    undo,
    canUndo: history.length > 0,
    isWon: Object.values(gameState.foundations).every(pile => pile.length === 13),
    isNextDeckReady: !!nextDeck && nextDeck.drawCount === drawCount,
  };
};
