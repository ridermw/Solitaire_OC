import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DrawCountModal } from './components/DrawCountModal';
import { GameBoard } from './components/GameBoard';
import { TopBar } from './components/TopBar';
import { WinAnimation } from './components/WinAnimation';
import { useSolitaire } from './hooks/useSolitaire';

function App() {
  const {
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
    canUndo,
    isWon,
    isNextDeckReady,
  } = useSolitaire();

  const [showDrawChangeModal, setShowDrawChangeModal] = useState<1 | 3 | null>(null);

  const handleDrawChangeRequest = (newCount: 1 | 3) => {
    if (newCount !== drawCount) {
      setShowDrawChangeModal(newCount);
    }
  };

  const confirmDrawChange = () => {
    if (showDrawChangeModal) {
      changeDrawCount(showDrawChangeModal);
      setShowDrawChangeModal(null);
    }
  };

  return (
    <div key={gameKey} className="min-h-screen bg-felt-green text-white p-4 font-sans select-none overflow-hidden relative">
      <div className="max-w-4xl mx-auto">
        <TopBar
          autoMoveEnabled={autoMoveEnabled}
          toggleAutoMove={toggleAutoMove}
          drawCount={drawCount}
          isGenerating={isGenerating}
          isNextDeckReady={isNextDeckReady}
          deckId={deckId}
          onDeckIdChange={setDeckId}
          onLoadDeck={loadDeckById}
          onDrawCountChange={handleDrawChangeRequest}
          startNewGame={startNewGame}
          undo={undo}
          canUndo={canUndo}
        />

          <GameBoard
            stockCount={gameState.stock.length}
            waste={gameState.waste}
            foundations={gameState.foundations}
            tableau={gameState.tableau}
            selectedCardId={selectedCard?.card.id}
            isDealing={isDealing}
            isGenerating={isGenerating}
            onDrawCard={drawCard}
            onCardClick={handleCardClick}
            onEmptyTableauClick={handleEmptyTableauClick}
            onEmptyFoundationClick={(suit) => {
              if (selectedCard) {
                handleCardClick(selectedCard.card, `foundation-${suit}`);
              }
            }}
            onDragMove={handleDragMove}
          />

      </div>

      <div className="fixed bottom-4 right-4 text-xs text-green-200 opacity-70 text-right">
        <div>Click to select, click destination to move.</div>
        <div>v{import.meta.env.VITE_APP_VERSION}</div>
      </div>

      <AnimatePresence>{isWon && <WinAnimation onRestart={() => startNewGame()} />}</AnimatePresence>

      <DrawCountModal
        pendingDrawCount={showDrawChangeModal}
        onCancel={() => setShowDrawChangeModal(null)}
        onConfirm={confirmDrawChange}
      />
    </div>
  );
}

export default App;
