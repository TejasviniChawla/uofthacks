'use client';

import { useState } from 'react';
import { Filter, Download, ChevronDown } from 'lucide-react';

interface Detection {
  id: string;
  type: string;
  confidence: number;
  timestamp: number;
  autoBlurred: boolean;
  whitelisted?: boolean;
}

interface PIIDetectionLogProps {
  detections: Detection[];
}

export function PIIDetectionLog({ detections }: PIIDetectionLogProps) {
  const [filter, setFilter] = useState<'all' | 'blocked' | 'allowed'>('all');

  const filtered = detections.filter(d => {
    if (filter === 'blocked') return d.autoBlurred;
    if (filter === 'allowed') return !d.autoBlurred || d.whitelisted;
    return true;
  });

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-dark-700">
        <h3 className="text-lg font-semibold text-white">Detection Log</h3>
        
        <div className="flex items-center gap-3">
          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="appearance-none pl-3 pr-8 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-sentinel-500"
            >
              <option value="all">All Detections</option>
              <option value="blocked">Blocked Only</option>
              <option value="allowed">Allowed Only</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400 pointer-events-none" />
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 px-3 py-2 bg-dark-800 hover:bg-dark-700 border border-dark-600 rounded-lg text-sm text-dark-300 transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-dark-700">
              <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Time</th>
              <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Type</th>
              <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Confidence</th>
              <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Action</th>
              <th className="text-left text-xs font-semibold text-dark-400 uppercase tracking-wider px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-700/50">
            {filtered.map((detection) => (
              <tr key={detection.id} className="hover:bg-dark-800/50 transition-colors">
                <td className="px-6 py-4 text-sm text-dark-300 font-mono">
                  {formatTime(detection.timestamp)}
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-2 px-2.5 py-1 bg-dark-800 rounded-lg text-sm text-white capitalize">
                    {detection.type.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          detection.confidence > 0.9 ? 'bg-sentinel-500' :
                          detection.confidence > 0.7 ? 'bg-lime-500' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${detection.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-dark-400">{Math.round(detection.confidence * 100)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-dark-300">
                  {detection.autoBlurred ? 'Auto-blurred' : detection.whitelisted ? 'Whitelisted' : 'Manual'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    detection.autoBlurred 
                      ? 'bg-sentinel-500/10 text-sentinel-400'
                      : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {detection.autoBlurred ? '✓ Blocked' : '○ Allowed'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-dark-400">
            No detections found
          </div>
        )}
      </div>
    </div>
  );
}

