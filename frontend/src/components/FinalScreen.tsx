import React from 'react';

interface FinalScreenProps {
  won: boolean;
  prize: string;
  onRestart: () => void;
}

const FinalScreen: React.FC<FinalScreenProps> = ({ won, prize, onRestart }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 text-white bg-transparent">
      {won ? (
        <>
          <h1 className="text-6xl font-extrabold text-yellow-400 mb-4 animate-pulse">
            🏆 Congratulations! 🏆
          </h1>
          <p className="text-3xl text-yellow-300 mb-8">
            You won the prize!
          </p>
          <div className="w-32 h-32 rounded-full bg-yellow-400 flex items-center justify-center mb-8 animate-bounce shadow-2xl">
            <span className="text-4xl font-bold text-blue-900">💰</span>
          </div>
          <button
            onClick={onRestart}
            className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            Play Again
          </button>
        </>
      ) : (
        <>
          <h1 className="text-5xl font-bold text-red-500 mb-8">Game Over</h1>
          <p className="text-2xl text-white mb-6">
            You finished with {prize}
          </p>
          <button
            onClick={onRestart}
            className="bg-yellow-500 hover:bg-yellow-400 text-blue-900 font-bold py-4 px-10 rounded-full text-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300"
          >
            Play Again
          </button>
        </>
      )}
    </div>
  );
};

export default FinalScreen;
