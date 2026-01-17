import React, { useState } from 'react';

export function ProfileSelector() {
  const [currentProfile, setCurrentProfile] = useState('Default');
  const [isOpen, setIsOpen] = useState(false);

  const profiles = ['Default', 'Family Mode', 'Gaming', 'Maximum Safety'];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-sm font-medium hover:opacity-80 flex items-center gap-1"
      >
        {currentProfile}
        <span className="text-xs">▼</span>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
          {profiles.map((profile) => (
            <button
              key={profile}
              onClick={() => {
                setCurrentProfile(profile);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg ${
                profile === currentProfile ? 'bg-sentinella-primary bg-opacity-10 text-sentinella-primary' : ''
              }`}
            >
              {profile}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
