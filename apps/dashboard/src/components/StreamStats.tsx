'use client';

import { Shield, Eye, AlertTriangle } from 'lucide-react';

interface StreamStatsProps {
  totalDetections: number;
  totalBlocked: number;
}

export function StreamStats({ totalDetections, totalBlocked }: StreamStatsProps) {
  const nearMisses = totalDetections - totalBlocked;

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-4">
        PII Protection
      </h3>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-sentinel-500/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sentinel-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalBlocked}</div>
          <div className="text-xs text-dark-400">Blocked</div>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Eye className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalDetections}</div>
          <div className="text-xs text-dark-400">Detected</div>
        </div>

        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
          <div className="text-xs text-dark-400">Leaks</div>
        </div>
      </div>
    </div>
  );
}

