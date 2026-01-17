import React, { useState, useEffect } from 'react';
import type { LearnedPreference } from '@shared/types';

export function AILearningPanel() {
  const [learnedPreferences, setLearnedPreferences] = useState<LearnedPreference[]>([]);

  useEffect(() => {
    // Load learned preferences from storage
    chrome.storage.local.get(['learnedPreferences'], (result) => {
      if (result.learnedPreferences) {
        setLearnedPreferences(result.learnedPreferences);
      } else {
        // Mock data for demo
        setLearnedPreferences([
          {
            id: '1',
            userId: 'user123',
            filterCategory: 'violence',
            filterSubcategory: 'cartoon',
            originalThreshold: 0.6,
            learnedThreshold: 0.8,
            confidence: 0.92,
            overrideCount: 5,
            lastUpdated: new Date().toISOString()
          },
          {
            id: '2',
            userId: 'user123',
            filterCategory: 'profanity',
            filterSubcategory: 'mild',
            originalThreshold: 0.6,
            learnedThreshold: 0.85,
            confidence: 0.87,
            overrideCount: 8,
            lastUpdated: new Date().toISOString()
          }
        ]);
      }
    });
  }, []);

  const handleAccept = (id: string) => {
    // Accept the learning adjustment
    console.log('Accepted learning adjustment:', id);
  };

  const handleReject = (id: string) => {
    // Reject the learning adjustment
    console.log('Rejected learning adjustment:', id);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">🧠 AI Learning Status</h2>
      
      {learnedPreferences.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🤔</div>
          <p className="text-sm">Still learning your preferences...</p>
          <p className="text-xs mt-2">Override filters to help Sentinella learn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {learnedPreferences.map((pref) => (
            <div
              key={pref.id}
              className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">
                    {pref.filterCategory}
                    {pref.filterSubcategory && (
                      <span className="text-gray-500"> - {pref.filterSubcategory}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Reduced sensitivity ({Math.round(pref.confidence * 100)}% confident)
                  </div>
                </div>
                <span className="text-green-600 text-lg">✓</span>
              </div>
              
              <div className="text-xs text-gray-500 mb-3">
                Based on {pref.overrideCount} overrides
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(pref.id)}
                  className="flex-1 px-3 py-1.5 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200"
                >
                  That's right ✓
                </button>
                <button
                  onClick={() => handleReject(pref.id)}
                  className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200"
                >
                  No, keep filtering
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 rounded-lg p-4 mt-4">
        <div className="text-sm font-semibold text-blue-900 mb-1">
          How it works
        </div>
        <div className="text-xs text-blue-700">
          When you override filters multiple times, Sentinella learns your preferences
          and automatically adjusts sensitivity. You can always accept or reject these changes.
        </div>
      </div>
    </div>
  );
}
