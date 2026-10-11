// Smart WebSocket URL resolver for local dev and production (e.g. chessroulette.live)
export function getWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }

  const isSecure = window.location.protocol === 'https:';
  const wsProtocol = isSecure ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;

  // Local development with Vite (client on 5173, backend on 3001)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${wsProtocol}//${hostname}:3001`;
  }

  // Production on custom domain or cloud host (e.g. chessroulette.live)
  return `${wsProtocol}//${window.location.host}`;
}
