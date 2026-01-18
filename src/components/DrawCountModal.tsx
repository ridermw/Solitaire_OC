interface DrawCountModalProps {
  pendingDrawCount: 1 | 3 | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export const DrawCountModal = ({ pendingDrawCount, onCancel, onConfirm }: DrawCountModalProps) => {
  if (!pendingDrawCount) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white text-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full mx-4 border-2 border-green-800">
        <h3 className="text-xl font-bold mb-4">Start New Game?</h3>
        <p className="mb-6 text-gray-600">
          Changing the draw count requires starting a new game to ensure it is winnable. Your current progress will be
          lost.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 transition-colors"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
};
