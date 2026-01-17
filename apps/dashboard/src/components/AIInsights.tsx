'use client';

interface AIInsightsProps {
  tensionLevel: number;
}

export function AIInsights({ tensionLevel }: AIInsightsProps) {
  const insights = [
    {
      id: '1',
      message: tensionLevel > 0.7
        ? "Your tension levels spike during boss fights. I automatically increase profanity filtering during these moments."
        : "Your stream is running smoothly. No automatic adjustments needed.",
      type: tensionLevel > 0.7 ? 'warning' : 'info'
    },
    {
      id: '2',
      message: "You've whitelisted your business email 3 times. I've learned to always allow it.",
      type: 'success'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">🧠 AI INSIGHTS</h2>
      </div>
      <div className="p-6 space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg ${
              insight.type === 'warning'
                ? 'bg-yellow-50 border border-yellow-200'
                : insight.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-blue-50 border border-blue-200'
            }`}
          >
            <p className="text-sm text-gray-800">{insight.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
