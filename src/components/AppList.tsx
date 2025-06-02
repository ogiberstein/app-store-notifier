'use client';

import React, { useState } from 'react';

interface AppItem {
  id: string;
  name: string;
}

// Hardcoded list of popular apps
const popularApps: AppItem[] = [
  { id: 'com.binance.dev', name: 'Binance' }, // Placeholder ID
  { id: 'com.coinbase.android', name: 'Coinbase' }, // Placeholder ID, .android is common
  { id: 'app.phantom', name: 'Phantom Wallet' }, // Placeholder ID
  { id: 'co.mona.android', name: 'Crypto.com - Buy Bitcoin, ETH' }, // Placeholder ID for Crypto.com
  { id: 'com.kraken.invest', name: 'Kraken - Buy & Sell Crypto' }, // Placeholder ID
  // { id: 'com.whatsapp', name: 'WhatsApp Messenger' }, // Kept one old one for 5 total if needed, or remove
];

interface AppListProps {
  onChange: (selectedAppIds: string[]) => void;
  initialSelectedApps?: string[];
}

const AppList: React.FC<AppListProps> = ({ onChange, initialSelectedApps = [] }) => {
  const [selectedApps, setSelectedApps] = useState<string[]>(initialSelectedApps);

  const handleCheckboxChange = (appId: string) => {
    const newSelectedApps = selectedApps.includes(appId)
      ? selectedApps.filter(id => id !== appId)
      : [...selectedApps, appId];
    setSelectedApps(newSelectedApps);
    onChange(newSelectedApps);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-medium text-gray-900">Select Apps to Monitor:</h3>
      {popularApps.map((app) => (
        <div key={app.id} className="flex items-center">
          <input
            id={`app-${app.id}`}
            name={`app-${app.id}`}
            type="checkbox"
            checked={selectedApps.includes(app.id)}
            onChange={() => handleCheckboxChange(app.id)}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label htmlFor={`app-${app.id}`} className="ml-2 block text-sm text-gray-700">
            {app.name}
          </label>
        </div>
      ))}
    </div>
  );
};

export default AppList; 