import type { ChangeEvent } from 'react';

interface TopBarProps {
  autoMoveEnabled: boolean;
  toggleAutoMove: () => void;
  drawCount: 1 | 3;
  isGenerating: boolean;
  onDrawCountChange: (newCount: 1 | 3) => void;
  startNewGame: () => void;
  undo: () => void;
  canUndo: boolean;
}

export const TopBar = ({
  autoMoveEnabled,
  toggleAutoMove,
  drawCount,
  isGenerating,
  onDrawCountChange,
  startNewGame,
  undo,
  canUndo,
}: TopBarProps) => {
  const handleDrawChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onDrawCountChange(Number(event.target.value) as 1 | 3);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold tracking-wider text-yellow-100 shadow-sm">Solitaire</h1>

      <div className="flex gap-4 items-center">
        <div
          className="flex items-center gap-2 text-sm bg-green-800 rounded px-2 py-1 border border-green-600 cursor-pointer"
          onClick={toggleAutoMove}
        >
          <div
            className={`w-3 h-3 rounded-full ${
              autoMoveEnabled ? 'bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.8)]' : 'bg-gray-600'
            }`}
          ></div>
          <span className="text-green-200">Auto Move</span>
        </div>

        <div className="flex items-center gap-2 text-sm bg-green-800 rounded px-2 py-1 border border-green-600">
          <label htmlFor="drawCount" className="text-green-200">Draw:</label>
          <select
            id="drawCount"
            value={drawCount}
            onChange={handleDrawChange}
            disabled={isGenerating}
            className="bg-green-900 text-white rounded px-1 outline-none border border-green-700 cursor-pointer"
          >
            <option value={1}>1 Card</option>
            <option value={3}>3 Cards</option>
          </select>
        </div>

        <button
          onClick={startNewGame}
          disabled={isGenerating}
          className={`px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded border border-green-600 shadow-lg transition-colors flex items-center ${
            isGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isGenerating ? 'Dealing...' : 'New Game'}
        </button>

        <button
          onClick={undo}
          disabled={!canUndo || isGenerating}
          className={`px-4 py-2 bg-yellow-700 hover:bg-yellow-600 text-white rounded border border-yellow-500 shadow-lg transition-colors flex items-center gap-2 ${
            !canUndo || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-xl">↺</span> Undo
        </button>
      </div>
    </div>
  );
};
