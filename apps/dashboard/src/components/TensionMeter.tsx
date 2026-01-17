'use client';

import { Activity } from 'lucide-react';

interface TensionMeterProps {
  level: number; // 0-1
}

export function TensionMeter({ level }: TensionMeterProps) {
  const percentage = Math.round(level * 100);
  
  const getStatus = () => {
    if (level < 0.3) return { label: 'Calm', color: 'text-green-400', bg: 'bg-green-400' };
    if (level < 0.5) return { label: 'Normal', color: 'text-lime-400', bg: 'bg-lime-400' };
    if (level < 0.7) return { label: 'Elevated', color: 'text-yellow-400', bg: 'bg-yellow-400' };
    if (level < 0.85) return { label: 'High', color: 'text-orange-400', bg: 'bg-orange-400' };
    return { label: 'Critical', color: 'text-red-400', bg: 'bg-red-400' };
  };

  const status = getStatus();

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">
          Tension Meter
        </h3>
        <Activity className={`w-4 h-4 ${status.color}`} />
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="text-4xl font-bold text-white">{percentage}%</div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${status.color} bg-opacity-10`} style={{ backgroundColor: `${status.color}20` }}>
          {status.label}
        </div>
      </div>

      {/* Meter Bar */}
      <div className="relative h-3 rounded-full bg-dark-700 overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 tension-gradient rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg transition-all duration-500"
          style={{ left: `calc(${percentage}% - 6px)` }}
        />
      </div>

      <p className="mt-4 text-xs text-dark-400">
        {level > 0.6 
          ? '⚡ Profanity filter sensitivity increased automatically'
          : '✓ Normal filtering levels active'}
      </p>
    </div>
  );
}

