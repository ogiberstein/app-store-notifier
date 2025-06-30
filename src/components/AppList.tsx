'use client';

import React, { useState } from 'react';

export interface AppItem {
  id: string;
  name: string;
}

// Hardcoded list of popular apps
const popularApps: AppItem[] = [
  { id: 'com.vilcsak.bitcoin2', name: 'Coinbase' },
  { id: 'co.mona.Monaco', name: 'Crypto.com - Buy Bitcoin, ETH' },
  { id: 'com.kraken.invest.app', name: 'Kraken - Buy & Sell Crypto' },
  // { id: 'com.whatsapp', name: 'WhatsApp Messenger' }, // Kept one old one for 5 total if needed, or remove
];

interface AppListProps {
  onChange: (selectedApps: AppItem[]) => void;
  initialSelectedApps?: string[];
}

const AppList: React.FC<AppListProps> = ({ onChange, initialSelectedApps = [] }) => {
  const [selectedApps, setSelectedApps] = useState<string[]>(initialSelectedApps);

  const handleCheckboxChange = (app: AppItem) => {
    const newSelectedIds = selectedApps.includes(app.id)
      ? selectedApps.filter(id => id !== app.id)
      : [...selectedApps, app.id];
    setSelectedApps(newSelectedIds);

    const newSelectedApps = popularApps.filter(pApp => newSelectedIds.includes(pApp.id));
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
            onChange={() => handleCheckboxChange(app)}
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