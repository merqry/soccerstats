import React from 'react';

interface StatButtonProps {
  label: string;
  count: number;
  onIncrement: () => void;
  className?: string;
}

export const StatButton: React.FC<StatButtonProps> = ({ 
  label, 
  count, 
  onIncrement, 
  className = '' 
}) => {
  return (
    <button
      onClick={onIncrement}
      className={`
        bg-white border-2 border-primary-200 rounded-lg p-4 text-center
        hover:border-primary-400 hover:bg-primary-50 transition-all
        active:scale-95 active:bg-primary-100
        ${className}
      `}
    >
      <div className="text-lg font-semibold text-primary-800 mb-1">
        {count}
      </div>
      <div className="text-sm text-gray-600 font-medium">
        {label}
      </div>
    </button>
  );
};