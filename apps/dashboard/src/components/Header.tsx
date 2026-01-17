'use client';

import { Bell, Search, Zap } from 'lucide-react';

interface HeaderProps {
  isLive: boolean;
}

export function Header({ isLive }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Search */}
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            placeholder="Search detections, settings..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800/50 border border-dark-700 rounded-xl text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-sentinel-500/50 focus:ring-1 focus:ring-sentinel-500/20 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 bg-dark-700 rounded text-[10px] text-dark-400 font-mono">
            ⌘K
          </kbd>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Live Status */}
          {isLive && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium text-red-400">LIVE</span>
              <span className="text-xs text-red-400/60">• 2:34:12</span>
            </div>
          )}

          {/* Quick Actions */}
          <button className="flex items-center gap-2 px-4 py-2 bg-sentinel-500 hover:bg-sentinel-600 text-white rounded-xl font-medium text-sm transition-colors">
            <Zap className="w-4 h-4" />
            Quick Scan
          </button>

          {/* Notifications */}
          <button className="relative p-2.5 bg-dark-800/50 hover:bg-dark-700 rounded-xl border border-dark-700 transition-colors">
            <Bell className="w-5 h-5 text-dark-400" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-sentinel-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}

