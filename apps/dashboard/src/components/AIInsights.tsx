'use client';

import { Brain, Lightbulb, TrendingUp } from 'lucide-react';

interface Insight {
  type: string;
  title: string;
  description: string;
  icon: string;
}

interface AIInsightsProps {
  insights: Insight[];
}

export function AIInsights({ insights }: AIInsightsProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">AI Insights</h3>
          <p className="text-sm text-dark-400">What Sentinella has learned about your stream</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {insights.map((insight, index) => (
          <div
            key={index}
            className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/10 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-colors"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{insight.icon}</span>
              <div>
                <h4 className="font-medium text-white mb-1">{insight.title}</h4>
                <p className="text-sm text-dark-300 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-dark-800/30 rounded-xl border border-dark-700">
        <div className="flex items-center gap-2 text-sm text-dark-400">
          <TrendingUp className="w-4 h-4 text-sentinel-400" />
          <span>
            <span className="text-white font-medium">Pro tip:</span> Your tension levels are lowest during chatting segments. 
            Consider taking breaks to reset!
          </span>
        </div>
      </div>
    </div>
  );
}

