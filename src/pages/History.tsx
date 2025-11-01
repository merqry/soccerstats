import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameHistory } from '../components/GameHistory';
import { GameDetails } from '../components/GameDetails';

export const History: React.FC = () => {
  const navigate = useNavigate();
  const [viewingGameId, setViewingGameId] = useState<number | null>(null);

  const handleViewGame = (gameId: number) => {
    setViewingGameId(gameId);
  };

  const handleBackToList = () => {
    setViewingGameId(null);
  };

  if (viewingGameId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-4">
          <GameDetails
            gameId={viewingGameId}
            onBack={handleBackToList}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              ← Home
            </button>
            <h1 className="text-xl font-bold text-gray-800">Game History</h1>
            <button
              onClick={() => navigate('/new-game')}
              className="btn-primary"
            >
              New Game
            </button>
          </div>

          <GameHistory onViewGame={handleViewGame} />
        </div>
      </div>
    </div>
  );
};