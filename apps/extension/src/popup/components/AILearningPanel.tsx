import React, { useState } from 'react';
import type { LearnedPreference, FilterCategory } from '../../types';
import { FILTER_ICONS, FILTER_LABELS } from '../../lib/constants';

interface AILearningPanelProps {
  preferences: LearnedPreference[];
  onRefresh: () => void;
}

export function AILearningPanel({ preferences, onRefresh }: AILearningPanelProps) {
  const [pendingAdjustment, setPendingAdjustment] = useState<{
    category: FilterCategory;
    subcategory?: string;
    description: string;
  } | null>(null);

  // Demo adjustment for showcase
  const demoAdjustment = {
    category: 'profanity' as FilterCategory,
    subcategory: 'mild',
    description: 'Based on your overrides, I reduced mild profanity filtering. You seem okay with "damn" and "hell".',
  };

  const handleAccept = () => {
    setPendingAdjustment(null);
    onRefresh();
  };

  const handleReject = () => {
    setPendingAdjustment(null);
  };

  return (
    <div className="p-4 space-y-4">
      {/* AI Status Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
          <span className="text-lg">🧠</span>
        </div>
        <div>
          <h2 className="font-semibold text-white">AI Learning Status</h2>
          <p className="text-xs text-dark-400">Personalizing your experience</p>
        </div>
      </div>

      {/* Pending Adjustment */}
      {(pendingAdjustment || true) && (
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/20 rounded-lg p-4 border border-purple-700/30 animate-slide-in">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-sm text-dark-200 leading-relaxed">
                {demoAdjustment.description}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAccept}
              className="flex-1 py-2 px-3 bg-sentinel-600 hover:bg-sentinel-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              ✓ That's right
            </button>
            <button
              onClick={handleReject}
              className="flex-1 py-2 px-3 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
            >
              No, keep filtering
            </button>
          </div>
        </div>
      )}

      {/* Learned Preferences */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
          What I've Learned
        </h3>
        
        <div className="bg-dark-800/50 rounded-lg border border-dark-700 divide-y divide-dark-700">
          <LearningItem
            icon={FILTER_ICONS.violence}
            label="Cartoon violence"
            status="adjusted"
            confidence={92}
            description="Reduced (92% confident)"
          />
          <LearningItem
            icon={FILTER_ICONS.profanity}
            label="Mild profanity"
            status="adjusted"
            confidence={87}
            description="Disabled (87% confident)"
          />
          <LearningItem
            icon={FILTER_ICONS.jumpscares}
            label="Jumpscares"
            status="learning"
            confidence={45}
            description="Still learning..."
          />
          <LearningItem
            icon={FILTER_ICONS.violence}
            label="Gore"
            status="stable"
            confidence={100}
            description="Maximum (never overridden)"
          />
        </div>
      </div>

      {/* Learning Insights */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-dark-400 uppercase tracking-wider">
          Insights
        </h3>
        <div className="bg-dark-800/30 rounded-lg p-3 border border-dark-700/50">
          <p className="text-xs text-dark-300 leading-relaxed">
            <span className="text-purple-400 font-medium">📊 Pattern detected:</span> You tend to override 
            cartoon violence filters during gaming streams but keep them active for other content.
          </p>
        </div>
        <div className="bg-dark-800/30 rounded-lg p-3 border border-dark-700/50">
          <p className="text-xs text-dark-300 leading-relaxed">
            <span className="text-blue-400 font-medium">🎯 Recommendation:</span> Consider enabling 
            context-aware filtering that adjusts based on stream category.
          </p>
        </div>
      </div>

      {/* Reset Button */}
      <button 
        onClick={onRefresh}
        className="w-full py-2 px-3 bg-dark-800 hover:bg-dark-700 text-dark-300 text-sm rounded-lg border border-dark-600 transition-colors"
      >
        ↻ Reset All Learning
      </button>
    </div>
  );
}

function LearningItem({
  icon,
  label,
  status,
  confidence,
  description,
}: {
  icon: string;
  label: string;
  status: 'learning' | 'adjusted' | 'stable';
  confidence: number;
  description: string;
}) {
  const statusIcons = {
    learning: '🔄',
    adjusted: '✅',
    stable: '⚠️',
  };

  const statusColors = {
    learning: 'text-blue-400',
    adjusted: 'text-sentinel-400',
    stable: 'text-amber-400',
  };

  return (
    <div className="px-3 py-2.5 flex items-center gap-3">
      <span className="text-lg">{statusIcons[status]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span>{icon}</span>
          <span className="text-sm font-medium text-dark-200 truncate">{label}</span>
        </div>
        <p className={`text-xs ${statusColors[status]}`}>{description}</p>
      </div>
      {status !== 'stable' && (
        <div className="text-right">
          <div className="w-12 h-1 bg-dark-600 rounded-full overflow-hidden">
            <div 
              className={`h-full ${status === 'adjusted' ? 'bg-sentinel-500' : 'bg-blue-500'}`}
              style={{ width: `${confidence}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
