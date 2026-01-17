import React from 'react';
import type { FilterCategory, FilterLevel } from '../../types';

interface FilterSliderProps {
  icon: string;
  label: string;
  category: FilterCategory;
  level: FilterLevel;
  onChange: (level: FilterLevel) => void;
}

const LEVELS: FilterLevel[] = ['off', 'low', 'medium', 'high', 'maximum'];

const LEVEL_COLORS: Record<FilterLevel, string> = {
  off: 'bg-dark-600',
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  maximum: 'bg-red-500',
};

export function FilterSlider({ icon, label, category, level, onChange }: FilterSliderProps) {
  const levelIndex = LEVELS.indexOf(level);
  const progress = (levelIndex / (LEVELS.length - 1)) * 100;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    onChange(LEVELS[newIndex]);
  };

  return (
    <div className="bg-dark-800/50 rounded-lg p-3 border border-dark-700 hover:border-dark-600 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-medium text-sm text-dark-200">{label}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
          level === 'off' 
            ? 'bg-dark-700 text-dark-400' 
            : `${LEVEL_COLORS[level]} text-white`
        }`}>
          {level.toUpperCase()}
        </span>
      </div>
      
      <div className="relative">
        <div className="h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-200 ${LEVEL_COLORS[level]}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={LEVELS.length - 1}
          value={levelIndex}
          onChange={handleSliderChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {/* Level markers */}
        <div className="flex justify-between mt-1">
          {LEVELS.map((l, i) => (
            <div 
              key={l}
              className={`w-1 h-1 rounded-full transition-colors ${
                i <= levelIndex ? LEVEL_COLORS[level] : 'bg-dark-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
