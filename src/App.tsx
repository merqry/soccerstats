import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Players } from './pages/Players';
import { NewGame } from './pages/NewGame';
import { History } from './pages/History';
import { GameDetailsPage } from './pages/GameDetailsPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/players" element={<Players />} />
        <Route path="/new-game" element={<NewGame />} />
        <Route path="/history" element={<History />} />
        <Route path="/game/:id" element={<GameDetailsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
