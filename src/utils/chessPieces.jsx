import React from 'react';

// Standard high-fidelity vector chess pieces
export const ChessPiece = ({ type, color, size = '100%' }) => {
  const isWhite = color === 'w';
  const fill = isWhite ? '#ffffff' : '#1e2433';
  const stroke = isWhite ? '#20242e' : '#f0f4fc';
  const strokeWidth = 1.5;

  const renderPiece = () => {
    switch (type.toLowerCase()) {
      case 'p': // Pawn
        return (
          <g>
            <path
              d="M 22 9 c -2 0 -4 2 -4 4 c 0 1.5 0.8 2.8 2 3.5 C 18.5 17.5 17 20 17 23 c 0 2.5 1.5 4.5 3 5.5 c -3 2 -5 5.5 -5 9.5 l 14 0 c 0 -4 -2 -7.5 -5 -9.5 c 1.5 -1 3 -3 3 -5.5 c 0 -3 -1.5 -5.5 -3 -6.5 c 1.2 -0.7 2 -2 2 -3.5 c 0 -2 -2 -4 -4 -4 z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M 12 41 L 32 41 L 34 44 L 10 44 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </g>
        );

      case 'r': // Rook
        return (
          <g>
            <path
              d="M 9 39 L 36 39 L 36 36 L 9 36 Z M 12 36 L 12 32 L 33 32 L 33 36 Z M 11 14 L 11 9 L 15 9 L 15 11 L 20 11 L 20 9 L 25 9 L 25 11 L 30 11 L 30 9 L 34 9 L 34 14 L 31 17 L 14 17 Z M 14 17 L 14 29 L 31 29 L 31 17 Z M 14 29 L 12 32 L 33 32 L 31 29 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <path
              d="M 9 39 L 9 42 L 36 42 L 36 39 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'n': // Knight
        return (
          <g>
            <path
              d="M 22 10 C 22 10 24 7 19 6 C 14 5 11 8 11 12 C 11 14 12 16 12 16 C 12 16 9 17 8 20 C 7 23 8 26 10 26 C 11 26 12 25 12 25 C 10 28 11 32 13 33 C 14.5 33.7 17 33 17 33 C 15 36 12 37 9 38 L 9 42 L 36 42 L 36 37 C 36 37 36 30 35 25 C 34 20 31 16 30 14 C 29 11 27 10 22 10 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <circle cx="15" cy="14" r="1.5" fill={stroke} />
            <path
              d="M 9 39 L 36 39 L 36 42 L 9 42 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'b': // Bishop
        return (
          <g>
            <path
              d="M 9 39 L 36 39 L 36 36 L 9 36 Z M 12 36 L 12 32 L 33 32 L 33 36 Z M 15 32 C 15 28 17 24 17 20 C 14 19 13 16 14 13 C 15 10 18 8 22.5 8 C 27 8 30 10 31 13 C 32 16 31 19 28 20 C 28 24 30 28 30 32 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <circle cx="22.5" cy="6" r="1.8" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <path d="M 17.5 16 L 27.5 24" stroke={stroke} strokeWidth={strokeWidth} />
            <path d="M 22.5 13 L 22.5 21" stroke={stroke} strokeWidth={strokeWidth} />
            <path
              d="M 9 39 L 9 42 L 36 42 L 36 39 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </g>
        );

      case 'q': // Queen
        return (
          <g>
            <path
              d="M 9 39 L 36 39 L 36 36 L 9 36 Z M 12 36 L 12 32 L 33 32 L 33 36 Z M 9 39 L 9 42 L 36 42 L 36 39 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <path
              d="M 12 32 L 9 14 L 16 23 L 22.5 11 L 29 23 L 36 14 L 33 32 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
            <circle cx="9" cy="12" r="1.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="16" cy="20" r="1.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="22.5" cy="9" r="1.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="29" cy="20" r="1.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
            <circle cx="36" cy="12" r="1.5" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </g>
        );

      case 'k': // King
        return (
          <g>
            {/* Cross */}
            <path d="M 22.5 4 L 22.5 11 M 19 7.5 L 26 7.5" stroke={stroke} strokeWidth={strokeWidth + 0.3} strokeLinecap="round" />
            <path
              d="M 9 39 L 36 39 L 36 36 L 9 36 Z M 12 36 L 12 32 L 33 32 L 33 36 Z M 9 39 L 9 42 L 36 42 L 36 39 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <path
              d="M 12 32 C 11 25 15 22 17 19 C 14 17 13 14 15 12 C 17 10 20 11 22.5 12 C 25 11 28 10 30 12 C 32 14 31 17 28 19 C 30 22 34 25 33 32 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
            />
          </g>
        );

      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 45 45"
      width={size}
      height={size}
      style={{
        display: 'block',
        filter: isWhite ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 5px rgba(0,242,254,0.15))',
        pointerEvents: 'none',
        userSelect: 'none'
      }}
    >
      {renderPiece()}
    </svg>
  );
};
