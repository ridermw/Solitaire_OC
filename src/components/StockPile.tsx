interface StockPileProps {
  hasStock: boolean;
  onDraw: () => void;
}

export const StockPile = ({ hasStock, onDraw }: StockPileProps) => (
  <div onClick={onDraw} className="relative w-24 h-36 cursor-pointer">
    {hasStock ? (
      <div className="w-24 h-36 bg-blue-800 rounded-lg border-2 border-white shadow-md flex items-center justify-center">
        <div className="w-20 h-32 border border-blue-600 rounded opacity-50 bg-pattern"></div>
      </div>
    ) : (
      <div className="w-24 h-36 border-2 border-green-700 rounded-lg flex items-center justify-center text-green-700 font-bold text-2xl">
        ↺
      </div>
    )}
  </div>
);
