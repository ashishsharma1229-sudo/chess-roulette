import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Matchmaker } from './matchmaker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const matchmaker = new Matchmaker();

// Map ws -> player metadata
const connectedPlayers = new Map();

// Sample Leaderboard data for atmosphere
const leaderboard = [
  { rank: 1, username: 'Grandmaster_X', rating: 2310, streak: 12, country: '🇮🇳' },
  { rank: 2, username: 'NeonKnight_99', rating: 2195, streak: 9, country: '🇺🇸' },
  { rank: 3, username: 'QueenGambit_Pro', rating: 2040, streak: 8, country: '🇩🇪' },
  { rank: 4, username: 'Bullet_Demon', rating: 1980, streak: 6, country: '🇬🇧' },
  { rank: 5, username: 'RookRoulette', rating: 1890, streak: 5, country: '🇯🇵' },
  { rank: 6, username: 'CheckmateKing', rating: 1820, streak: 4, country: '🇫🇷' },
];

app.get('/api/status', (req, res) => {
  res.json({
    status: 'ONLINE',
    onlinePlayers: connectedPlayers.size + 14,
    activeMatches: matchmaker.rooms.size,
    inQueue: matchmaker.queue.length,
    totalMatchesToday: matchmaker.totalMatchesPlayed
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

wss.on('connection', (ws) => {
  const playerId = 'p_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  let playerData = {
    id: playerId,
    ws,
    username: 'Rookie_' + Math.floor(100 + Math.random() * 900),
    rating: 1200 + Math.floor(Math.random() * 150),
    avatar: '♟️',
    country: '🇮🇳'
  };

  connectedPlayers.set(ws, playerData);
  console.log(`[WS] Connection opened. Assigned ID: ${playerId}`);

  // Send welcome
  ws.send(JSON.stringify({
    type: 'CONNECTED',
    data: {
      playerId,
      username: playerData.username,
      rating: playerData.rating,
      onlineCount: connectedPlayers.size + 14
    }
  }));

  ws.on('message', (message) => {
    try {
      const { type, data } = JSON.parse(message.toString());

      switch (type) {
        case 'IDENTIFY':
          if (data?.username) playerData.username = data.username.trim();
          if (data?.avatar) playerData.avatar = data.avatar;
          if (data?.country) playerData.country = data.country;
          if (data?.rating) playerData.rating = Number(data.rating);
          connectedPlayers.set(ws, playerData);
          ws.send(JSON.stringify({
            type: 'IDENTITY_UPDATED',
            data: {
              username: playerData.username,
              rating: playerData.rating,
              avatar: playerData.avatar
            }
          }));
          break;

        case 'JOIN_QUEUE':
          matchmaker.joinQueue(playerData);
          break;

        case 'LEAVE_QUEUE':
          matchmaker.leaveQueue(playerData.id);
          ws.send(JSON.stringify({ type: 'QUEUE_LEFT' }));
          break;

        case 'PLAY_BOT':
          matchmaker.matchWithBot(playerData, data?.difficulty || 'Grandmaster Bot');
          break;

        case 'MAKE_MOVE':
          if (data?.roomId && data?.move) {
            const room = matchmaker.rooms.get(data.roomId);
            if (room) {
              const result = room.makeMove(playerData.id, data.move);
              if (!result.success) {
                ws.send(JSON.stringify({
                  type: 'MOVE_REJECTED',
                  data: { reason: result.reason }
                }));
              }
            }
          }
          break;

        case 'RESIGN':
          if (data?.roomId) {
            const room = matchmaker.rooms.get(data.roomId);
            if (room) {
              room.resign(playerData.id);
            }
          }
          break;

        case 'NEXT_ROULETTE':
          // Instantly leaves current game context and enters queue
          console.log(`[Roulette] Player ${playerData.username} spun next!`);
          matchmaker.joinQueue(playerData);
          break;

        case 'SUBSCRIBE_BROADCAST':
          // Client wants to act as OBS stream overlay
          console.log(`[OBS Broadcast] OBS Client subscribed from ${playerId}`);
          matchmaker.addBroadcastClient(ws);
          break;

        default:
          console.log(`[WS] Unknown action type: ${type}`);
      }
    } catch (err) {
      console.error('[WS Message Error]', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected: ${playerData.id}`);
    matchmaker.handlePlayerDisconnect(playerData.id);
    connectedPlayers.delete(ws);
  });
});

// Single Page App fallback for production (Express 5 compatible)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) res.status(200).send('Chess Roulette Backend Running');
  });
});

server.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                 CHESS ROULETTE SERVER                      ║
  ║                                                            ║
  ║  ⚡ HTTP API: http://localhost:${PORT}                      ║
  ║  ⚡ WebSocket: ws://localhost:${PORT}                       ║
  ║  🎲 Broadcast Ready for OBS Studio Live Streaming         ║
  ╚════════════════════════════════════════════════════════════╝
  `);
});
