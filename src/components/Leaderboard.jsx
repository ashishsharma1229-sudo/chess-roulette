import React from 'react';

export const Leaderboard = ({ isOpen, onClose, data = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🏆</span>
            <span>Roulette Hall of Fame</span>
          </h2>
          <button className="btn-icon" onClick={onClose}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
          {data.map((player) => (
            <div
              key={player.rank}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                background: player.rank === 1 ? 'rgba(255, 190, 11, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                borderRadius: 'var(--radius-sm)',
                border: player.rank === 1 ? '1px solid rgba(255, 190, 11, 0.35)' : '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: '800',
                    fontSize: '14px',
                    color: player.rank === 1 ? 'var(--neon-gold)' : player.rank === 2 ? '#cbd5e1' : player.rank === 3 ? '#cd7f32' : 'var(--text-muted)',
                    width: '20px'
                  }}
                >
                  #{player.rank}
                </span>
                <span style={{ fontSize: '18px' }}>{player.country}</span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: '700', fontSize: '14px' }}>{player.username}</div>
                  <div style={{ fontSize: '11px', color: 'var(--neon-cyan)', fontFamily: 'var(--font-mono)' }}>
                    🔥 {player.streak} win streak
                  </div>
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--text-primary)' }}>
                {player.rating} ELO
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
