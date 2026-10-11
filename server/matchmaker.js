import { GameRoom } from './game_room.js';

export class Matchmaker {
  constructor(io) {
    this.queue = []; // [{ id, ws, username, rating, avatar, country, botFallbackTimer }]
    this.rooms = new Map(); // roomId -> GameRoom
    this.broadcastClients = new Set(); // WebSockets listening for OBS broadcast
    this.totalMatchesPlayed = 42; // starting counter for atmosphere
    this.featuredRoomId = null;
  }

  addBroadcastClient(ws) {
    this.broadcastClients.add(ws);
    // Send current featured game or standby state
    this.sendFeaturedUpdate(ws);

    ws.on('close', () => {
      this.broadcastClients.delete(ws);
    });
  }

  sendFeaturedUpdate(targetWs = null) {
    const featuredRoom = this.getFeaturedRoom();
    const payload = JSON.stringify({
      type: 'BROADCAST_STATE',
      data: featuredRoom ? featuredRoom.getBroadcastData(this.totalMatchesPlayed) : {
        status: 'STANDBY',
        message: 'WAITING FOR NEXT ROULETTE DUEL...',
        spectatorCount: this.getSpectatorCount(),
        totalMatches: this.totalMatchesPlayed,
        activeGamesCount: this.rooms.size,
      }
    });

    if (targetWs) {
      if (targetWs.readyState === 1) targetWs.send(payload);
    } else {
      for (const client of this.broadcastClients) {
        if (client.readyState === 1) client.send(payload);
      }
    }
  }

  getFeaturedRoom() {
    if (this.featuredRoomId && this.rooms.has(this.featuredRoomId)) {
      const room = this.rooms.get(this.featuredRoomId);
      if (room.status === 'PLAYING' || room.status === 'FINISHED') return room;
    }
    // Pick first active room if any
    for (const room of this.rooms.values()) {
      if (room.status === 'PLAYING') {
        this.featuredRoomId = room.roomId;
        return room;
      }
    }
    return null;
  }

  getSpectatorCount() {
    return this.broadcastClients.size + Math.floor(Math.random() * 5) + 12; // broadcast viewers + simulated chat baseline
  }

  joinQueue(player) {
    // Prevent duplicate entries
    this.leaveQueue(player.id);

    console.log(`[Matchmaker] Player ${player.username} (${player.id}) joined queue. Current queue length: ${this.queue.length + 1}`);

    // If there is already someone in queue, match them immediately!
    if (this.queue.length > 0) {
      const opponent = this.queue.shift();
      clearTimeout(opponent.botFallbackTimer);
      this.createMatch(opponent, player);
    } else {
      // Set a 6-second timer where player can either wait or auto-match bot if alone
      const botFallbackTimer = setTimeout(() => {
        // If still in queue, offer or spawn bot sparring match
        const idx = this.queue.findIndex(p => p.id === player.id);
        if (idx !== -1) {
          player.ws.send(JSON.stringify({
            type: 'QUEUE_STATUS',
            data: { waitingTime: 6, canPlayBot: true }
          }));
        }
      }, 5000);

      player.botFallbackTimer = botFallbackTimer;
      this.queue.push(player);

      player.ws.send(JSON.stringify({
        type: 'QUEUE_STATUS',
        data: { position: this.queue.length, waitingTime: 0 }
      }));
    }
  }

  leaveQueue(playerId) {
    const idx = this.queue.findIndex(p => p.id === playerId);
    if (idx !== -1) {
      const [removed] = this.queue.splice(idx, 1);
      if (removed.botFallbackTimer) clearTimeout(removed.botFallbackTimer);
      return true;
    }
    return false;
  }

  createMatch(p1, p2, isBotMatch = false) {
    this.totalMatchesPlayed++;
    const roomId = 'match_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // Randomize White and Black
    const isP1White = Math.random() > 0.5;
    const whitePlayer = isP1White ? p1 : p2;
    const blackPlayer = isP1White ? p2 : p1;

    console.log(`[Matchmaker] Match created ${roomId}: White=${whitePlayer.username} vs Black=${blackPlayer.username}`);

    const room = new GameRoom(roomId, whitePlayer, blackPlayer, isBotMatch, {
      onStateChange: (updatedRoom) => {
        if (this.featuredRoomId === updatedRoom.roomId || !this.featuredRoomId) {
          this.featuredRoomId = updatedRoom.roomId;
          this.sendFeaturedUpdate();
        }
      },
      onGameEnd: (finishedRoom) => {
        this.sendFeaturedUpdate();
        // Remove room after 2 minutes of retention
        setTimeout(() => {
          this.rooms.delete(finishedRoom.roomId);
        }, 120000);
      }
    });

    this.rooms.set(roomId, room);

    // Set as featured if no active game is featured
    if (!this.featuredRoomId || !this.rooms.has(this.featuredRoomId)) {
      this.featuredRoomId = roomId;
    }

    room.start();
    this.sendFeaturedUpdate();
  }

  matchWithBot(player, botDifficulty = 'Grandmaster Bot') {
    this.leaveQueue(player.id);
    const botRatings = { 'Blitz Bot': 1420, 'Grandmaster Bot': 2180, 'Bullet Demon': 1850 };
    const botOpponent = {
      id: 'bot_' + Date.now(),
      ws: null, // bot has null ws
      username: botDifficulty,
      rating: botRatings[botDifficulty] || 1600,
      avatar: '🤖',
      country: '🌐',
      isBot: true,
      botDifficulty
    };
    this.createMatch(player, botOpponent, true);
  }

  handlePlayerDisconnect(playerId) {
    this.leaveQueue(playerId);
    for (const room of this.rooms.values()) {
      if (room.hasPlayer(playerId)) {
        room.handleDisconnect(playerId);
      }
    }
  }
}
