import React from 'react';
import { getActiveProfile, saveProfiles, getProfiles } from '../../lib/storage';
import { PRESET_CONFIGS, DEFAULT_FILTER_CONFIGS } from '../../lib/constants';
import type { FilterLevel } from '../../types';

interface QuickPresetsProps {
  onApply: () => void;
}

export function QuickPresets({ onApply }: QuickPresetsProps) {
  const applyPreset = async (presetKey: keyof typeof PRESET_CONFIGS) => {
    const preset = PRESET_CONFIGS[presetKey];
    const profiles = await getProfiles();
    const activeProfile = await getActiveProfile();
    
    const profileIndex = profiles.findIndex(p => p.id === activeProfile.id);
    if (profileIndex === -1) return;

    // Update filters based on preset
    profiles[profileIndex].filters = DEFAULT_FILTER_CONFIGS.map(filter => ({
      ...filter,
      level: (preset.filters[filter.category] || 'off') as FilterLevel,
    }));

    await saveProfiles(profiles);
    onApply();
  };

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
        Quick Presets
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {Object.entries(PRESET_CONFIGS).map(([key, preset]) => (
          <PresetButton
            key={key}
            name={preset.name}
            description={preset.description}
            onClick={() => applyPreset(key as keyof typeof PRESET_CONFIGS)}
            variant={key as string}
          />
        ))}
      </div>
    </div>
  );
}

function PresetButton({
  name,
  description,
  onClick,
  variant,
}: {
  name: string;
  description: string;
  onClick: () => void;
  variant: string;
}) {
  const variantStyles: Record<string, string> = {
    gaming: 'from-blue-600/20 to-blue-700/10 border-blue-600/30 hover:border-blue-500/50',
    family: 'from-green-600/20 to-green-700/10 border-green-600/30 hover:border-green-500/50',
    maximum: 'from-red-600/20 to-red-700/10 border-red-600/30 hover:border-red-500/50',
    minimal: 'from-gray-600/20 to-gray-700/10 border-gray-600/30 hover:border-gray-500/50',
  };

  const icons: Record<string, string> = {
    gaming: '🎮',
    family: '👨‍👩‍👧‍👦',
    maximum: '🛡️',
    minimal: '👁️',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center py-2 px-1 bg-gradient-to-b ${variantStyles[variant]} rounded-lg border transition-all hover:scale-[1.02] active:scale-[0.98]`}
      title={description}
    >
      <span className="text-lg mb-0.5">{icons[variant]}</span>
      <span className="text-[10px] font-medium text-dark-200 leading-tight">{name}</span>
    </button>
  );
}

