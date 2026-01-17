'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  Settings, 
  FileText, 
  HelpCircle,
  ChevronRight
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/', active: true },
  { icon: Shield, label: 'Protection', href: '/protection' },
  { icon: FileText, label: 'Reports', href: '/reports' },
  { icon: Settings, label: 'Settings', href: '/settings' },
  { icon: HelpCircle, label: 'Help', href: '/help' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-700 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-dark-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-sentinel-500 to-sentinel-600 rounded-xl flex items-center justify-center shadow-lg shadow-sentinel-500/20">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">SENTINELLA</h1>
            <p className="text-xs text-dark-400">Streamer Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
              item.active
                ? 'bg-sentinel-500/10 text-sentinel-400 border border-sentinel-500/20'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            }`}
          >
            <item.icon className={`w-5 h-5 ${item.active ? 'text-sentinel-400' : ''}`} />
            <span className="font-medium">{item.label}</span>
            {item.active && (
              <ChevronRight className="w-4 h-4 ml-auto" />
            )}
          </a>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-dark-700">
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-dark-800/50">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white font-medium text-sm">JS</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">Jordan Smith</p>
            <p className="text-xs text-dark-400">Pro Streamer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

