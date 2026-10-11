import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from '../components/Chessboard';
import { getWebSocketUrl } from '../utils/wsUrl';

export const BroadcastView = () => {
  const [broadcastData, setBroadcastData] = useState(null);
  const [chess, setChess] = useState(() => new Chess());
  const [lastMove, setLastMove] = useState(null);

  useEffect(() => {
    const wsUrl = getWebSocketUrl();
    let socket;

    try {
      socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[OBS Broadcast] Connected to Broadcast feed');
        socket.send(JSON.stringify({ type: 'SUBSCRIBE_BROADCAST' }));
      };

      socket.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          if (type === 'BROADCAST_STATE') {
            setBroadcastData(data);
            if (data?.fen) {
              const newChess = new Chess(data.fen);
              setChess(newChess);
              if (data.moves && data.moves.length > 0) {
                const latest = data.moves[data.moves.length - 1];
                setLastMove({ from: latest.from, to: latest.to });
              }
            }
          }
        } catch (e) {
          console.error('[OBS Parse Error]', e);
        }
      };

      socket.onclose = () => {
        console.log('[OBS Broadcast] Connection closed');
      };
    } catch (err) {
      console.warn('[OBS Broadcast] Connection error', err);
    }

    return () => {
      if (socket) socket.close();
    };
  }, []);

  const formatClock = (seconds) => {
    const s = Math.max(0, seconds || 0);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isStandby = !broadcastData || broadcastData.status === 'STANDBY';

  return (
    <div className="broadcast-viewport">
      {/* Top Esports TV Header */}
      <header className="broadcast-header">
        <div className="broadcast-brand">
          <div className="brand-icon" style={{ width: '48px', height: '48px', fontSize: '28px' }}>
            ♟️
          </div>
          <div>
            <h1 className="broadcast-title">CHESS ROULETTE LIVE</h1>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
              CONTINUOUS 24/7 RANDOM STRANGER BATTLES
            </div>
          </div>
        </div>

        <div className="broadcast-stats">
          <div className="live-ticker" style={{ fontSize: '16px', padding: '8px 20px' }}>
            <span className="live-indicator" style={{ width: '12px', height: '12px' }} />
            <strong style={{ color: 'var(--neon-red)', letterSpacing: '1px' }}>ON AIR</strong>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>{broadcastData?.spectatorCount || 142} Viewers</span>
          </div>

          <div className="brand-badge" style={{ fontSize: '15px', padding: '8px 16px' }}>
            MATCH #{broadcastData?.totalMatches || 42}
          </div>
        </div>
      </header>

      {/* Main Broadcast Body */}
      {isStandby ? (
        <div className="broadcast-standby">
          <div className="radar-spinner" style={{ width: '220px', height: '220px' }}>
            <div className="radar-sweep" style={{ borderWidth: '4px' }} />
            <div className="radar-center-icon" style={{ fontSize: '72px' }}>🎲</div>
          </div>
          <h2 style={{ fontSize: '42px', fontWeight: '900', color: 'var(--neon-cyan)', letterSpacing: '-0.5px' }}>
            WAITING FOR NEXT ROULETTE DUEL...
          </h2>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', maxWidth: '600px' }}>
            Players are currently pairing in the queue. The next live game will automatically appear here on stream.
          </p>
          <div className="brand-badge" style={{ fontSize: '18px', padding: '10px 24px', borderRadius: '30px' }}>
            Play online at: chessroulette.live
          </div>
        </div>
      ) : (
        <div className="broadcast-body">
          {/* Centered High-Def Chessboard */}
          <div className="broadcast-board-card">
            <Chessboard
              chess={chess}
              orientation="w"
              isInteractive={false}
              lastMove={lastMove}
              boardSize="100%"
            />
          </div>

          {/* Broadcast Sidebar */}
          <div className="broadcast-sidebar">
            {/* Black Player Card */}
            <div className={`broadcast-player-card ${broadcastData?.activeColor === 'b' ? 'active-turn' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="player-avatar" style={{ width: '64px', height: '64px', fontSize: '32px' }}>
                  {broadcastData?.black?.avatar || '♚'}
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800' }}>
                    <span>{broadcastData?.black?.country || '🌐'} </span>
                    <span>{broadcastData?.black?.username || 'Black Player'}</span>
                  </h3>
                  <div style={{ fontSize: '16px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {broadcastData?.black?.rating || 1500} ELO • Black
                  </div>
                </div>
              </div>
              <div className={`broadcast-clock ${broadcastData?.activeColor === 'b' ? 'active' : ''}`}>
                {formatClock(broadcastData?.blackTime)}
              </div>
            </div>

            {/* Match Status & Evaluation Center */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-md)',
                padding: '24px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '14px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                MATCH STATUS
              </div>
              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '900',
                  marginTop: '8px',
                  color: broadcastData?.isCheck ? 'var(--neon-red)' : broadcastData?.status === 'FINISHED' ? 'var(--neon-gold)' : 'var(--neon-green)'
                }}
              >
                {broadcastData?.status === 'FINISHED'
                  ? `${broadcastData?.resultReason} (${broadcastData?.result})`
                  : broadcastData?.isCheck
                  ? '⚠️ CHECK!'
                  : `${broadcastData?.activeColor === 'w' ? 'White' : 'Black'}'s Turn`}
              </div>

              {/* Move Notation Ticker */}
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  justifyContent: 'center',
                  marginTop: '16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  overflowX: 'auto',
                  padding: '8px 0'
                }}
              >
                {(broadcastData?.moves || []).map((m, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      color: idx === (broadcastData.moves.length - 1) ? 'var(--neon-cyan)' : 'var(--text-secondary)'
                    }}
                  >
                    {m.san}
                  </span>
                ))}
              </div>
            </div>

            {/* White Player Card */}
            <div className={`broadcast-player-card ${broadcastData?.activeColor === 'w' ? 'active-turn' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="player-avatar" style={{ width: '64px', height: '64px', fontSize: '32px' }}>
                  {broadcastData?.white?.avatar || '♔'}
                </div>
                <div>
                  <h3 style={{ fontSize: '24px', fontWeight: '800' }}>
                    <span>{broadcastData?.white?.country || '🌐'} </span>
                    <span>{broadcastData?.white?.username || 'White Player'}</span>
                  </h3>
                  <div style={{ fontSize: '16px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                    {broadcastData?.white?.rating || 1500} ELO • White
                  </div>
                </div>
              </div>
              <div className={`broadcast-clock ${broadcastData?.activeColor === 'w' ? 'active' : ''}`}>
                {formatClock(broadcastData?.whiteTime)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
