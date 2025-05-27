import React from 'react';
import { useGameContext } from '@/context/GameContext';

type JokerButtonProps = {
  type: string;
  disabled?: boolean;
};

const JokerButton: React.FC<JokerButtonProps> = ({ type, disabled = false }) => {
  const { useJoker, gameState } = useGameContext();
  const { jokerInfo } = gameState;

  const isJokerAvailable = () => {
    if (!jokerInfo) return false;
    
    if (type === "50-50" && (jokerInfo.includes("50-50"))) {
      return true;
    }
    if (type === "audience" && (jokerInfo.includes("audience"))) {
      return true;
    }    
    return false;
  };

  const getJokerCode = () => {
    switch (type) {
      case "50-50": return "50-50";
      case "audience": return "audience";
      default: return "";
    }
  };

  const getJokerLabel = () => {
    switch (type) {
      case "50-50": return "50:50";
      case "audience": return "Ask Audience";
      default: return "";
    }
  };

  const handleClick = () => {
    useJoker(getJokerCode());
  };

  const isAvailable = isJokerAvailable();

  return (
    <button
      onClick={handleClick}
      disabled={disabled || !isAvailable}
      className={`px-6 py-3 m-2 rounded-lg font-semibold transition-colors cursor-pointer shadow-sm hover:shadow-md ${
        disabled || !isAvailable
          ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
          : 'bg-amber-400 hover:bg-amber-500 text-gray-900'
      }`}
    >
      {getJokerLabel()}
    </button>
  );
};

export default JokerButton;