import React from 'react';

interface StatButtonProps {
  label: string;
  count: number;
  onIncrement: () => void;
  icon?: string;
  color?: 'green' | 'light green' | 'light red' | 'red';
  className?: string;
}

// Helper function to get icon for action
const getActionIcon = (actionName: string): string => {
  const iconMap: { [key: string]: string } = {
    'Shot on Target': '⚽',
    'Shot off Target': '🎯',
    'Successful Dribble': '🏃',
    'Unsuccessful Dribble': '❌',
    'Complete Pass': '✅',
    'Incomplete Pass': '⚠️',
    'Pass Forward': '⬆️',
    'Line-breaking Pass': '⚡',
    'Successful Tackle': '🛡️',
    'Missed Tackle': '💥',
    'Successful Interception': '✋',
    'Progressive Carry': '🚀',
    'Cross into the Box': '📢'
  };
  return iconMap[actionName] || '📊';
};

// Helper function to get color for action category
const getActionColor = (category: string): string => {
  const colorMap: { [key: string]: string } = {
    'Shooting': 'bg-green-500',
    'Passing': 'bg-yellow-500',
    'Dribbling': 'bg-gray-700',
    'Defending': 'bg-gray-700',
    'Possession': 'bg-gray-700'
  };
  return colorMap[category] || 'bg-gray-700';
};

// Helper function to get background color class based on action color
const getColorClasses = (color?: 'green' | 'light green' | 'light red' | 'red'): { bg: string; hover: string; border: string; text: string; bgHex: string; textHex: string; borderHex: string } => {
  switch (color) {
    case 'green':
      return {
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        border: 'border-green-600',
        text: 'text-white',
        bgHex: '#22c55e', // green-500
        textHex: '#ffffff',
        borderHex: '#16a34a' // green-600
      };
    case 'light green':
      return {
        bg: 'bg-green-300',
        hover: 'hover:bg-green-400',
        border: 'border-green-400',
        text: 'text-gray-900',
        bgHex: '#86efac', // green-300
        textHex: '#111827', // gray-900
        borderHex: '#4ade80' // green-400
      };
    case 'light red':
      return {
        bg: 'bg-red-300',
        hover: 'hover:bg-red-400',
        border: 'border-red-400',
        text: 'text-gray-900',
        bgHex: '#fca5a5', // red-300
        textHex: '#111827', // gray-900
        borderHex: '#f87171' // red-400
      };
    case 'red':
      return {
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        border: 'border-red-600',
        text: 'text-white',
        bgHex: '#ef4444', // red-500
        textHex: '#ffffff',
        borderHex: '#dc2626' // red-600
      };
    default:
      return {
        bg: 'bg-blue-200',
        hover: 'hover:bg-blue-300',
        border: 'border-blue-400',
        text: 'text-gray-800',
        bgHex: '#bfdbfe', // blue-200
        textHex: '#1f2937', // gray-800
        borderHex: '#60a5fa' // blue-400
      };
  }
};

export const StatButton: React.FC<StatButtonProps> = ({ 
  label, 
  count, 
  onIncrement, 
  icon,
  color,
  className = '' 
}) => {
  // Use provided color or fallback to light green
  const finalColor = color || 'light green';
  const colorClasses = getColorClasses(finalColor);
  
  return (
    <button
      onClick={onIncrement}
      className={`
        ${colorClasses.bg} ${colorClasses.hover} rounded-xl p-3 sm:p-6 text-center
        hover:shadow-lg transition-all
        active:scale-95
        w-full min-h-[100px] sm:min-h-[120px] flex flex-col items-center justify-center
        ${colorClasses.text} font-semibold 
        border-2 ${colorClasses.border} shadow-md
        ${className}
      `}
      style={{
        backgroundColor: colorClasses.bgHex,
        color: colorClasses.textHex,
        borderColor: colorClasses.borderHex,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}
    >
      <div 
        className={`text-sm sm:text-base font-semibold text-center leading-snug px-1 break-words`}
        style={{ color: colorClasses.textHex }}
      >
        {label}
      </div>
    </button>
  );
};