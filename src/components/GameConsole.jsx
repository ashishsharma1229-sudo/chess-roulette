import React, { useState } from 'react';

export const GameConsole = ({
  gameState = 'IDLE', // IDLE, QUEUE, PLAYING, FINISHED
  moves = [],
  timeControl = '3 min',
  onSelectTimeControl = () => {},
  onStartQueue = () => {},
  onCancelQueue = () => {},
  onPlayBot = () => {},
  onNextOpponent = () => {},
  onResign = () => {},
  onOfferDraw = () => {},
  onFlipBoard = () => {},
  queueTime = 0,
  canPlayBot = false,
  gameOverData = null,
  currentMatch = null,
  playerColor = 'w',
  onlineStats = { online: 24, matches: 42 }
}) => {
  const [activeTab, setActiveTab] = useState(gameState === 'PLAYING' ? 'moves' : 'play');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: 'System', text: 'Welcome to Chess Roulette! Spin the wheel to get matched.' }
  ]);

  // Sync tab with game state change
  React.useEffect(() => {
    if (gameState === 'PLAYING') {
      setActiveTab('moves');
    } else if (gameState === 'FINISHED') {
      setActiveTab('play');
    }
  }, [gameState]);

  const sendEmojiReaction = (emoji) => {
    setChatMessages(prev => [
      ...prev,
      { id: Date.now(), user: 'You', text: emoji }
    ]);
  };

  // Group moves into pairs (White, Black)
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i]?.san || '',
      black: moves[i + 1]?.san || ''
    });
  }

  return (
    <div className="chesscom-console">
      {/* Console Top Tabs */}
      <div className="console-tabs">
        <div
          className={`console-tab ${activeTab === 'play' ? 'active' : ''}`}
          onClick={() => setActiveTab('play')}
        >
          <span>⚡</span>
          <span>Play</span>
        </div>
        <div
          className={`console-tab ${activeTab === 'moves' ? 'active' : ''}`}
          onClick={() => setActiveTab('moves')}
        >
          <span>📜</span>
          <span>Moves ({moves.length})</span>
        </div>
        <div
          className={`console-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span>💬</span>
          <span>Chat</span>
        </div>
      </div>

      {/* Console Body */}
      <div className="console-body">
        {/* ================= TAB 1: PLAY / MATCHMAKING ================= */}
        {activeTab === 'play' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between' }}>
            {gameState === 'IDLE' && (
              <>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '10px', textTransform: 'uppercase' }}>
                    Select Time Control
                  </div>
                  <div className="time-controls-grid">
                    {[
                      { id: '1 min', label: '1 min', type: 'Bullet ⚡' },
                      { id: '3 min', label: '3 min', type: 'Blitz ⏱️' },
                      { id: '5 min', label: '5 min', type: 'Rapid ⌛' }
                    ].map(tc => (
                      <div
                        key={tc.id}
                        className={`time-btn ${timeControl === tc.id ? 'active' : ''}`}
                        onClick={() => onSelectTimeControl(tc.id)}
                      >
                        <div className="time-btn-title">{tc.label}</div>
                        <div className="time-btn-subtitle">{tc.type}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button className="btn-chesscom-primary" onClick={onStartQueue}>
                    <span>🎲 Play Roulette</span>
                  </button>

                  <button className="btn-chesscom-secondary" onClick={() => onPlayBot('Grandmaster Bot')}>
                    <span>🤖 Spar against Bot</span>
                  </button>
                </div>

                <div style={{ background: 'var(--bg-panel-secondary)', padding: '12px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Players in queue</span>
                    <strong style={{ color: 'var(--btn-green-hover)' }}>{onlineStats.online} online</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Live broadcast status</span>
                    <strong style={{ color: '#fff' }}>24/7 ON AIR 📺</strong>
                  </div>
                </div>
              </>
            )}

            {gameState === 'QUEUE' && (
              <div style={{ textAlign: 'center', margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '48px', animation: 'floatIcon 1.5s infinite' }}>🎲</div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff' }}>Searching for Opponent...</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Queue time: <strong style={{ color: 'var(--btn-green-hover)', fontFamily: 'var(--font-mono)' }}>{queueTime}s</strong>
                  </p>
                </div>

                {canPlayBot && (
                  <button
                    className="btn-chesscom-secondary"
                    onClick={() => onPlayBot('Blitz Bot')}
                    style={{ borderColor: 'var(--text-gold)', color: 'var(--text-gold)' }}
                  >
                    <span>⚡ No wait: Play Sparring Bot</span>
                  </button>
                )}

                <button className="btn-chesscom-secondary" onClick={onCancelQueue} style={{ width: '100%', color: 'var(--text-red)' }}>
                  Cancel Queue
                </button>
              </div>
            )}

            {gameState === 'PLAYING' && (
              <div style={{ textAlign: 'center', margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '32px' }}>⚔️</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Match in Progress</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  You are playing as <strong>{playerColor === 'w' ? 'White ♔' : 'Black ♚'}</strong>
                </p>
                <button className="btn-chesscom-secondary" onClick={() => setActiveTab('moves')}>
                  View Moves Notation 📜
                </button>
              </div>
            )}

            {gameState === 'FINISHED' && (
              <div style={{ textAlign: 'center', margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '44px' }}>
                  {gameOverData?.isWinner ? '🏆' : gameOverData?.winner === 'draw' ? '🤝' : '💀'}
                </div>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: gameOverData?.isWinner ? 'var(--btn-green-hover)' : '#fff' }}>
                    {gameOverData?.isWinner ? 'Victory!' : gameOverData?.winner === 'draw' ? 'Game Drawn' : 'Game Over'}
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {gameOverData?.resultReason} ({gameOverData?.result})
                  </p>
                </div>

                <button className="btn-chesscom-primary" onClick={onNextOpponent}>
                  <span>🎲 Next Opponent (Spin)</span>
                </button>

                <button className="btn-chesscom-secondary" onClick={() => onPlayBot('Grandmaster Bot')}>
                  <span>🤖 Practice vs Bot</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: MOVES NOTATION ================= */}
        {activeTab === 'moves' && (
          <div className="move-table">
            {movePairs.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 16px', fontSize: '13px' }}>
                Moves will appear here as pieces are played...
              </div>
            ) : (
              movePairs.map((pair, idx) => (
                <div key={idx} className="move-row">
                  <span className="move-num">{pair.num}.</span>
                  <span className={`move-cell ${idx === movePairs.length - 1 && !pair.black ? 'active' : ''}`}>
                    {pair.white}
                  </span>
                  <span className={`move-cell ${idx === movePairs.length - 1 && pair.black ? 'active' : ''}`}>
                    {pair.black}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* ================= TAB 3: CHAT & REACTIONS ================= */}
        {activeTab === 'chat' && (
          <div className="chat-tab-container">
            <div className="emoji-reactions-bar">
              {['👍', '🔥', '👏', '😮', '😭', '💀'].map((emoji) => (
                <button key={emoji} className="emoji-btn" onClick={() => sendEmojiReaction(emoji)}>
                  {emoji}
                </button>
              ))}
            </div>

            <div className="chat-messages">
              {chatMessages.map(msg => (
                <div key={msg.id} className="chat-msg">
                  <span className="chat-msg-user">{msg.user}:</span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* In-Game Action Bar Footer (Chess.com bottom buttons) */}
      <div className="console-actions-footer">
        <button
          className="btn-action-icon"
          onClick={onFlipBoard}
          title="Flip Board View"
        >
          <span>🔄</span>
          <span>Flip</span>
        </button>

        <button
          className="btn-action-icon"
          onClick={onOfferDraw}
          disabled={gameState !== 'PLAYING'}
          title="Offer Draw"
        >
          <span>🤝</span>
          <span>Draw</span>
        </button>

        <button
          className="btn-action-icon danger"
          onClick={onResign}
          disabled={gameState !== 'PLAYING'}
          title="Resign Match"
        >
          <span>🏳️</span>
          <span>Resign</span>
        </button>
      </div>
    </div>
  );
};
