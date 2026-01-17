import React from 'react';
import type { SessionStats } from '@shared/types';

interface SessionStatsProps {
  stats: SessionStats;
}

export function SessionStats({ stats }: SessionStatsProps) {
  const sessionDuration = Math.floor((Date.now() - stats.sessionStart) / 1000 / 60);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">📊 This Session</h2>
      
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <div className="text-2xl font-bold text-sentinella-primary mb-2">
          {stats.itemsFiltered}
        </div>
        <div className="text-sm text-gray-600">Items filtered</div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">By Category</h3>
        {Object.entries(stats.itemsByCategory).map(([category, count]) => (
          <div key={category} className="flex justify-between items-center text-sm">
            <span className="capitalize">{category}</span>
            <span className="font-semibold">{count}</span>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-4">
        <div className="text-lg font-semibold text-blue-700 mb-1">
          {stats.itemsRevealed}
        </div>
        <div className="text-sm text-blue-600">Items you revealed</div>
      </div>

      <div className="text-xs text-gray-500 text-center">
        Session duration: {sessionDuration} minutes
      </div>
    </div>
  );
}
