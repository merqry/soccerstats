import React, { useState } from 'react';
import type { Player } from '../types';

interface PlayerFormProps {
  player?: Player;
  onSubmit: (player: Omit<Player, 'id'>) => void;
  onCancel: () => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({ 
  player, 
  onSubmit, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: player?.name || '',
    position: player?.position || '',
    teamName: player?.teamName || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.position.trim() && formData.teamName.trim()) {
      onSubmit({
        ...formData,
        createdAt: player?.createdAt || new Date()
      });
    }
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

  return (
    <div className="card max-w-md mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {player ? 'Edit Player' : 'Add New Player'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Player Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter player name"
            required
          />
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
            Position
          </label>
          <select
            id="position"
            name="position"
            value={formData.position}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 mb-1">
            Team Name
          </label>
          <input
            type="text"
            id="teamName"
            name="teamName"
            value={formData.teamName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter team name"
            required
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="btn-primary flex-1"
          >
            {player ? 'Update Player' : 'Add Player'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};