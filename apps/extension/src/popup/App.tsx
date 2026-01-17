import React, { useState, useEffect } from 'react';
import { FilterSlider } from './components/FilterSlider';
import { ProfileSelector } from './components/ProfileSelector';
import { SessionStats } from './components/SessionStats';
import { AILearningPanel } from './components/AILearningPanel';
import { Header } from './components/Header';
import { QuickPresets } from './components/QuickPresets';
import { getActiveProfile, getSessionStats, getLearnedPreferences } from '../lib/storage';
import type { UserProfile, SessionStats as SessionStatsType, LearnedPreference, FilterCategory } from '../types';
import { FILTER_ICONS, FILTER_LABELS } from '../lib/constants';

type Tab = 'filters' | 'stats' | 'ai';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('filters');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<SessionStatsType | null>(null);
  const [learnedPrefs, setLearnedPrefs] = useState<LearnedPreference[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [currentSite, setCurrentSite] = useState<string>('');

  useEffect(() => {
    loadData();
    checkCurrentTab();
  }, []);

  const loadData = async () => {
    const [profileData, statsData, learnedData] = await Promise.all([
      getActiveProfile(),
      getSessionStats(),
      getLearnedPreferences(),
    ]);
    setProfile(profileData);
    setStats(statsData);
    setLearnedPrefs(learnedData);
  };

  const checkCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.url) {
        const url = new URL(tab.url);
        if (url.hostname.includes('twitch.tv')) {
          setCurrentSite('twitch.tv');
          setIsActive(true);
        } else if (url.hostname.includes('youtube.com')) {
          setCurrentSite('youtube.com');
          setIsActive(true);
        } else {
          setCurrentSite(url.hostname);
          setIsActive(false);
        }
      }
    } catch (e) {
      console.error('Failed to get current tab:', e);
    }
  };

  const handleProfileChange = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  const handleFilterChange = (category: FilterCategory, level: string) => {
    if (!profile) return;
    
    const updatedFilters = profile.filters.map(f => 
      f.category === category ? { ...f, level: level as any } : f
    );
    
    setProfile({ ...profile, filters: updatedFilters });
  };

  return (
    <div className="flex flex-col min-h-[500px] bg-gradient-to-br from-dark-900 via-dark-900 to-[#0a1628]">
      <Header 
        isActive={isActive} 
        currentSite={currentSite}
        profile={profile}
        onProfileChange={handleProfileChange}
      />

      {/* Tab Navigation */}
      <div className="flex border-b border-dark-700">
        <TabButton 
          active={activeTab === 'filters'} 
          onClick={() => setActiveTab('filters')}
        >
          ⚡ Filters
        </TabButton>
        <TabButton 
          active={activeTab === 'stats'} 
          onClick={() => setActiveTab('stats')}
        >
          📊 Stats
        </TabButton>
        <TabButton 
          active={activeTab === 'ai'} 
          onClick={() => setActiveTab('ai')}
        >
          🧠 AI Learning
        </TabButton>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'filters' && profile && (
          <div className="p-4 space-y-4">
            <QuickPresets onApply={loadData} />
            
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
                Quick Filters
              </h3>
              {profile.filters.map((filter) => (
                <FilterSlider
                  key={filter.category}
                  icon={FILTER_ICONS[filter.category]}
                  label={FILTER_LABELS[filter.category]}
                  category={filter.category}
                  level={filter.level}
                  onChange={(level) => handleFilterChange(filter.category, level)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stats' && stats && (
          <SessionStats stats={stats} />
        )}

        {activeTab === 'ai' && (
          <AILearningPanel preferences={learnedPrefs} onRefresh={loadData} />
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-dark-700 bg-dark-900/50">
        <div className="flex items-center justify-between text-xs text-dark-400">
          <span>Buffer: 5s</span>
          <span className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-dark-500'}`} />
            {isActive ? 'Active' : 'Inactive'}
          </span>
          <span>Latency: ~1.2s</span>
        </div>
      </div>
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  children 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium transition-colors ${
        active 
          ? 'text-sentinel-400 border-b-2 border-sentinel-400 bg-sentinel-400/5' 
          : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50'
      }`}
    >
      {children}
    </button>
  );
}
