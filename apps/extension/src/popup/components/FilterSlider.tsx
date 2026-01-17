import React from 'react';
import type { FilterConfig, FilterCategory, FilterLevel } from '@shared/types';

interface FilterSliderProps {
  category: FilterCategory;
  config: FilterConfig;
  onChange: (level: FilterLevel) => void;
}

const categoryIcons: Record<FilterCategory, string> = {
  profanity: '🔇',
  violence: '🩸',
  sexual: '🔞',
  jumpscares: '⚡',
  flashing: '💥',
  spoilers: '🚫',
  loud_audio: '🔊',
  hate_speech: '🚨'
};

const categoryLabels: Record<FilterCategory, string> = {
  profanity: 'Profanity',
  violence: 'Violence',
  sexual: 'Sexual Content',
  jumpscares: 'Jumpscares',
  flashing: 'Flashing Lights',
  spoilers: 'Spoilers',
  loud_audio: 'Loud Audio',
  hate_speech: 'Hate Speech'
};

const levels: FilterLevel[] = ['OFF', 'LOW', 'MEDIUM', 'HIGH', 'MAXIMUM'];
const levelValues: Record<FilterLevel, number> = {
  OFF: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  MAXIMUM: 4
};

export function FilterSlider({ category, config, onChange }: FilterSliderProps) {
  const currentValue = levelValues[config.level];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    const level = levels[value] as FilterLevel;
    onChange(level);
  };

  const getProgressWidth = () => {
    return `${(currentValue / 4) * 100}%`;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{categoryIcons[category]}</span>
          <span className="font-medium text-sm">{categoryLabels[category]}</span>
        </div>
        <span className="text-xs font-semibold text-gray-600">{config.level}</span>
      </div>
      
      <div className="relative">
        <input
          type="range"
          min="0"
          max="4"
          value={currentValue}
          onChange={handleSliderChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${getProgressWidth()}, #e5e7eb ${getProgressWidth()}, #e5e7eb 100%)`
          }}
        />
        <div className="flex justify-between mt-1">
          {levels.map((level) => (
            <span
              key={level}
              className={`text-xs ${
                levelValues[level] <= currentValue
                  ? 'text-sentinella-primary font-semibold'
                  : 'text-gray-400'
              }`}
            >
              {level}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
