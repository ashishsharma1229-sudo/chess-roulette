import React, { useState, useEffect } from 'react';
import { ChessPiece } from '../utils/chessPieces';

export const Chessboard = ({
  chess,
  orientation = 'w',
  isInteractive = true,
  lastMove = null,
  onMove = () => {},
  boardSize = '100%',
  theme = 'green', // 'green', 'wood', 'slate'
  showEvalBar = true
}) => {
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [pendingPromotion, setPendingPromotion] = useState(null);
  const [draggedSquare, setDraggedSquare] = useState(null);

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();

  // Clear selections on board state update
  useEffect(() => {
    setSelectedSquare(null);
    setLegalMoves([]);
  }, [chess?.fen()]);

  // Find King square if in check
  let checkSquare = null;
  if (chess && chess.inCheck()) {
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          checkSquare = `${files[c]}${8 - r}`;
          break;
        }
      }
    }
  }

  // Calculate simple evaluation for the Eval Bar based on material & mobility
  const calculateEval = () => {
    if (!chess) return { score: '+0.0', whitePercent: 50 };
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? { score: '#M', whitePercent: 0 } : { score: '#M', whitePercent: 100 };
    }
    const board = chess.board();
    const vals = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 };
    let score = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) score += (p.color === 'w' ? 1 : -1) * vals[p.type];
      }
    }
    // Cap percent between 5% and 95%
    const whitePercent = Math.max(5, Math.min(95, 50 + score * 5));
    const formattedScore = score >= 0 ? `+${score.toFixed(1)}` : score.toFixed(1);
    return { score: formattedScore, whitePercent };
  };

  const evalData = calculateEval();

  const handleSquareClick = (square) => {
    if (!isInteractive || !chess) return;

    if (selectedSquare) {
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }

      const move = legalMoves.find(m => m.to === square);
      if (move) {
        executeMove(selectedSquare, square);
        return;
      }

      const piece = chess.get(square);
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setLegalMoves(moves);
        return;
      }

      setSelectedSquare(null);
      setLegalMoves([]);
      return;
    }

    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves);
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const executeMove = (from, to) => {
    const piece = chess.get(from);
    const isPawn = piece && piece.type === 'p';
    const isPromotionRank = (piece?.color === 'w' && to[1] === '8') || (piece?.color === 'b' && to[1] === '1');

    if (isPawn && isPromotionRank) {
      setPendingPromotion({ from, to, color: piece.color });
    } else {
      onMove({ from, to });
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  const handlePromotionSelect = (pieceType) => {
    if (!pendingPromotion) return;
    onMove({
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: pieceType
    });
    setPendingPromotion(null);
    setSelectedSquare(null);
    setLegalMoves([]);
  };

  const handleDragStart = (e, square) => {
    if (!isInteractive || !chess) return;
    const piece = chess.get(square);
    if (piece && piece.color === chess.turn()) {
      setDraggedSquare(square);
      setSelectedSquare(square);
      const moves = chess.moves({ square, verbose: true });
      setLegalMoves(moves);
      e.dataTransfer.setData('text/plain', square);
      e.dataTransfer.effectAllowed = 'move';
    } else {
      e.preventDefault();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSquare) => {
    e.preventDefault();
    if (!draggedSquare) return;
    const move = legalMoves.find(m => m.to === targetSquare);
    if (move) {
      executeMove(draggedSquare, targetSquare);
    }
    setDraggedSquare(null);
  };

  return (
    <div className={`board-with-eval theme-${theme}`} style={{ width: boardSize }}>
      {/* Chess.com Vertical Evaluation Bar */}
      {showEvalBar && (
        <div className="eval-bar-container">
          <div
            className="eval-bar-black"
            style={{ height: `${100 - evalData.whitePercent}%` }}
          />
          <div
            className="eval-bar-white"
            style={{ height: `${evalData.whitePercent}%` }}
          />
          <div className="eval-score-label white-score">
            {evalData.whitePercent >= 50 ? evalData.score : ''}
          </div>
          <div className="eval-score-label black-score">
            {evalData.whitePercent < 50 ? evalData.score : ''}
          </div>
        </div>
      )}

      {/* Chessboard Box */}
      <div className="chessboard-box">
        <div className="chess-grid">
          {displayRanks.map((rank, rIdx) =>
            displayFiles.map((file, fIdx) => {
              const square = `${file}${rank}`;
              const isLight = (files.indexOf(file) + parseInt(rank)) % 2 !== 0;
              const piece = chess ? chess.get(square) : null;
              const isSelected = selectedSquare === square;
              const isLastMoveFrom = lastMove?.from === square;
              const isLastMoveTo = lastMove?.to === square;
              const isCheck = checkSquare === square;
              const legalMove = legalMoves.find(m => m.to === square);

              return (
                <div
                  key={square}
                  className={`chess-square ${isLight ? 'light' : 'dark'} ${isSelected ? 'selected' : ''} ${
                    isLastMoveFrom || isLastMoveTo ? 'last-move' : ''
                  } ${isCheck ? 'in-check' : ''}`}
                  onClick={() => handleSquareClick(square)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, square)}
                  style={{ position: 'relative' }}
                >
                  {/* Coordinates in corner squares (Chess.com style) */}
                  {fIdx === 0 && (
                    <span className="coord-label coord-rank">{rank}</span>
                  )}
                  {rIdx === 7 && (
                    <span className="coord-label coord-file">{file}</span>
                  )}

                  {/* Piece Rendering */}
                  {piece && (
                    <div
                      draggable={isInteractive && piece.color === chess?.turn()}
                      onDragStart={(e) => handleDragStart(e, square)}
                      style={{
                        width: '88%',
                        height: '88%',
                        cursor: isInteractive && piece.color === chess?.turn() ? 'grab' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'transform 0.1s ease',
                        pointerEvents: isInteractive && piece.color === chess?.turn() ? 'auto' : 'none'
                      }}
                    >
                      <ChessPiece type={piece.type} color={piece.color} />
                    </div>
                  )}

                  {/* Legal Move Indicators (Chess.com subtle dots) */}
                  {legalMove && (
                    legalMove.captured ? (
                      <div className="legal-capture-ring" />
                    ) : (
                      <div className="legal-dot" />
                    )
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pawn Promotion Dialog */}
        {pendingPromotion && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50
            }}
            onClick={() => setPendingPromotion(null)}
          >
            <div
              style={{
                background: 'var(--bg-panel)',
                padding: '16px',
                borderRadius: '8px',
                display: 'flex',
                gap: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.8)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {['q', 'r', 'b', 'n'].map(p => (
                <button
                  key={p}
                  onClick={() => handlePromotionSelect(p)}
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'var(--bg-panel-secondary)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ChessPiece type={p} color={pendingPromotion.color} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
