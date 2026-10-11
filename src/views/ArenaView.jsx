import React, { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import { ChessNav } from '../components/ChessNav';
import { Chessboard } from '../components/Chessboard';
import { PlayerCard } from '../components/PlayerCard';
import { GameConsole } from '../components/GameConsole';
import { MatchModal } from '../components/MatchModal';
import { Leaderboard } from '../components/Leaderboard';
import { sounds } from '../utils/SoundManager';
import { getWebSocketUrl } from '../utils/wsUrl';

export const ArenaView = () => {
  // Game & Networking state
  const [chess, setChess] = useState(() => new Chess());
  const [ws, setWs] = useState(null);
  const [gameState, setGameState] = useState('IDLE'); // IDLE, QUEUE, PLAYING, FINISHED
  const [playerData, setPlayerData] = useState({
    id: null,
    username: 'Grandmaster_' + Math.floor(100 + Math.random() * 900),
    rating: 1540,
    avatar: '♟️',
    country: '🇮🇳'
  });
  const [serverStats, setServerStats] = useState({ online: 28, totalMatches: 42 });
  const [queueTime, setQueueTime] = useState(0);
  const [canPlayBot, setCanPlayBot] = useState(false);
  const [timeControl, setTimeControl] = useState('3 min');

  // Match state
  const [currentMatch, setCurrentMatch] = useState(null);
  const [playerColor, setPlayerColor] = useState('w');
  const [viewOrientation, setViewOrientation] = useState('w');
  const [whiteTime, setWhiteTime] = useState(180);
  const [blackTime, setBlackTime] = useState(180);
  const [lastMove, setLastMove] = useState(null);
  const [moves, setMoves] = useState([]);
  const [capturedWhite, setCapturedWhite] = useState([]);
  const [capturedBlack, setCapturedBlack] = useState([]);
  const [materialDelta, setMaterialDelta] = useState({ white: 0, black: 0 });

  // Theme & Preferences
  const [boardTheme, setBoardTheme] = useState('green'); // 'green', 'wood', 'slate'
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Modals
  const [showMatchFound, setShowMatchFound] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardList, setLeaderboardList] = useState([]);

  const queueIntervalRef = useRef(null);
  const playerIdRef = useRef(null);

  // Connect to WebSocket Server
  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    let socket;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[Arena] Connected to WebSocket server');
        socket.send(JSON.stringify({
          type: 'IDENTIFY',
          data: playerData
        }));
      };

      socket.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);

          switch (type) {
            case 'CONNECTED':
              playerIdRef.current = data.playerId;
              setPlayerData(prev => ({ ...prev, id: data.playerId }));
              setServerStats(prev => ({ ...prev, online: data.onlineCount }));
              break;

            case 'QUEUE_STATUS':
              setCanPlayBot(data.canPlayBot || false);
              break;

            case 'GAME_START':
              handleGameStart(data);
              break;

            case 'MOVE_MADE':
              handleServerMove(data);
              break;

            case 'CLOCK_SYNC':
              setWhiteTime(data.whiteTime);
              setBlackTime(data.blackTime);
              break;

            case 'GAME_OVER':
              handleGameOver(data);
              break;

            default:
              break;
          }
        } catch (e) {
          console.error('[Arena WS Parse Error]', e);
        }
      };

      socket.onclose = () => {
        console.log('[Arena] WS connection closed');
      };

      setWs(socket);
    } catch (err) {
      console.warn('[Arena] Connection error', err);
    }

    // Fetch initial leaderboard
    fetch('http://localhost:3001/api/leaderboard')
      .then(res => res.json())
      .then(data => setLeaderboardList(data))
      .catch(() => {});

    return () => {
      if (socket) socket.close();
    };
  }, []);

  // Update captured pieces & material advantage
  const updateCapturedPieces = (currentChess) => {
    const board = currentChess.board();
    const currentCounts = { w: { p:0, n:0, b:0, r:0, q:0 }, b: { p:0, n:0, b:0, r:0, q:0 } };
    const startingCounts = { p: 8, n: 2, b: 2, r: 2, q: 1 };
    const pieceSymbols = { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛' };

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type !== 'k') {
          currentCounts[piece.color][piece.type]++;
        }
      }
    }

    const deadWhite = [];
    const deadBlack = [];
    let whiteVal = 0;
    let blackVal = 0;
    const values = { p: 1, n: 3, b: 3.2, r: 5, q: 9 };

    ['p', 'n', 'b', 'r', 'q'].forEach((type) => {
      const lostWhite = startingCounts[type] - currentCounts['w'][type];
      const lostBlack = startingCounts[type] - currentCounts['b'][type];
      for (let i = 0; i < lostWhite; i++) deadWhite.push(pieceSymbols[type]);
      for (let i = 0; i < lostBlack; i++) deadBlack.push(pieceSymbols[type]);
      whiteVal += currentCounts['w'][type] * values[type];
      blackVal += currentCounts['b'][type] * values[type];
    });

    setCapturedWhite(deadBlack);
    setCapturedBlack(deadWhite);
    setMaterialDelta({
      white: Math.max(0, Math.round(whiteVal - blackVal)),
      black: Math.max(0, Math.round(blackVal - whiteVal))
    });
  };

  const handleGameStart = (matchData) => {
    clearInterval(queueIntervalRef.current);
    setCurrentMatch(matchData);
    const newChess = new Chess();
    setChess(newChess);
    setMoves([]);
    setLastMove(null);
    setWhiteTime(matchData.whiteTime || 180);
    setBlackTime(matchData.blackTime || 180);

    const assignedColor = matchData.yourColor || (matchData.white?.id === playerIdRef.current ? 'w' : 'b');
    setPlayerColor(assignedColor);
    setViewOrientation(assignedColor);

    setGameState('PLAYING');
    setShowMatchFound(true);
    setTimeout(() => setShowMatchFound(false), 2800);

    updateCapturedPieces(newChess);
  };

  const handleServerMove = (data) => {
    const { move, fen } = data;
    const newChess = new Chess(fen);
    setChess(newChess);
    setLastMove({ from: move.from, to: move.to });
    setMoves(prev => [...prev, move]);
    updateCapturedPieces(newChess);

    if (move.captured) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }

    if (data.isCheck) {
      sounds.playCheck();
    }
  };

  const handleGameOver = (data) => {
    setGameState('FINISHED');
    const isPlayerWhite = playerColor === 'w';
    const isWinner = (data.winner === 'white' && isPlayerWhite) || (data.winner === 'black' && !isPlayerWhite);

    setGameOverData({
      ...data,
      isWinner
    });
    setShowGameOver(true);
  };

  // Queue & Matchmaking actions
  const startRouletteQueue = () => {
    sounds.playRouletteSpin();
    setGameState('QUEUE');
    setQueueTime(0);
    setCanPlayBot(false);

    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'JOIN_QUEUE' }));
    }

    queueIntervalRef.current = setInterval(() => {
      setQueueTime(prev => prev + 1);
    }, 1000);
  };

  const cancelQueue = () => {
    clearInterval(queueIntervalRef.current);
    setGameState('IDLE');
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'LEAVE_QUEUE' }));
    }
  };

  const playBotMatch = (difficulty = 'Grandmaster Bot') => {
    clearInterval(queueIntervalRef.current);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'PLAY_BOT',
        data: { difficulty }
      }));
    }
  };

  const spinNextOpponent = () => {
    setShowGameOver(false);
    startRouletteQueue();
  };

  const handleMove = ({ from, to, promotion = 'q' }) => {
    if (gameState !== 'PLAYING') return;
    if (chess.turn() !== playerColor) return;

    if (ws && ws.readyState === WebSocket.OPEN && currentMatch?.roomId) {
      ws.send(JSON.stringify({
        type: 'MAKE_MOVE',
        data: {
          roomId: currentMatch.roomId,
          move: { from, to, promotion }
        }
      }));
    }
  };

  const handleResign = () => {
    if (gameState !== 'PLAYING') return;
    if (confirm('Are you sure you want to resign and spin to the next opponent?')) {
      if (ws && ws.readyState === WebSocket.OPEN && currentMatch?.roomId) {
        ws.send(JSON.stringify({
          type: 'RESIGN',
          data: { roomId: currentMatch.roomId }
        }));
      }
    }
  };

  const handleOfferDraw = () => {
    alert('Draw offer sent to opponent.');
  };

  const handleFlipBoard = () => {
    setViewOrientation(prev => prev === 'w' ? 'b' : 'w');
  };

  const cycleTheme = () => {
    const themes = ['green', 'wood', 'slate'];
    const nextIdx = (themes.indexOf(boardTheme) + 1) % themes.length;
    setBoardTheme(themes[nextIdx]);
  };

  const toggleSound = () => {
    const isNow = sounds.toggle();
    setSoundEnabled(isNow);
  };

  // Determine opponent & player cards
  const opponentData = currentMatch
    ? (currentMatch.opponent || (playerColor === 'w' ? currentMatch.black : currentMatch.white))
    : { username: 'Waiting for Match...', rating: '----', avatar: '🎲', country: '🌐' };

  return (
    <div className="chesscom-container">
      {/* 1. LEFT NAVIGATION BAR (Chess.com layout) */}
      <ChessNav
        playerData={playerData}
        activeView="play"
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        currentTheme={boardTheme}
        onCycleTheme={cycleTheme}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
      />

      {/* 2. MAIN CENTER CHESS ARENA */}
      <main className="chesscom-arena">
        <div className="board-column">
          {/* Opponent Info Bar */}
          <PlayerCard
            player={viewOrientation === 'w' ? opponentData : playerData}
            timeRemaining={viewOrientation === 'w' ? (playerColor === 'w' ? blackTime : whiteTime) : (playerColor === 'w' ? whiteTime : blackTime)}
            isActive={gameState === 'PLAYING' && chess.turn() !== (viewOrientation === 'w' ? playerColor : (playerColor === 'w' ? 'b' : 'w'))}
            capturedPieces={viewOrientation === 'w' ? (playerColor === 'w' ? capturedBlack : capturedWhite) : (playerColor === 'w' ? capturedWhite : capturedBlack)}
            materialAdvantage={viewOrientation === 'w' ? (playerColor === 'w' ? materialDelta.black : materialDelta.white) : (playerColor === 'w' ? materialDelta.white : materialDelta.black)}
            color={viewOrientation === 'w' ? (playerColor === 'w' ? 'b' : 'w') : playerColor}
          />

          {/* Chess.com Board + Live Evaluation Bar */}
          <Chessboard
            chess={chess}
            orientation={viewOrientation}
            isInteractive={gameState === 'PLAYING' && chess.turn() === playerColor}
            lastMove={lastMove}
            onMove={handleMove}
            theme={boardTheme}
            showEvalBar={true}
          />

          {/* Player Info Bar */}
          <PlayerCard
            player={viewOrientation === 'w' ? playerData : opponentData}
            timeRemaining={viewOrientation === 'w' ? (playerColor === 'w' ? whiteTime : blackTime) : (playerColor === 'w' ? blackTime : whiteTime)}
            isActive={gameState === 'PLAYING' && chess.turn() === (viewOrientation === 'w' ? playerColor : (playerColor === 'w' ? 'b' : 'w'))}
            capturedPieces={viewOrientation === 'w' ? (playerColor === 'w' ? capturedWhite : capturedBlack) : (playerColor === 'w' ? capturedBlack : capturedWhite)}
            materialAdvantage={viewOrientation === 'w' ? (playerColor === 'w' ? materialDelta.white : materialDelta.black) : (playerColor === 'w' ? materialDelta.black : materialDelta.white)}
            color={viewOrientation === 'w' ? playerColor : (playerColor === 'w' ? 'b' : 'w')}
          />
        </div>

        {/* 3. RIGHT GAME CONSOLE (Chess.com console) */}
        <GameConsole
          gameState={gameState}
          moves={moves}
          timeControl={timeControl}
          onSelectTimeControl={setTimeControl}
          onStartQueue={startRouletteQueue}
          onCancelQueue={cancelQueue}
          onPlayBot={playBotMatch}
          onNextOpponent={spinNextOpponent}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          onFlipBoard={handleFlipBoard}
          queueTime={queueTime}
          canPlayBot={canPlayBot}
          gameOverData={gameOverData}
          currentMatch={currentMatch}
          playerColor={playerColor}
          onlineStats={{ online: serverStats.online, matches: 42 }}
        />
      </main>

      {/* Match Announcement Notification Banner */}
      <MatchModal
        isOpen={showMatchFound}
        type="MATCH_FOUND"
        data={{
          opponent: opponentData,
          playerColor
        }}
        onClose={() => setShowMatchFound(false)}
      />

      {/* Leaderboard Modal */}
      <Leaderboard
        isOpen={showLeaderboard}
        onClose={() => setShowLeaderboard(false)}
        data={leaderboardList}
      />
    </div>
  );
};
