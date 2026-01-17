'use client';

import { useState } from 'react';
import { Plus, Trash2, Mail, MapPin, CreditCard, Phone } from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  email: Mail,
  address: MapPin,
  credit_card: CreditCard,
  phone: Phone,
};

interface WhitelistItem {
  id: string;
  type: string;
  description: string;
}

interface WhitelistManagerProps {
  items: WhitelistItem[];
  onAdd: (item: { type: string; description: string }) => void;
  onRemove: (id: string) => void;
}

export function WhitelistManager({ items, onAdd, onRemove }: WhitelistManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newType, setNewType] = useState('email');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newValue.trim()) {
      onAdd({ type: newType, description: newValue.trim() });
      setNewValue('');
      setIsAdding(false);
    }
  };

  return (
    <div className="glass-card p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Whitelist</h3>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-sentinel-500/10 hover:bg-sentinel-500/20 text-sentinel-400 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <p className="text-sm text-dark-400 mb-4">
        Items here will never be filtered from your stream
      </p>

      {/* Add New Form */}
      {isAdding && (
        <div className="mb-4 p-4 bg-dark-800/50 rounded-xl border border-dark-600 animate-slide-in">
          <div className="space-y-3">
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-sentinel-500"
            >
              <option value="email">Email</option>
              <option value="address">Address</option>
              <option value="phone">Phone Number</option>
            </select>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Enter value..."
              className="w-full px-3 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-sentinel-500"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAdd}
                className="flex-1 py-2 bg-sentinel-500 hover:bg-sentinel-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2 bg-dark-700 hover:bg-dark-600 text-dark-300 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Whitelist Items */}
      <div className="space-y-2">
        {items.map((item) => {
          const Icon = iconMap[item.type] || Mail;
          
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-dark-800/30 rounded-xl group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{item.description}</p>
                <p className="text-xs text-dark-500 capitalize">{item.type}</p>
              </div>
              <button
                onClick={() => onRemove(item.id)}
                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-dark-400 hover:text-red-400 rounded-lg transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {items.length === 0 && !isAdding && (
          <div className="text-center py-8 text-dark-500">
            <p className="text-sm">No items whitelisted</p>
          </div>
        )}
      </div>
    </div>
  );
}

