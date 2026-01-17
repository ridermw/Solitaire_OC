import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const WinAnimation = ({ onRestart }: { onRestart: () => void }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    // Generate particles
    const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'];
    const newParticles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 2
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
        className="text-center relative z-10"
      >
        <h1 className="text-8xl font-bold text-yellow-400 mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]">
          YOU WIN!
        </h1>
        <p className="text-white text-2xl mb-8 opacity-90">Fantastic job!</p>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="px-8 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-full text-xl shadow-lg border-2 border-green-400 transition-all"
        >
          Play Again
        </motion.button>
      </motion.div>

      {/* Confetti / Card cascade placeholder */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -50, x: p.x, opacity: 0 }}
          animate={{ y: window.innerHeight + 100, rotate: 360, opacity: 1 }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
          className="absolute w-4 h-6 rounded shadow-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
};
