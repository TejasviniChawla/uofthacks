'use client';

import { CreditCard, Mail, MapPin, Clock, Check, X } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  credit_card: CreditCard,
  email: Mail,
  address: MapPin,
};

const typeLabels: Record<string, string> = {
  credit_card: 'Credit Card',
  email: 'Email Address',
  address: 'Address',
};

interface Detection {
  id: string;
  type: string;
  confidence: number;
  timestamp: number;
  autoBlurred: boolean;
  whitelisted?: boolean;
  value?: string;
}

interface RecentDetectionsProps {
  detections: Detection[];
}

export function RecentDetections({ detections }: RecentDetectionsProps) {
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Recent Detections</h3>
        <button className="text-sm text-sentinel-400 hover:text-sentinel-300 font-medium">
          View All →
        </button>
      </div>

      <div className="space-y-3">
        {detections.map((detection) => {
          const Icon = iconMap[detection.type] || CreditCard;
          
          return (
            <div 
              key={detection.id}
              className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700 hover:border-dark-600 transition-colors"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                detection.whitelisted 
                  ? 'bg-blue-500/10' 
                  : detection.autoBlurred 
                    ? 'bg-sentinel-500/10' 
                    : 'bg-amber-500/10'
              }`}>
                <Icon className={`w-6 h-6 ${
                  detection.whitelisted 
                    ? 'text-blue-400' 
                    : detection.autoBlurred 
                      ? 'text-sentinel-400' 
                      : 'text-amber-400'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    {typeLabels[detection.type] || detection.type}
                  </span>
                  {detection.whitelisted && (
                    <span className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 rounded-full">
                      Whitelisted
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-sm text-dark-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(detection.timestamp)}
                  </span>
                  <span>•</span>
                  <span>Confidence: {Math.round(detection.confidence * 100)}%</span>
                  {detection.value && (
                    <>
                      <span>•</span>
                      <span className="truncate max-w-[150px]">{detection.value}</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
                detection.autoBlurred 
                  ? 'bg-sentinel-500/10 text-sentinel-400' 
                  : 'bg-blue-500/10 text-blue-400'
              }`}>
                {detection.autoBlurred ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm font-medium">Auto-blurred</span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-medium">Allowed</span>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {detections.length === 0 && (
          <div className="text-center py-12 text-dark-400">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-dark-800 flex items-center justify-center">
              <Check className="w-8 h-8 text-sentinel-400" />
            </div>
            <p className="text-lg font-medium text-white mb-1">All Clear!</p>
            <p className="text-sm">No PII detected in your stream</p>
          </div>
        )}
      </div>
    </div>
  );
}

