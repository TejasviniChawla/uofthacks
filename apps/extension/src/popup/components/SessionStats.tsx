import React from 'react';
import type { SessionStats as SessionStatsType, FilterCategory } from '../../types';
import { FILTER_ICONS, FILTER_LABELS } from '../../lib/constants';

interface SessionStatsProps {
  stats: SessionStatsType;
}

export function SessionStats({ stats }: SessionStatsProps) {
  const sessionDuration = Date.now() - stats.sessionStartTime;
  const minutes = Math.floor(sessionDuration / 60000);
  const hours = Math.floor(minutes / 60);

  const formatDuration = () => {
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const sortedCategories = Object.entries(stats.filteredByCategory)
    .filter(([_, count]) => count > 0)
    .sort(([_, a], [__, b]) => b - a);

  return (
    <div className="p-4 space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Filtered"
          value={stats.totalFiltered}
          icon="🛡️"
          color="sentinel"
        />
        <StatCard
          label="Revealed"
          value={stats.totalRevealed}
          icon="👁️"
          color="blue"
        />
        <StatCard
          label="Session"
          value={formatDuration()}
          icon="⏱️"
          color="purple"
        />
        <StatCard
          label="AI Adjustments"
          value={stats.aiAdjustments}
          icon="🧠"
          color="amber"
        />
      </div>

      {/* Category Breakdown */}
      {sortedCategories.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
            Filtered by Category
          </h3>
          <div className="bg-dark-800/50 rounded-lg border border-dark-700 overflow-hidden">
            {sortedCategories.map(([category, count]) => (
              <CategoryRow
                key={category}
                category={category as FilterCategory}
                count={count}
                total={stats.totalFiltered}
              />
            ))}
          </div>
        </div>
      )}

      {sortedCategories.length === 0 && (
        <div className="text-center py-8 text-dark-400">
          <span className="text-4xl mb-2 block">🎬</span>
          <p className="text-sm">No content filtered yet this session</p>
          <p className="text-xs mt-1">Start watching a stream to see stats</p>
        </div>
      )}

      {/* Effectiveness */}
      {stats.totalFiltered > 0 && (
        <div className="bg-gradient-to-r from-sentinel-900/30 to-sentinel-800/20 rounded-lg p-4 border border-sentinel-700/30">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sentinel-400">✨</span>
            <span className="text-sm font-medium text-sentinel-300">Protection Summary</span>
          </div>
          <p className="text-xs text-dark-300">
            Sentinella has filtered <span className="text-white font-medium">{stats.totalFiltered}</span> items 
            and you chose to reveal <span className="text-white font-medium">{stats.totalRevealed}</span> of them 
            ({stats.totalFiltered > 0 ? Math.round((stats.totalRevealed / stats.totalFiltered) * 100) : 0}% override rate).
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color 
}: { 
  label: string; 
  value: number | string; 
  icon: string; 
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    sentinel: 'from-sentinel-900/50 to-sentinel-800/30 border-sentinel-700/50',
    blue: 'from-blue-900/50 to-blue-800/30 border-blue-700/50',
    purple: 'from-purple-900/50 to-purple-800/30 border-purple-700/50',
    amber: 'from-amber-900/50 to-amber-800/30 border-amber-700/50',
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-lg p-3 border`}>
      <div className="flex items-center gap-2 mb-1">
        <span>{icon}</span>
        <span className="text-xs text-dark-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function CategoryRow({ 
  category, 
  count, 
  total 
}: { 
  category: FilterCategory; 
  count: number; 
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="px-3 py-2 flex items-center justify-between border-b border-dark-700 last:border-0">
      <div className="flex items-center gap-2">
        <span>{FILTER_ICONS[category]}</span>
        <span className="text-sm text-dark-200">{FILTER_LABELS[category]}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-1.5 bg-dark-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-sentinel-500 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm font-medium text-dark-300 w-8 text-right">{count}</span>
      </div>
    </div>
  );
}
