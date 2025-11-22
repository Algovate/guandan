import { useEffect } from 'react';
import GameTable from './components/GameTable';
import Tutorial from './components/Tutorial';
import Settings from './components/Settings';
import DebugPanel from './components/DebugPanel';
import './App.css';

function App() {
  useEffect(() => {
    // 防止页面滚动
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="app-container">
      <GameTable />
      <Tutorial />
      <Settings />
      <DebugPanel />
    </div>
  );
}

export default App;