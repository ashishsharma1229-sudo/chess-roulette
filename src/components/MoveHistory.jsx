import React, { useEffect, useRef } from 'react';

export const MoveHistory = ({ moves = [] }) => {
  const containerRef = useRef(null);

  // Group into pairs: [{ num: 1, white: 'e4', black: 'e5' }]
  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i]?.san || '',
      black: moves[i + 1]?.san || ''
    });
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves.length]);

  return (
    <div className="panel-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <h3>
          <span>📜</span>
          <span>Move Notation</span>
        </h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {moves.length} half-moves
        </span>
      </div>

      <div className="moves-list" ref={containerRef} style={{ flex: 1, minHeight: '140px' }}>
        {movePairs.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: '13px' }}>
            Game will record moves here...
          </div>
        ) : (
          movePairs.map((pair, idx) => (
            <React.Fragment key={idx}>
              <span className="move-num">{pair.num}.</span>
              <span className={`move-san ${idx === movePairs.length - 1 && !pair.black ? 'active' : ''}`}>
                {pair.white}
              </span>
              <span className={`move-san ${idx === movePairs.length - 1 && pair.black ? 'active' : ''}`}>
                {pair.black}
              </span>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  );
};
