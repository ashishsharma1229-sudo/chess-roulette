import { Chess } from 'chess.js';

export class GameRoom {
  constructor(roomId, whitePlayer, blackPlayer, isBotMatch, callbacks) {
    this.roomId = roomId;
    this.whitePlayer = whitePlayer;
    this.blackPlayer = blackPlayer;
    this.isBotMatch = isBotMatch;
    this.callbacks = callbacks; // { onStateChange, onGameEnd }

    this.chess = new Chess();
    this.status = 'WAITING'; // WAITING, PLAYING, FINISHED
    this.result = null; // '1-0', '0-1', '1/2-1/2', etc.
    this.resultReason = null; // 'checkmate', 'timeout', 'resignation', 'draw', 'abandonment'
    this.winner = null; // 'white' | 'black' | 'draw'

    // Clocks in seconds (180s = 3m blitz)
    this.initialTime = 180;
    this.whiteTime = this.initialTime;
    this.blackTime = this.initialTime;
    this.activeColor = 'w';
    this.lastMoveTimestamp = null;
    this.clockInterval = null;

    this.moves = []; // [{ from, to, piece, san, fen, captured, clock }]
    this.moveCount = 0;
  }

  start() {
    this.status = 'PLAYING';
    this.lastMoveTimestamp = Date.now();

    this.startClock();

    // Send personalized GAME_START to each player with their assigned color
    const baseGameState = this.getPlayerGameState();

    if (this.whitePlayer.ws && this.whitePlayer.ws.readyState === 1) {
      this.whitePlayer.ws.send(JSON.stringify({
        type: 'GAME_START',
        data: {
          ...baseGameState,
          yourColor: 'w',
          opponent: baseGameState.black
        }
      }));
    }

    if (this.blackPlayer.ws && this.blackPlayer.ws.readyState === 1) {
      this.blackPlayer.ws.send(JSON.stringify({
        type: 'GAME_START',
        data: {
          ...baseGameState,
          yourColor: 'b',
          opponent: baseGameState.white
        }
      }));
    }

    console.log(`[GameRoom ${this.roomId}] Game started: White=${this.whitePlayer.username} (${this.whitePlayer.id}) vs Black=${this.blackPlayer.username} (${this.blackPlayer.id})`);

    this.callbacks.onStateChange(this);

    // If White is a bot, play first move
    if (this.whitePlayer.isBot) {
      this.scheduleBotMove();
    }
  }

  startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);

    this.clockInterval = setInterval(() => {
      if (this.status !== 'PLAYING') {
        clearInterval(this.clockInterval);
        return;
      }

      if (this.activeColor === 'w') {
        this.whiteTime = Math.max(0, this.whiteTime - 1);
        if (this.whiteTime <= 0) {
          this.handleTimeout('w');
        }
      } else {
        this.blackTime = Math.max(0, this.blackTime - 1);
        if (this.blackTime <= 0) {
          this.handleTimeout('b');
        }
      }

      // Sync clocks periodically (every 1 second)
      this.broadcastToPlayers({
        type: 'CLOCK_SYNC',
        data: {
          whiteTime: this.whiteTime,
          blackTime: this.blackTime,
          activeColor: this.activeColor
        }
      });
      this.callbacks.onStateChange(this);
    }, 1000);
  }

  makeMove(playerId, { from, to, promotion = 'q' }) {
    if (this.status !== 'PLAYING') return { success: false, reason: 'Game is not in progress' };

    const isWhite = this.whitePlayer.id === playerId;
    const isBlack = this.blackPlayer.id === playerId;

    if (!isWhite && !isBlack) return { success: false, reason: 'Not a player in this match' };

    // Check turn
    if (isWhite && this.activeColor !== 'w') return { success: false, reason: 'Not White turn' };
    if (isBlack && this.activeColor !== 'b') return { success: false, reason: 'Not Black turn' };

    try {
      const move = this.chess.move({ from, to, promotion });
      if (!move) {
        return { success: false, reason: 'Illegal move' };
      }

      this.moveCount++;
      const currentMoveRecord = {
        number: Math.ceil(this.moveCount / 2),
        color: this.activeColor,
        from: move.from,
        to: move.to,
        san: move.san,
        piece: move.piece,
        captured: move.captured,
        fen: this.chess.fen(),
        whiteTime: this.whiteTime,
        blackTime: this.blackTime
      };
      this.moves.push(currentMoveRecord);

      // Switch active turn
      this.activeColor = this.chess.turn();
      this.lastMoveTimestamp = Date.now();

      // Check game conclusion
      if (this.chess.isGameOver()) {
        this.concludeGame();
      } else {
        // Broadcast new state
        this.broadcastToPlayers({
          type: 'MOVE_MADE',
          data: {
            move: currentMoveRecord,
            fen: this.chess.fen(),
            activeColor: this.activeColor,
            isCheck: this.chess.inCheck(),
            whiteTime: this.whiteTime,
            blackTime: this.blackTime
          }
        });
        this.callbacks.onStateChange(this);

        // If next turn is bot, schedule bot move
        const nextIsBot = (this.activeColor === 'w' && this.whitePlayer.isBot) ||
                          (this.activeColor === 'b' && this.blackPlayer.isBot);
        if (nextIsBot) {
          this.scheduleBotMove();
        }
      }

      return { success: true };
    } catch (err) {
      console.error('[GameRoom Move Error]', err);
      return { success: false, reason: err.message };
    }
  }

  concludeGame() {
    clearInterval(this.clockInterval);
    this.status = 'FINISHED';

    if (this.chess.isCheckmate()) {
      this.winner = this.chess.turn() === 'w' ? 'black' : 'white';
      this.result = this.winner === 'white' ? '1-0' : '0-1';
      this.resultReason = 'Checkmate';
    } else if (this.chess.isStalemate()) {
      this.winner = 'draw';
      this.result = '1/2-1/2';
      this.resultReason = 'Stalemate';
    } else if (this.chess.isThreefoldRepetition()) {
      this.winner = 'draw';
      this.result = '1/2-1/2';
      this.resultReason = 'Threefold Repetition';
    } else if (this.chess.isInsufficientMaterial()) {
      this.winner = 'draw';
      this.result = '1/2-1/2';
      this.resultReason = 'Insufficient Material';
    } else {
      this.winner = 'draw';
      this.result = '1/2-1/2';
      this.resultReason = '50-Move Rule';
    }

    this.broadcastToPlayers({
      type: 'GAME_OVER',
      data: {
        winner: this.winner,
        result: this.result,
        resultReason: this.resultReason,
        fen: this.chess.fen(),
        moves: this.moves
      }
    });

    this.callbacks.onGameEnd(this);
  }

  handleTimeout(timedOutColor) {
    clearInterval(this.clockInterval);
    this.status = 'FINISHED';
    this.winner = timedOutColor === 'w' ? 'black' : 'white';
    this.result = timedOutColor === 'w' ? '0-1' : '1-0';
    this.resultReason = 'Time Expired';

    this.broadcastToPlayers({
      type: 'GAME_OVER',
      data: {
        winner: this.winner,
        result: this.result,
        resultReason: this.resultReason,
        fen: this.chess.fen(),
        moves: this.moves
      }
    });
    this.callbacks.onGameEnd(this);
  }

  resign(playerId) {
    if (this.status !== 'PLAYING') return;
    clearInterval(this.clockInterval);
    this.status = 'FINISHED';

    const resignedColor = this.whitePlayer.id === playerId ? 'white' : 'black';
    this.winner = resignedColor === 'white' ? 'black' : 'white';
    this.result = this.winner === 'white' ? '1-0' : '0-1';
    this.resultReason = `${resignedColor === 'white' ? this.whitePlayer.username : this.blackPlayer.username} Resigned`;

    this.broadcastToPlayers({
      type: 'GAME_OVER',
      data: {
        winner: this.winner,
        result: this.result,
        resultReason: this.resultReason,
        fen: this.chess.fen(),
        moves: this.moves
      }
    });
    this.callbacks.onGameEnd(this);
  }

  scheduleBotMove() {
    const delay = Math.floor(Math.random() * 600) + 400; // 400-1000ms realistic thinking time
    setTimeout(() => {
      if (this.status !== 'PLAYING') return;

      const legalMoves = this.chess.moves({ verbose: true });
      if (legalMoves.length === 0) return;

      // Smart move picker: checks for captures, checks, then best position
      let chosenMove = null;

      // Priority 1: Checkmating move
      for (const m of legalMoves) {
        this.chess.move(m);
        if (this.chess.isCheckmate()) {
          this.chess.undo();
          chosenMove = m;
          break;
        }
        this.chess.undo();
      }

      // Priority 2: Captures of high-value pieces
      if (!chosenMove) {
        const captures = legalMoves.filter(m => m.captured);
        if (captures.length > 0) {
          const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
          captures.sort((a, b) => (pieceValues[b.captured] || 0) - (pieceValues[a.captured] || 0));
          // 80% pick best capture, 20% random for variety
          chosenMove = Math.random() < 0.85 ? captures[0] : legalMoves[Math.floor(Math.random() * legalMoves.length)];
        }
      }

      // Priority 3: Checks
      if (!chosenMove) {
        const checks = [];
        for (const m of legalMoves) {
          this.chess.move(m);
          if (this.chess.inCheck()) checks.push(m);
          this.chess.undo();
        }
        if (checks.length > 0 && Math.random() < 0.7) {
          chosenMove = checks[Math.floor(Math.random() * checks.length)];
        }
      }

      // Fallback: Random legal move
      if (!chosenMove) {
        chosenMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }

      const botId = this.whitePlayer.isBot ? this.whitePlayer.id : this.blackPlayer.id;
      this.makeMove(botId, {
        from: chosenMove.from,
        to: chosenMove.to,
        promotion: chosenMove.promotion || 'q'
      });
    }, delay);
  }

  hasPlayer(playerId) {
    return this.whitePlayer.id === playerId || this.blackPlayer.id === playerId;
  }

  handleDisconnect(playerId) {
    if (this.status === 'PLAYING') {
      // Disconnecting player abandons match
      const abandonedColor = this.whitePlayer.id === playerId ? 'white' : 'black';
      this.winner = abandonedColor === 'white' ? 'black' : 'white';
      this.result = this.winner === 'white' ? '1-0' : '0-1';
      this.resultReason = 'Opponent Disconnected';
      this.status = 'FINISHED';
      clearInterval(this.clockInterval);

      this.broadcastToPlayers({
        type: 'GAME_OVER',
        data: {
          winner: this.winner,
          result: this.result,
          resultReason: this.resultReason,
          fen: this.chess.fen(),
          moves: this.moves
        }
      });
      this.callbacks.onGameEnd(this);
    }
  }

  broadcastToPlayers(payload) {
    const json = JSON.stringify(payload);
    if (this.whitePlayer.ws && this.whitePlayer.ws.readyState === 1) {
      this.whitePlayer.ws.send(json);
    }
    if (this.blackPlayer.ws && this.blackPlayer.ws.readyState === 1) {
      this.blackPlayer.ws.send(json);
    }
  }

  getPlayerGameState() {
    return {
      roomId: this.roomId,
      white: {
        id: this.whitePlayer.id,
        username: this.whitePlayer.username,
        rating: this.whitePlayer.rating,
        avatar: this.whitePlayer.avatar,
        country: this.whitePlayer.country,
        isBot: this.whitePlayer.isBot
      },
      black: {
        id: this.blackPlayer.id,
        username: this.blackPlayer.username,
        rating: this.blackPlayer.rating,
        avatar: this.blackPlayer.avatar,
        country: this.blackPlayer.country,
        isBot: this.blackPlayer.isBot
      },
      fen: this.chess.fen(),
      activeColor: this.activeColor,
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
      status: this.status,
      moves: this.moves
    };
  }

  getBroadcastData(totalMatches) {
    return {
      status: this.status,
      roomId: this.roomId,
      white: {
        username: this.whitePlayer.username,
        rating: this.whitePlayer.rating,
        avatar: this.whitePlayer.avatar,
        country: this.whitePlayer.country
      },
      black: {
        username: this.blackPlayer.username,
        rating: this.blackPlayer.rating,
        avatar: this.blackPlayer.avatar,
        country: this.blackPlayer.country
      },
      fen: this.chess.fen(),
      activeColor: this.activeColor,
      whiteTime: this.whiteTime,
      blackTime: this.blackTime,
      moves: this.moves.slice(-10), // last 10 moves for ticker
      isCheck: this.chess.inCheck(),
      result: this.result,
      winner: this.winner,
      resultReason: this.resultReason,
      totalMatches,
      spectatorCount: Math.floor(Math.random() * 40) + 128 // YouTube live stream hype
    };
  }
}
