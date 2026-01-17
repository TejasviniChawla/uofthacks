'use client';

import { Power, Shield, Activity } from 'lucide-react';

interface StreamStatusProps {
  isLive: boolean;
  onToggle: () => void;
}

export function StreamStatus({ isLive, onToggle }: StreamStatusProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider">
          Stream Status
        </h3>
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg transition-colors ${
            isLive 
              ? 'bg-sentinel-500/10 text-sentinel-400 hover:bg-sentinel-500/20' 
              : 'bg-dark-700 text-dark-400 hover:bg-dark-600'
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center ${
          isLive 
            ? 'bg-gradient-to-br from-sentinel-500 to-sentinel-600' 
            : 'bg-dark-700'
        }`}>
          <Shield className={`w-8 h-8 ${isLive ? 'text-white' : 'text-dark-500'}`} />
          {isLive && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-sentinel-400 rounded-full animate-pulse" />
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${isLive ? 'text-sentinel-400' : 'text-dark-400'}`}>
              {isLive ? 'PROTECTED' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-sm text-dark-400 mt-1">
            {isLive ? 'All filters active' : 'Start streaming to activate'}
          </p>
        </div>
      </div>

      {isLive && (
        <div className="mt-4 pt-4 border-t border-dark-700 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-sentinel-400" />
            <span className="text-sm text-dark-300">Latency: <span className="text-white font-medium">~1.2s</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sentinel-500 animate-pulse" />
            <span className="text-sm text-dark-300">Buffer: <span className="text-white font-medium">5s</span></span>
          </div>
        </div>
      )}
    </div>
  );
}

