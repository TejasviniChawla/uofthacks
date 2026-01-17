'use client';

import { useEffect, useState } from 'react';
import { StreamStatus } from '@/components/StreamStatus';
import { PIIDetectionLog } from '@/components/PIIDetectionLog';
import { TensionMeter } from '@/components/TensionMeter';
import { WhitelistManager } from '@/components/WhitelistManager';
import { AIInsights } from '@/components/AIInsights';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const [streamActive, setStreamActive] = useState(false);
  const [piiDetections, setPiiDetections] = useState<any[]>([]);
  const [tensionLevel, setTensionLevel] = useState(0);
  const [itemsBlocked, setItemsBlocked] = useState(0);

  useEffect(() => {
    // Connect to backend WebSocket
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('Connected to backend');
      socket.emit('join-stream', { streamId: 'demo-stream', platform: 'twitch' });
    });

    socket.on('pii_detected', (data: any) => {
      setPiiDetections(prev => [data, ...prev].slice(0, 10));
      setItemsBlocked(prev => prev + 1);
    });

    socket.on('emotional_state', (data: any) => {
      setTensionLevel(data.tensionLevel || 0);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-sentinella-primary to-sentinella-secondary text-white p-6">
        <h1 className="text-3xl font-bold">SENTINELLA STREAMER DASHBOARD</h1>
        <p className="mt-2 opacity-90">Pre-Cognitive Content Safety Platform</p>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StreamStatus isActive={streamActive} itemsBlocked={itemsBlocked} />
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">PII PROTECTION</h3>
            <div className="text-2xl font-bold text-green-600 mb-1">✅ Active</div>
            <div className="text-sm text-gray-600">{itemsBlocked} items blocked</div>
            <div className="text-sm text-gray-600">0 leaks</div>
          </div>
          <TensionMeter tensionLevel={tensionLevel} />
        </div>

        {/* Recent Detections */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">RECENT DETECTIONS</h2>
          </div>
          <PIIDetectionLog detections={piiDetections} />
        </div>

        {/* Whitelist and AI Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <WhitelistManager />
          <AIInsights tensionLevel={tensionLevel} />
        </div>
      </div>
    </div>
  );
}
