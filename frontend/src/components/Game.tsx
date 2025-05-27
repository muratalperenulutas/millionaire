import React, { useEffect, useState, useRef } from 'react';
import { useGameContext } from '@/context/GameContext';
import OptionButton from './OptionButton';
import JokerButton from './JokerButton';
import PriceLadder from './PriceLadder';
import Alert from './Alert';
import FinalScreen from './FinalScreen';
import ReactConfetti from 'react-confetti';

const Game: React.FC = () => {
  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const { gameState, isConnected, startGame } = useGameContext();
  const { currentQuestion, options, jokerInfo, message, messageType, currentPrize, currentQuestionIndex } = gameState;

  const [isLoading, setIsLoading] = useState(true);
  const [gameStartInitiated, setGameStartInitiated] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'alert' | 'correct' | 'lose' | 'joker' | 'win' | 'info'>('info');
  const [showFinalScreen, setShowFinalScreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiRun, setConfettiRun] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConfettiQuestionRef = useRef<number>(-1);

  const startBackgroundMusic = () => {
    if (!backgroundAudioRef.current) {
      backgroundAudioRef.current = new Audio('/sounds/background.mp3');
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.5;
    }
    backgroundAudioRef.current.play();
  };

  const stopBackgroundMusic = () => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
  };

  const playEffectSound = (fileName: string) => {
    const effect = new Audio(`/sounds/${fileName}`);
    effect.play();
  };

  useEffect(() => {
    const hardTimeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 8000);
    return () => clearTimeout(hardTimeout);
  }, [isLoading]);

  useEffect(() => {
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);

    if (isConnected && !gameStartInitiated) {
      setGameStartInitiated(true);
      setIsLoading(true);
      startBackgroundMusic();
      setTimeout(() => {
        startGame();
        loadingTimeoutRef.current = setTimeout(() => setIsLoading(false), 8000);
      }, 500);
    } else if (!isConnected) {
      setIsLoading(true);
    }

    if (currentQuestion) setIsLoading(false);
  }, [isConnected, currentQuestion, startGame, gameStartInitiated]);

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (messageType === 'correct') {
      if (lastConfettiQuestionRef.current !== currentQuestionIndex) {
        playEffectSound('correct.mp3');
        
        setShowConfetti(false);
        setConfettiRun(true);
        
        setTimeout(() => {
          setShowConfetti(true);
          lastConfettiQuestionRef.current = currentQuestionIndex;
          
          const timer = setTimeout(() => {
            setConfettiRun(false);
          }, 3000);
          
          return () => clearTimeout(timer);
        }, 50);
      }
      
      setShowAlert(false);
    } else if (messageType === 'lose') {
      playEffectSound('wrong.mp3');
      setAlertType('lose');
      setShowAlert(true);
    } else if (message && ['alert', 'win', 'joker'].includes(messageType)) {
      setAlertMessage(message);
      setAlertType(messageType as 'alert' | 'win' | 'joker');
      setShowAlert(true);
    }

    if (message) {
      const messageTimeout = setTimeout(() => setIsLoading(false), 3000);
      return () => clearTimeout(messageTimeout);
    }
  }, [message, messageType, gameState.isGameOver]);

  useEffect(() => {
    if (isLoading && isConnected && (currentQuestion || options.length > 0)) {
      setIsLoading(false);
    }
  }, [isLoading, isConnected, currentQuestion, options]);

  useEffect(() => {
    if (gameState.isGameOver) {
      stopBackgroundMusic();
      setShowFinalScreen(true);
    }
  }, [gameState.isGameOver]);

  const handleAlertClose = () => setShowAlert(false);

  const showDebugInfo = () => (
    <div className="mt-6 p-4 bg-blue-950 border border-yellow-400 rounded-lg text-yellow-300 text-xs font-mono overflow-auto max-h-48 shadow-md">
      <h3 className="font-bold text-yellow-400 mb-2">Debug Info</h3>
      <p>Current Question: {currentQuestion ? 'Yes' : 'No'}</p>
      <p>Options Count: {options.length}</p>
      <p>Joker Info: {jokerInfo || 'None'}</p>
      <p>Connection: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <p>Current Prize: {currentPrize}</p>
      <p>Question Index: {currentQuestionIndex}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>Game Start Initiated: {gameStartInitiated ? 'Yes' : 'No'}</p>
      <p>Message: {message || 'None'}</p>
      <p>Message Type: {messageType || 'None'}</p>
    </div>
  );

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-blue-800 rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-700">Loading game data...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gradient-to-b from-blue-950 to-blue-900 text-white rounded-xl shadow-2xl border-4 border-blue-800">
      {showConfetti && (
        <ReactConfetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={confettiRun}
          numberOfPieces={500}
          gravity={0.15}
        />
      )}

      {showFinalScreen ? (
        <FinalScreen
          won={gameState.messageType === 'win'}
          prize={gameState.currentPrize}
          onRestart={() => window.location.reload()}
        />
      ) : (
        <>
          <Alert
            message={alertMessage}
            type={alertType}
            show={showAlert}
            onClose={handleAlertClose}
            autoHide={alertType === 'correct'}
            autoHideDelay={3000}
          />

          <div className="flex flex-col md:flex-row gap-8 mt-6">
            <PriceLadder className="w-full md:w-1/4 bg-blue-950 border border-yellow-400 rounded-lg p-4 shadow-md" />

            <div className="w-full md:w-3/4 bg-blue-950 border border-blue-700 rounded-2xl p-6 shadow-lg">
              {isLoading ? (
                <LoadingSpinner />
              ) : currentQuestion ? (
                <>
                  <div className="mb-6 text-center">
                    <span className="bg-yellow-400 text-blue-900 font-bold py-1 px-4 rounded-full shadow-sm">
                      Current Prize: {currentPrize}
                    </span>
                  </div>

                  <div className="my-6 text-center bg-white p-6 rounded-lg border-4 border-blue-800 shadow-md">
                    <h2 className="text-xl font-bold mb-4 text-black">
                      {currentQuestionIndex + 1} - {currentQuestion}
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {options.map((option, index) => (
                      <OptionButton
                        key={index}
                        option={String.fromCharCode(65 + index)}
                        text={option}
                      />
                    ))}
                  </div>

                  <div className="flex justify-center gap-6 mt-8">
                    <JokerButton type="50-50" />
                    <JokerButton type="audience" />
                  </div>
                </>
              ) : (
                <div className="my-6 text-center text-gray-300">
                  Waiting for question...
                </div>
              )}
            </div>
          </div>

          {process.env.NODE_ENV !== 'production' && showDebugInfo()}
        </>
      )}
    </div>
  );
};

export default Game;
