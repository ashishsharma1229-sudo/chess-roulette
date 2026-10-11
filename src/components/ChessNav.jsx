import React from 'react';

export const ChessNav = ({
  playerData,
  activeView = 'play',
  onSelectView = () => {},
  soundEnabled = true,
  onToggleSound = () => {},
  currentTheme = 'green',
  onCycleTheme = () => {},
  onOpenLeaderboard = () => {}
}) => {
  return (
    <nav className="chesscom-nav">
      <div>
        {/* Chess.com Style Logo */}
        <div className="nav-logo" onClick={() => onSelectView('play')}>
          <div className="nav-logo-icon">♟️</div>
          <div className="nav-label">
            <div className="nav-logo-text">CHESS</div>
            <div className="nav-logo-sub">ROULETTE</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="nav-menu">
          <div
            className={`nav-item ${activeView === 'play' ? 'active' : ''}`}
            onClick={() => onSelectView('play')}
            title="Play Online / Roulette"
          >
            <span className="nav-item-icon">♟️</span>
            <span className="nav-label">Play</span>
          </div>

          <div
            className="nav-item"
            onClick={onOpenLeaderboard}
            title="Leaderboard & Rankings"
          >
            <span className="nav-item-icon">🏆</span>
            <span className="nav-label">Leaderboard</span>
          </div>

          <a
            href="#/broadcast"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
            title="Watch Live (1080p OBS Broadcast)"
          >
            <span className="nav-item-icon">📺</span>
            <span className="nav-label">Watch Live</span>
          </a>

          <div
            className="nav-item"
            onClick={onCycleTheme}
            title={`Board Theme: ${currentTheme}`}
          >
            <span className="nav-item-icon">🎨</span>
            <span className="nav-label">Theme</span>
          </div>

          <div
            className="nav-item"
            onClick={onToggleSound}
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            <span className="nav-item-icon">{soundEnabled ? '🔊' : '🔇'}</span>
            <span className="nav-label">{soundEnabled ? 'Sound On' : 'Muted'}</span>
          </div>
        </div>
      </div>

      {/* User Profile Footer */}
      <div className="nav-user">
        <div className="nav-user-avatar">{playerData?.avatar || '♟️'}</div>
        <div className="nav-user-info nav-label">
          <div className="nav-user-name">{playerData?.username || 'Guest'}</div>
          <div className="nav-user-rating">{playerData?.rating || 1500} ELO</div>
        </div>
      </div>
    </nav>
  );
};
