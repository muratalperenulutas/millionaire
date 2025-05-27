import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket } from '@/utils/socket';

const moneyLadder = [
  "WIN",
  "$1,000,000", 
  "$500,000",
  "$250,000",
  "$100,000", 
  "$50,000",
  "$10,000", 
  "$1,000", 
  "$500", 
  "$100"
];

interface GameContextType {
  socket: Socket | null;
  gameState: {
    currentQuestion: string;
    options: string[];
    jokerInfo: string;
    message: string;
    messageType: string;
    currentQuestionIndex: number;
    moneyLadder: string[];
    currentPrize: string;
    isGameOver: boolean;
    fiftyFiftyOptions: string[];
    audienceResults: Record<string, number>;
  };
  isConnected: boolean;
  sendAnswer: (answer: string) => void;
  useJoker: (joker: string) => void;
  startGame: () => void;
}

const GameContext = createContext<GameContextType>({
  socket: null,
  gameState: {
    currentQuestion: '',
    options: [],
    jokerInfo: '',
    message: 'Connecting to game server...',
    messageType: 'info',
    currentQuestionIndex: 0,
    moneyLadder: moneyLadder,
    currentPrize: moneyLadder[moneyLadder.length - 1],
    isGameOver: false,
    fiftyFiftyOptions: [],
    audienceResults: {}
  },
  isConnected: false,
  sendAnswer: () => {},
  useJoker: () => {},
  startGame: () => {},
});

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState({
    currentQuestion: '',
    options: [] as string[],
    jokerInfo: '',
    message: 'Connecting to game server...',
    messageType: 'info',
    currentQuestionIndex: 0,
    moneyLadder: moneyLadder,
    currentPrize: moneyLadder[moneyLadder.length - 1],
    isGameOver: false,
    fiftyFiftyOptions: [] as string[],
    audienceResults: {} as Record<string, number>
  });

  const parseQuestionData = (data: string) => {
    try {
      console.log('Parsing question data:', data);
      const lines = data.split('@');
      let question = '';
      let options: string[] = [];
      let questionIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        console.log(`Processing line[${i}]:`, line);
        
        if (line.startsWith('QUESTION:')) {
          const parts = line.split(':', 3);
          if (parts.length >= 3) {
            questionIndex = parseInt(parts[1]);
            question = parts[2];
            console.log(`Found question: index=${questionIndex}, text=${question}`);
          }
        } 
        else if (line.startsWith('OPTIONS:')) {
          const parts = line.split(':', 3);
          if (parts.length >= 3) {
            options = parts[2].split('|');
            console.log(`Found options:`, options);
          }
        }
      }
      
      if (question && options.length > 0) {
        console.log(`Setting game state with question and options`);
        setGameState(prev => {
          let prizeIndex= Math.max(0, moneyLadder.length - 2 - questionIndex);
          
          
          console.log(`Question ${questionIndex}: Using prize at index ${prizeIndex}: ${moneyLadder[prizeIndex]}`);
          
          return {
            ...prev,
            currentQuestionIndex: questionIndex,
            currentQuestion: question,
            options: options,
            message: `Question ${questionIndex + 1}`,
            messageType: 'info',
            currentPrize: moneyLadder[prizeIndex+1],
            fiftyFiftyOptions: [],
            audienceResults: {}
          };
        });
      }
    } catch (error) {
      console.error('Error parsing new question data:', error);
    }
  };

  useEffect(() => {
    const newSocket = initializeSocket();
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to game server');
      setIsConnected(true);
      setGameState(prev => ({
        ...prev,
        message: 'Connected to game server!',
        messageType: 'info',
        reconnecting: false
      }));
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from game server');
      setIsConnected(false);
      setGameState(prev => ({
        ...prev,
        message: 'Disconnected from game server. Reconnecting...',
        messageType: 'alert',
      }));

    });

/*
    newSocket.on('alert', (message: string) => {
      console.log('Received alert:', message);
      
      if (!gameState.isGameOver) {
        setGameState(prev => ({
          ...prev,
          message: message,
          messageType: 'alert',
        }));
      }
      
      if (message.includes('Connection to game server lost') ||
          message.includes('Unable to connect to game server')) {
        setIsConnected(false);
      }
    });
    */
    
    newSocket.on("data", (rawData: string) => {
      console.log('Received data:', rawData);
      
      const messages = rawData.split('\n').filter(msg => msg.trim() !== '');
      
      messages.forEach(message => {
        console.log('Processing message:', message);
        
        if (message.includes('QUESTION')) {
          parseQuestionData(message);
        }
        else if (message.startsWith('CORRECT:')) {
          handleCorrectAnswer(message);
        }
        else if (message.startsWith('LOSE:')) {
          handleWrongAnswer(message);
        }
        else if (message.startsWith('50-50_RESULT:')) {
          handleFiftyFiftyResult(message);
        }
        else if (message.startsWith('AUDIENCE_RESULT:')) {
          handleAudienceResult(message);
        }
        else if(message.startsWith('JOKERS:')) {
          const jokerInfo = message.substring('JOKERS:'.length);
          console.log(`Received jokers info: ${jokerInfo}`);
          
          setGameState(prev => ({
            ...prev,
            jokerInfo: jokerInfo,
            message: `Available jokers: ${jokerInfo}`,
            messageType: 'info'
          }));
        }
        else if (message.startsWith('WIN:')) {
          handleWinResult(message);
        }
        else {
          setGameState(prev => ({
            ...prev,
            message: message,
            messageType: 'info',
          }));
        }
      });
    });
  
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const handleCorrectAnswer = (data: string) => {
    const messageContent = data.startsWith('CORRECT:') ? data.substring(8) : data;
    
    setGameState(prev => {
      const nextQuestionIndex = prev.currentQuestionIndex + 1;
      const prizeIndex = Math.max(0, moneyLadder.length - 1 - nextQuestionIndex);
      console.log(`Prize calculation: nextQuestionIndex=${nextQuestionIndex}, prizeIndex=${prizeIndex}`);
      
      return {
        ...prev,
        message: messageContent,
        messageType: 'correct',
        currentPrize: moneyLadder[prizeIndex]
      };
    });
  };
  
  const handleWrongAnswer = (data: string) => {
    const messageContent = data.startsWith('LOSE:') ? data.substring(5) : data;
    
    setGameState(prev => ({
      ...prev,
      message: messageContent,
      messageType: 'lose',
      isGameOver: true
    }));
  };

  const handleWinResult = (data: string) => {
    const messageContent = data.startsWith('WIN:') ? data.substring(4) : data;
    
    setGameState(prev => ({
      ...prev,
      message: messageContent,
      messageType: 'win',
      currentPrize: moneyLadder[0],
      isGameOver: true
    }));
  };

  const handleFiftyFiftyResult = (data: string) => {
    try {
      const resultPart = data.substring('50-50_RESULT:'.length).trim();
      const options = resultPart.split(',').map(opt => opt.trim());
      console.log('Received 50-50 options:', options);

      setGameState(prev => ({
        ...prev,
        fiftyFiftyOptions: options,
        message: '50-50 joker used. Two options remain.',
        messageType: 'info'
      }));
    } catch (error) {
      console.error('Error parsing 50-50 result:', error);
    }
  };

  const handleAudienceResult = (data: string) => {
    try {
      const resultPart = data.substring('AUDIENCE_RESULT:'.length);
      const optionResults = resultPart.split(',');
      
      const resultsObject: Record<string, number> = {};
      
      optionResults.forEach(result => {
        const [option, percentage] = result.split(':');
        resultsObject[option] = parseInt(percentage);
      });
      
      console.log('Parsed audience poll results:', resultsObject);

      setGameState(prev => ({
        ...prev,
        audienceResults: resultsObject,
        message: 'Audience poll results received.',
        messageType: 'info'
      }));
    } catch (error) {
      console.error('Error parsing audience result:', error);
    }
  };

  const sendAnswer = (answer: string) => {
    if (socket && isConnected) {
      console.log('Sending answer:', answer);
      socket.emit('data', `ANSWER:${answer}`);
    } else {
      console.error('Cannot send answer - socket not connected');
      setGameState(prev => ({
        ...prev,
        message: 'Cannot send answer - connection lost. Try reconnecting.',
        messageType: 'alert',
      }));
    }
  };

  const useJoker = (joker: string) => {
    if (socket && isConnected) {
      console.log('Using joker:', joker);

      socket.emit('data', `JOKER:${joker}`);
    } else {
      console.error('Cannot use joker - socket not connected');
      setGameState(prev => ({
        ...prev,
        message: 'Cannot use joker - connection lost. Try reconnecting.',
        messageType: 'alert',
      }));
    }
  };

  const startGameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartRequestedRef = useRef(false);
  
  const startGame = () => {
    if (gameStartRequestedRef.current) {
      console.log('Game start already requested, ignoring duplicate call');
      return;
    }
    
    if (socket && isConnected) {
      console.log('Starting a new game');
      
      gameStartRequestedRef.current = true;
      setGameState(prev => ({
        ...prev,
        currentQuestion: '',
        options: [],
        jokerInfo: '',
        allQuestions: [],
        currentQuestionIndex: 0,
        message: 'Starting a new game...',
        messageType: 'info',
        currentPrize: moneyLadder[moneyLadder.length - 1]
      }));
      if (startGameTimeoutRef.current) {
        clearTimeout(startGameTimeoutRef.current);
      }

      startGameTimeoutRef.current = setTimeout(() => {
        console.log('Emitting startGame event');
        socket.emit('data', `START`);
        
        setTimeout(() => {
          gameStartRequestedRef.current = false;
        }, 2000);
      }, 100);
    } else {
      console.error('Cannot start game - socket not connected');
      setGameState(prev => ({
        ...prev,
        message: 'Cannot start game - connection lost. Try reconnecting.',
        messageType: 'alert'
      }));
    }
  };
  

  const contextValue = {
    socket,
    gameState,
    isConnected,
    sendAnswer,
    useJoker,
    startGame,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => useContext(GameContext);