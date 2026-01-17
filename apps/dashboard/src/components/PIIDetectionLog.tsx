'use client';

interface PIIDetectionLogProps {
  detections: Array<{
    type: string;
    confidence: number;
    timestamp: number;
    bbox?: any;
  }>;
}

export function PIIDetectionLog({ detections }: PIIDetectionLogProps) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      credit_card: '💳',
      address: '📍',
      phone: '📞',
      email: '📧',
      government_id: '🆔',
      login_credentials: '🔐',
      personal_name: '👤'
    };
    return icons[type] || '⚠️';
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} sec ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes} min ago`;
  };

  if (detections.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-4xl mb-2">✨</div>
        <p>No detections yet. Your stream is clean!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {detections.map((detection, index) => (
        <div key={index} className="p-4 hover:bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getTypeIcon(detection.type)}</span>
              <div>
                <div className="font-semibold capitalize">{detection.type.replace('_', ' ')}</div>
                <div className="text-sm text-gray-600">
                  {detection.bbox ? 'Auto-blurred' : 'Detected'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-700">
                Confidence: {Math.round(detection.confidence * 100)}%
              </div>
              <div className="text-xs text-gray-500">
                {formatTimeAgo(detection.timestamp)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
