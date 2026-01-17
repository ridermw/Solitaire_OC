import { useSolitaire } from './hooks/useSolitaire';
import { Card as CardComponent } from './components/Card';
import type { Suit } from './types/game';

function App() {
  const { gameState, selectedCard, startNewGame, drawCard, handleCardClick, handleEmptyTableauClick } = useSolitaire();

  return (
    <div className="min-h-screen bg-felt-green text-white p-4 font-sans select-none overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-wider text-yellow-100 shadow-sm">Solitaire</h1>
          <button 
            onClick={startNewGame}
            className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded border border-green-600 shadow-lg transition-colors"
          >
            New Game
          </button>
        </div>

        {/* Top Section: Stock, Waste, Foundations */}
        <div className="flex justify-between mb-8 gap-4">
          <div className="flex gap-4">
            {/* Stock */}
            <div onClick={drawCard} className="relative w-20 h-28 cursor-pointer">
               {gameState.stock.length > 0 ? (
                 <div className="w-20 h-28 bg-blue-800 rounded-lg border-2 border-white shadow-md flex items-center justify-center">
                    <div className="w-16 h-24 border border-blue-600 rounded opacity-50 bg-pattern"></div>
                 </div>
               ) : (
                 <div className="w-20 h-28 border-2 border-green-700 rounded-lg flex items-center justify-center text-green-700 font-bold text-2xl">↺</div>
               )}
            </div>

            {/* Waste */}
            <div className="relative w-20 h-28">
              {gameState.waste.length > 0 && (
                <CardComponent 
                  card={gameState.waste[gameState.waste.length - 1]} 
                  onClick={() => handleCardClick(gameState.waste[gameState.waste.length - 1], 'waste')}
                  isSelected={selectedCard?.card.id === gameState.waste[gameState.waste.length - 1].id}
                />
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
    </div>
  );
}

export default App;
