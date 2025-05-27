import React from 'react';
import { useGameContext } from '@/context/GameContext';

type OptionButtonProps = {
  option: string;
  text: string;
};

const OptionButton: React.FC<OptionButtonProps> = ({ option, text }) => {
  const { sendAnswer, gameState } = useGameContext();
  const { fiftyFiftyOptions, audienceResults } = gameState;

  const optionLetter = option.charAt(0);
  const isFiftyFiftyActive = fiftyFiftyOptions.length === 0 || fiftyFiftyOptions.includes(optionLetter);
  const audiencePercentage = audienceResults[optionLetter];

  const playSound = (url: string) => {
    const audio = new Audio(url);
    audio.play();
  };

  const handleClick = () => {
    if (isFiftyFiftyActive) {
      playSound('/sounds/click.mp3');
      sendAnswer(optionLetter);
    }
  };

  const getButtonStyle = () => {
    if (!isFiftyFiftyActive) {
      return "w-full p-4 my-2 text-left rounded-lg bg-gray-300 text-gray-500 border-2 border-gray-400 font-semibold cursor-not-allowed opacity-60";
    }
    return "w-full p-4 my-2 text-left rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 hover:scale-105 text-white shadow-lg hover:shadow-xl transition-all transform cursor-pointer";
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isFiftyFiftyActive}
      className={getButtonStyle()}
    >
      <div className="flex justify-between items-center">
        <span>{text}</span>
        {audiencePercentage !== undefined && (
  <span className="bg-yellow-100 text-black px-2 py-1 rounded-full text-sm font-bold border border-yellow-300">
    {audiencePercentage}%
  </span>
)}        
      </div>
    </button>
  );
};

export default OptionButton;