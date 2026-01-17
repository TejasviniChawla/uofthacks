import React, { useEffect, useState } from 'react';
import { FilterSlider } from './components/FilterSlider';
import { ProfileSelector } from './components/ProfileSelector';
import { SessionStats } from './components/SessionStats';
import { AILearningPanel } from './components/AILearningPanel';
import { useFilters } from './hooks/useFilters';
import { useSessionStats } from './hooks/useSessionStats';
import type { UserPreferences, FilterCategory } from '@shared/types';

function App() {
  const { preferences, updateFilter, loadPreferences } = useFilters();
  const { stats, refreshStats } = useSessionStats();
  const [activeTab, setActiveTab] = useState<'filters' | 'stats' | 'learning'>('filters');
  const [isActive, setIsActive] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    loadPreferences();
    refreshStats();
    checkActiveStatus();
    
    // Refresh stats every 2 seconds
    const interval = setInterval(refreshStats, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkActiveStatus = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab.url) {
        const url = new URL(tab.url);
        setCurrentUrl(url.hostname);
        setIsActive(url.hostname.includes('twitch.tv') || url.hostname.includes('youtube.com'));
      }
    } catch (error) {
      console.error('Error checking active status:', error);
    }
  };

  if (!preferences) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sentinella-primary mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sentinella-primary to-sentinella-secondary text-white p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">SENTINELLA</h1>
          <ProfileSelector />
        </div>
        {isActive && (
          <div className="mt-2 text-sm opacity-90">
            ⚡ ACTIVE on {currentUrl}
          </div>
        )}
        {!isActive && (
          <div className="mt-2 text-sm opacity-75">
            Visit Twitch or YouTube to activate
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('filters')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'filters'
              ? 'text-sentinella-primary border-b-2 border-sentinella-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Filters
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'stats'
              ? 'text-sentinella-primary border-b-2 border-sentinella-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Stats
        </button>
        <button
          onClick={() => setActiveTab('learning')}
          className={`flex-1 py-2 text-sm font-medium ${
            activeTab === 'learning'
              ? 'text-sentinella-primary border-b-2 border-sentinella-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          AI Learning
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold mb-4">Quick Filters</h2>
            {(['profanity', 'violence', 'jumpscares', 'flashing', 'sexual'] as FilterCategory[]).map((category) => (
              <FilterSlider
                key={category}
                category={category}
                config={preferences.filters[category]}
                onChange={(level) => updateFilter(category, level)}
              />
            ))}
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="px-3 py-2 bg-blue-100 text-blue-700 rounded text-sm font-medium hover:bg-blue-200">
                  Gaming
                </button>
                <button className="px-3 py-2 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200">
                  Family
                </button>
                <button className="px-3 py-2 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200">
                  Maximum
                </button>
                <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm font-medium hover:bg-gray-200">
                  Custom
                </button>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300">
              ⚙️ Advanced Settings
            </button>
          </div>
        )}

        {activeTab === 'stats' && <SessionStats stats={stats} />}

        {activeTab === 'learning' && <AILearningPanel />}
      </div>
    </div>
  );
}

export default App;
