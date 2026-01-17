'use client';

interface TensionMeterProps {
  tensionLevel: number; // 0.0 - 1.0
}

export function TensionMeter({ tensionLevel }: TensionMeterProps) {
  const percentage = Math.round(tensionLevel * 100);
  const getStatus = () => {
    if (tensionLevel < 0.3) return { text: 'Calm', color: 'text-green-600' };
    if (tensionLevel < 0.7) return { text: 'Normal', color: 'text-blue-600' };
    return { text: 'High Tension', color: 'text-red-600' };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">TENSION METER</h3>
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all ${
              tensionLevel < 0.3
                ? 'bg-green-500'
                : tensionLevel < 0.7
                ? 'bg-blue-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <div className={`text-2xl font-bold ${status.color}`}>
        {percentage}% - {status.text}
      </div>
      <div className="text-xs text-gray-600 mt-1">
        Filter sensitivity automatically adjusted during high tension
      </div>
    </div>
  );
}
