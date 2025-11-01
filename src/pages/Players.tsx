import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Player } from '../types';
import { useDB } from '../hooks/useDB';

export const Players = () => {
  const navigate = useNavigate();
  const { getPlayers, addPlayer, updatePlayer, deletePlayer, isReady } = useDB();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    teamName: ''
  });

  useEffect(() => {
    if (isReady) {
      loadPlayers();
    }
  }, [isReady]);

  const loadPlayers = async () => {
    const playersData = await getPlayers();
    setPlayers(playersData);
  };

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.position.trim() && formData.teamName.trim()) {
      try {
        await addPlayer({
          ...formData,
          createdAt: new Date()
        });
        await loadPlayers();
        setShowForm(false);
        setFormData({ name: '', position: '', teamName: '' });
      } catch (error) {
        console.error('Error adding player:', error);
        alert('Failed to add player. Please try again.');
      }
    }
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (window.confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
      try {
        await deletePlayer(playerId);
        await loadPlayers();
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Failed to delete player. Please try again.');
      }
    }
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name,
      position: player.position,
      teamName: player.teamName
    });
    setShowForm(true);
  };

  const handleUpdatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer?.id) return;
    
    try {
      await updatePlayer(editingPlayer.id, {
        ...formData,
        createdAt: editingPlayer.createdAt
      });
      await loadPlayers();
      setEditingPlayer(null);
      setShowForm(false);
      setFormData({ name: '', position: '', teamName: '' });
    } catch (error) {
      console.error('Error updating player:', error);
      alert('Failed to update player. Please try again.');
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingPlayer(null);
    setFormData({ name: '', position: '', teamName: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const positions = [
    'Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Winger', 'Striker'
  ];

  if (!isReady) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f8fafc', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '2px solid #2563eb',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '1.5rem' 
          }}>
            <button
              onClick={handleCancelForm}
              style={{
                backgroundColor: '#e5e7eb',
                color: '#374151',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
              {editingPlayer ? 'Edit Player' : 'Add Player'}
            </h1>
            <div></div>
          </div>

          <div style={{ 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb', 
            padding: '1.5rem',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <h2 style={{ 
              fontSize: '1.25rem', 
              fontWeight: 'bold', 
              color: '#1f2937', 
              marginBottom: '1rem' 
            }}>
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </h2>
            
            <form onSubmit={editingPlayer ? handleUpdatePlayer : handleAddPlayer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  Player Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter player name"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  Position
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  required
                >
                  <option value="">Select position</option>
                  {positions.map(position => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                  Team Name
                </label>
                <input
                  type="text"
                  name="teamName"
                  value={formData.teamName}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    backgroundColor: '#2563eb',
                    color: 'white',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {editingPlayer ? 'Update Player' : 'Add Player'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  style={{
                    flex: 1,
                    backgroundColor: '#e5e7eb',
                    color: '#374151',
                    padding: '0.75rem',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '1.5rem' 
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              backgroundColor: '#e5e7eb',
              color: '#374151',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            ← Home
          </button>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Manage Players</h1>
          <button
            onClick={() => setShowForm(true)}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Add Player
          </button>
        </div>

        {/* Players List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {players.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
              border: '1px solid #e5e7eb', 
              padding: '3rem',
              textAlign: 'center'
            }}>
              <div style={{ color: '#9ca3af', marginBottom: '1rem', fontSize: '4rem' }}>👤</div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.5rem' }}>
                No Players Yet
              </h3>
              <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
                Add your first player to start tracking games
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Add First Player
              </button>
            </div>
          ) : (
            players.map(player => (
              <div key={player.id} style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
                border: '1px solid #e5e7eb', 
                padding: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1.125rem' }}>
                      {player.name}
                    </h3>
                    <div style={{ color: '#6b7280', marginTop: '0.25rem' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        backgroundColor: '#dbeafe', 
                        color: '#1e40af', 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        fontWeight: '500',
                        marginRight: '0.5rem'
                      }}>
                        {player.position}
                      </span>
                      <span style={{ fontSize: '0.875rem' }}>{player.teamName}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                      Added {new Date(player.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                    <button
                      onClick={() => handleEditPlayer(player)}
                      style={{
                        backgroundColor: '#e5e7eb',
                        color: '#374151',
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlayer(player.id!)}
                      style={{
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '0.875rem',
                        padding: '0.25rem 0.75rem',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        {players.length > 0 && (
          <div style={{ 
            marginTop: '2rem',
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)', 
            border: '1px solid #e5e7eb', 
            padding: '1rem'
          }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '1rem' }}>
              Quick Actions
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <button
                onClick={() => navigate('/new-game')}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Start New Game
              </button>
              <button
                onClick={() => navigate('/history')}
                style={{
                  backgroundColor: '#e5e7eb',
                  color: '#374151',
                  padding: '0.75rem',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                View History
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};