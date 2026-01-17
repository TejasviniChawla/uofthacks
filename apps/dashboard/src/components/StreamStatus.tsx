'use client';

interface StreamStatusProps {
  isActive: boolean;
  itemsBlocked: number;
}

export function StreamStatus({ isActive, itemsBlocked }: StreamStatusProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">STREAM STATUS</h3>
      <div className={`text-2xl font-bold mb-1 ${isActive ? 'text-green-600' : 'text-gray-400'}`}>
        {isActive ? '🟢 PROTECTED' : '⚪ OFFLINE'}
      </div>
      <div className="text-sm text-gray-600">Filters: {isActive ? 'Active' : 'Inactive'}</div>
      <div className="text-sm text-gray-600 mt-1">Items blocked: {itemsBlocked}</div>
    </div>
  );
}
