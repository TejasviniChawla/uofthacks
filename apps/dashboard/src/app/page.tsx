'use client';

import { useState, useEffect } from 'react';
import { StreamStatus } from '@/components/StreamStatus';
import { PIIDetectionLog } from '@/components/PIIDetectionLog';
import { TensionMeter } from '@/components/TensionMeter';
import { WhitelistManager } from '@/components/WhitelistManager';
import { AIInsights } from '@/components/AIInsights';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { RecentDetections } from '@/components/RecentDetections';
import { StreamStats } from '@/components/StreamStats';

// Mock data for demo
const mockDetections = [
  { id: '1', type: 'credit_card', confidence: 0.94, timestamp: Date.now() - 120000, autoBlurred: true },
  { id: '2', type: 'email', confidence: 0.87, timestamp: Date.now() - 300000, autoBlurred: false, whitelisted: true, value: 'business@email.com' },
  { id: '3', type: 'address', confidence: 0.82, timestamp: Date.now() - 480000, autoBlurred: true },
];

const mockWhitelist = [
  { id: '1', type: 'email', description: 'business@mystream.com' },
  { id: '2', type: 'address', description: 'P.O. Box 1234, City' },
];

const mockInsights = [
  {
    type: 'pattern',
    title: 'Tension Pattern Detected',
    description: 'Your tension levels spike during boss fights. I automatically increase profanity filtering during these moments.',
    icon: '📊',
  },
  {
    type: 'learned',
    title: 'Whitelist Learned',
    description: "You've whitelisted your business email 3 times. I've learned to always allow it.",
    icon: '🧠',
  },
];

export default function Dashboard() {
  const [isLive, setIsLive] = useState(true);
  const [tensionLevel, setTensionLevel] = useState(0.42);
  const [detections, setDetections] = useState(mockDetections);
  const [whitelist, setWhitelist] = useState(mockWhitelist);

  // Simulate tension level changes
  useEffect(() => {
    const interval = setInterval(() => {
      setTensionLevel(prev => {
        const change = (Math.random() - 0.5) * 0.1;
        return Math.max(0, Math.min(1, prev + change));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleAddToWhitelist = (item: { type: string; description: string }) => {
    setWhitelist(prev => [...prev, { id: Date.now().toString(), ...item }]);
  };

  const handleRemoveFromWhitelist = (id: string) => {
    setWhitelist(prev => prev.filter(w => w.id !== id));
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      
      <main className="flex-1 ml-64">
        <Header isLive={isLive} />
        
        <div className="p-6 space-y-6">
          {/* Top Stats Row */}
          <div className="grid grid-cols-3 gap-6">
            <StreamStatus 
              isLive={isLive} 
              onToggle={() => setIsLive(!isLive)} 
            />
            <StreamStats 
              totalDetections={detections.length}
              totalBlocked={detections.filter(d => d.autoBlurred).length}
            />
            <TensionMeter level={tensionLevel} />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-12 gap-6">
            {/* Recent Detections - Main Area */}
            <div className="col-span-8">
              <RecentDetections detections={detections} />
            </div>

            {/* Whitelist - Sidebar */}
            <div className="col-span-4">
              <WhitelistManager 
                items={whitelist}
                onAdd={handleAddToWhitelist}
                onRemove={handleRemoveFromWhitelist}
              />
            </div>
          </div>

          {/* AI Insights */}
          <AIInsights insights={mockInsights} />

          {/* Detection Log */}
          <PIIDetectionLog detections={detections} />
        </div>
      </main>
    </div>
  );
}

