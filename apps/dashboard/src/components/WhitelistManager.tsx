'use client';

import { useState } from 'react';

export function WhitelistManager() {
  const [whitelist, setWhitelist] = useState([
    { id: '1', type: 'email', value: 'business@mystream.com', description: 'Business Email' },
    { id: '2', type: 'address', value: 'P.O. Box 1234, City', description: 'P.O. Box' }
  ]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">WHITELIST MANAGEMENT</h2>
      </div>
      <div className="p-6">
        <div className="space-y-3 mb-4">
          {whitelist.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium capitalize">{item.type}</div>
                <div className="text-sm text-gray-600">{item.value}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                Remove
              </button>
            </div>
          ))}
        </div>
        <button className="w-full px-4 py-2 bg-sentinella-primary text-white rounded-lg font-medium hover:bg-sentinella-secondary transition">
          + Add to Whitelist
        </button>
      </div>
    </div>
  );
}
