import React, { useState, useEffect } from 'react';
import { ArenaView } from './views/ArenaView';
import { BroadcastView } from './views/BroadcastView';

export function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.hash || '#/');

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(window.location.hash || '#/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (currentRoute === '#/broadcast') {
    return <BroadcastView />;
  }

  return <ArenaView />;
}

export default App;
