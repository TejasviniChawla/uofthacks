import React from 'react';
import { ProfileSelector } from './ProfileSelector';
import type { UserProfile } from '../../types';

interface HeaderProps {
  isActive: boolean;
  currentSite: string;
  profile: UserProfile | null;
  onProfileChange: (profile: UserProfile) => void;
}

export function Header({ isActive, currentSite, profile, onProfileChange }: HeaderProps) {
  return (
    <div className="p-4 bg-gradient-to-r from-dark-800 to-dark-800/50 border-b border-dark-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-sentinel-500 to-sentinel-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">SENTINELLA</h1>
          </div>
        </div>
        <ProfileSelector 
          currentProfile={profile} 
          onChange={onProfileChange}
        />
      </div>
      
      <div className="flex items-center gap-2 text-sm">
        <span className={`w-2 h-2 rounded-full animate-pulse ${
          isActive ? 'bg-sentinel-500' : 'bg-dark-500'
        }`} />
        <span className="text-dark-300">
          {isActive ? (
            <>
              <span className="text-sentinel-400 font-medium">ACTIVE</span>
              {' on '}
              <span className="text-white">{currentSite}</span>
            </>
          ) : (
            <span className="text-dark-400">Not on a supported streaming site</span>
          )}
        </span>
      </div>
    </div>
  );
}

