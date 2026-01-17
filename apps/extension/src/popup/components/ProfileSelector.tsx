import React, { useState, useEffect } from 'react';
import { getProfiles, setActiveProfile } from '../../lib/storage';
import type { UserProfile } from '../../types';

interface ProfileSelectorProps {
  currentProfile: UserProfile | null;
  onChange: (profile: UserProfile) => void;
}

export function ProfileSelector({ currentProfile, onChange }: ProfileSelectorProps) {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    const loadedProfiles = await getProfiles();
    setProfiles(loadedProfiles);
  };

  const handleSelect = async (profile: UserProfile) => {
    await setActiveProfile(profile.id);
    onChange(profile);
    setIsOpen(false);
  };

  if (!currentProfile) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-dark-700/50 rounded-lg border border-dark-600 hover:border-dark-500 transition-colors text-sm"
      >
        <span className="text-dark-300">{currentProfile.name}</span>
        <svg 
          className={`w-4 h-4 text-dark-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-dark-800 rounded-lg border border-dark-600 shadow-xl z-50 overflow-hidden animate-slide-in">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleSelect(profile)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-dark-700 transition-colors ${
                profile.id === currentProfile.id ? 'bg-sentinel-500/10 text-sentinel-400' : 'text-dark-200'
              }`}
            >
              <span>{profile.name}</span>
              {profile.isDefault && (
                <span className="text-xs text-dark-500">Default</span>
              )}
              {profile.isLocked && (
                <span className="text-xs">🔒</span>
              )}
            </button>
          ))}
          
          <div className="border-t border-dark-700">
            <button 
              className="w-full px-3 py-2 text-left text-sm text-dark-400 hover:text-dark-200 hover:bg-dark-700 transition-colors"
              onClick={() => {/* TODO: Open profile manager */}}
            >
              + Create Profile
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
