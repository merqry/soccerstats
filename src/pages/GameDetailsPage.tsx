import { useParams, useNavigate } from 'react-router-dom';
import { GameDetails } from '../components/GameDetails';

export const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Game ID not found</p>
          <button
            onClick={() => navigate('/history')}
            className="btn-primary mt-4"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-4">
        <GameDetails 
          gameId={parseInt(id)} 
          onBack={() => navigate('/history')} 
        />
      </div>
    </div>
  );
};


