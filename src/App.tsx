import { useState } from 'react';
import { useSolitaire } from './hooks/useSolitaire';
import { Card as CardComponent } from './components/Card';
import type { Suit } from './types/game';

function App() {
  const { 
    gameState, 
    selectedCard, 
    isGenerating, 
    drawCount,
    startNewGame, 
    changeDrawCount, 
    drawCard, 
    handleCardClick, 
    handleEmptyTableauClick 
  } = useSolitaire();

  const [showDrawChangeModal, setShowDrawChangeModal] = useState<1 | 3 | null>(null);

  const handleDrawChangeRequest = (newCount: 1 | 3) => {
      // Check if game is in progress (simplistic check: score > 0 or moves made? 
      // Actually, any state change from initial dealing is "in progress".
      // For simplicity, let's just always show the modal if the count is different,
      // because changing draw count effectively requires a new deal to be fair/winnable usually,
      // or at least the user asked to "warn them".
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
    <div className="min-h-screen bg-felt-green text-white p-4 font-sans select-none overflow-hidden relative">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-wider text-yellow-100 shadow-sm">Solitaire</h1>
          
          <div className="flex gap-4 items-center">
              {/* Draw Count Dropdown */}
              <div className="flex items-center gap-2 text-sm bg-green-800 rounded px-2 py-1 border border-green-600">
                  <label htmlFor="drawCount" className="text-green-200">Draw:</label>
                  <select 
                      id="drawCount"
                      value={drawCount}
                      onChange={(e) => handleDrawChangeRequest(Number(e.target.value) as 1 | 3)}
                      disabled={isGenerating}
                      className="bg-green-900 text-white rounded px-1 outline-none border border-green-700 cursor-pointer"
                  >
                      <option value={1}>1 Card</option>
                      <option value={3}>3 Cards</option>
                  </select>
              </div>

              <button 
                onClick={() => startNewGame()}
                disabled={isGenerating}
                className={`px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded border border-green-600 shadow-lg transition-colors flex items-center ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isGenerating ? 'Dealing...' : 'New Game'}
              </button>
          </div>
        </div>

        {/* Top Section: Stock, Waste, Foundations */}
        <div className="flex justify-between mb-8 gap-4">
          <div className="flex gap-4">
            {/* Stock */}
            <div onClick={drawCard} className="relative w-20 h-28 cursor-pointer">
               {gameState.stock.length > 0 ? (
                 <div className="w-20 h-28 bg-blue-800 rounded-lg border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-16 h-24 border border-blue-600 rounded opacity-50 bg-pattern"></div>
                    {/* Draw count indicator overlay */}
                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
                        {drawCount}
                    </div>
                 </div>
               ) : (
                 <div className="w-20 h-28 border-2 border-green-700 rounded-lg flex items-center justify-center text-green-700 font-bold text-2xl">↺</div>
               )}
            </div>

            {/* Waste */}
            <div className="relative w-20 h-28">
              {/* Show slightly fanned waste if we have multiple cards? For now just top card */}
              {gameState.waste.length > 0 && (
                <div className="relative">
                    {/* Visual hint of pile depth if needed, or simplified to just top card logic for now */}
                    <CardComponent 
                    card={gameState.waste[gameState.waste.length - 1]} 
                    onClick={() => handleCardClick(gameState.waste[gameState.waste.length - 1], 'waste')}
                    isSelected={selectedCard?.card.id === gameState.waste[gameState.waste.length - 1].id}
                    />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            {/* Foundations */}
            {(['hearts', 'diamonds', 'clubs', 'spades'] as Suit[]).map((suit) => (
              <div 
                key={suit} 
                className="w-20 h-28 border-2 border-green-700 rounded-lg flex items-center justify-center bg-green-900 bg-opacity-20"
                onClick={() => {
                   if (gameState.foundations[suit].length === 0 && selectedCard) {
                       handleCardClick(selectedCard.card, `foundation-${suit}`);
                   }
                }}
              >
                 {gameState.foundations[suit].length > 0 ? (
                   <CardComponent 
                      card={gameState.foundations[suit][gameState.foundations[suit].length - 1]} 
                      onClick={() => handleCardClick(gameState.foundations[suit][gameState.foundations[suit].length - 1], `foundation-${suit}`)}
                      isSelected={selectedCard?.card.id === gameState.foundations[suit][gameState.foundations[suit].length - 1].id}
                   />
                 ) : (
                   <div className="text-3xl text-green-800 opacity-50">
                      {suit === 'hearts' ? '♥' : suit === 'diamonds' ? '♦' : suit === 'clubs' ? '♣' : '♠'}
                   </div>
                 )}
              </div>
            ))}
          </div>
        </div>

        {/* Tableau */}
        <div className="flex justify-between gap-2 md:gap-4">
          {gameState.tableau.map((pile, pileIndex) => (
            <div 
              key={pileIndex} 
              className="relative w-20 h-96"
              onClick={() => {
                  if (pile.length === 0) {
                      handleEmptyTableauClick(pileIndex);
                  }
              }}
            >
               {/* Empty placeholder */}
               {pile.length === 0 && (
                   <div className="w-20 h-28 border border-green-700 rounded-lg bg-green-900 bg-opacity-10 absolute top-0 left-0"></div>
               )}

               {pile.map((card, cardIndex) => (
                 <div 
                    key={card.id} 
                    className="absolute" 
                    style={{ top: `${cardIndex * 1.5}rem` }}
                 >
                   <CardComponent 
                      card={card}
                      onClick={() => {
                          handleCardClick(card, `tableau-${pileIndex}`, cardIndex);
                      }}
                      isSelected={selectedCard?.card.id === card.id}
                   />
                 </div>
               ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* Help / Instructions */}
      <div className="fixed bottom-4 right-4 text-xs text-green-200 opacity-70">
          Click to select, click destination to move.
      </div>

      {/* Confirmation Modal */}
      {showDrawChangeModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
              <div className="bg-white text-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border-2 border-green-800">
                  <h3 className="text-xl font-bold mb-4">Start New Game?</h3>
                  <p className="mb-6 text-gray-600">
                      Changing the draw count requires starting a new game to ensure it is winnable. 
                      Your current progress will be lost.
                  </p>
                  <div className="flex justify-end gap-3">
                      <button 
                          onClick={() => setShowDrawChangeModal(null)}
                          className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
                      >
                          Cancel
                      </button>
                      <button 
                          onClick={confirmDrawChange}
                          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
                      >
                          New Game
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;
