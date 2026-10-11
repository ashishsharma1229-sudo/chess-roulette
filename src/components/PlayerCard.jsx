import React from 'react';

export const PlayerCard = ({
  player,
  timeRemaining = 180,
  isActive = false,
  capturedPieces = [],
  materialAdvantage = 0,
  color = 'w'
}) => {
  const formatTime = (seconds) => {
    const s = Math.max(0, seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLowTime = isActive && timeRemaining <= 15;

  return (
    <div className="player-bar">
      <div className="player-info">
        <div className="player-avatar">
          {player?.avatar || (color === 'w' ? '♔' : '♚')}
        </div>
        <div className="player-details">
          <h4>
            <span>{player?.country || '🌐'}</span>
            <span>{player?.username || (color === 'w' ? 'White' : 'Black')}</span>
            <span className="player-rating">({player?.rating || 1500})</span>
            {player?.isBot && (
              <span
                style={{
                  fontSize: '10px',
                  background: 'var(--btn-green-bg)',
                  color: '#fff',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: '700'
                }}
              >
                BOT
              </span>
            )}
          </h4>
          {capturedPieces.length > 0 && (
            <div className="captured-pieces">
              {capturedPieces.map((p, i) => (
                <span key={i}>{p}</span>
              ))}
              {materialAdvantage > 0 && (
                <span className="material-delta">+{materialAdvantage}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chess.com Digital Clock */}
      <div className={`chesscom-clock ${isActive ? 'active' : ''} ${isLowTime ? 'low-time' : ''}`}>
        {formatTime(timeRemaining)}
      </div>
    </div>
  );
};
