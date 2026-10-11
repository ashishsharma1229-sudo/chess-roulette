import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/SoundManager';

export const MatchModal = ({
  isOpen,
  type = 'MATCH_FOUND', // 'MATCH_FOUND' | 'GAME_OVER'
  data = {},
  onNextOpponent = () => {},
  onClose = () => {}
}) => {
  useEffect(() => {
    if (isOpen && type === 'GAME_OVER' && data?.isWinner) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      sounds.playGameOver(true);
    } else if (isOpen && type === 'GAME_OVER' && !data?.isWinner && data?.winner !== 'draw') {
      sounds.playGameOver(false);
    } else if (isOpen && type === 'MATCH_FOUND') {
      sounds.playGameStart();
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  if (type === 'MATCH_FOUND') {
    return (
      <div
        style={{
          position: 'fixed',
          top: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 90,
          background: 'rgba(15, 20, 34, 0.95)',
          border: '1px solid var(--neon-cyan)',
          boxShadow: '0 8px 32px var(--neon-cyan-glow)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          animation: 'scaleUp 0.25s ease',
          pointerEvents: 'auto'
        }}
      >
        <span style={{ fontSize: '28px' }}>🎲</span>
        <div>
          <div style={{ fontWeight: '800', color: 'var(--neon-cyan)', fontSize: '15px' }}>
            MATCH FOUND!
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            vs {data?.opponent?.username} ({data?.opponent?.rating} ELO) • Playing as <strong style={{ color: '#fff' }}>{data?.playerColor === 'w' ? 'White ♔' : 'Black ♚'}</strong>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ width: '28px', height: '28px', fontSize: '12px', marginLeft: '8px' }}
        >
          ✕
        </button>
      </div>
    );
  }

  // GAME OVER MODAL
  const isWinner = data?.isWinner;
  const isDraw = data?.winner === 'draw';

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
          {isWinner ? '🏆' : isDraw ? '🤝' : '💀'}
        </div>
        <h2
          className="modal-title"
          style={{
            color: isWinner ? 'var(--neon-green)' : isDraw ? 'var(--neon-gold)' : 'var(--neon-red)'
          }}
        >
          {isWinner ? 'VICTORY!' : isDraw ? 'DRAW!' : 'DEFEAT'}
        </h2>
        <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '6px' }}>
          {data?.resultReason || 'Game Concluded'} ({data?.result})
        </div>

        <div style={{ margin: '24px 0', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Ready for your next random challenger?
          </p>
          <button
            className="btn-roulette"
            onClick={() => {
              sounds.playRouletteSpin();
              onNextOpponent();
            }}
          >
            <span>NEXT OPPONENT 🎲</span>
          </button>
        </div>

        <button className="btn-secondary" onClick={onClose} style={{ marginTop: '10px' }}>
          Review Board
        </button>
      </div>
    </div>
  );
};
