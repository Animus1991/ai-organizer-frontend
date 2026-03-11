/**
 * AIChatProviderSelect - Provider Selection Component
 */

import React from 'react';

interface AIChatProviderSelectProps {
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  providers: Array<{ type: string; name: string }>;
}

export function AIChatProviderSelect({ 
  selectedProvider, 
  onProviderChange, 
  providers 
}: AIChatProviderSelectProps) {
  return (
    <select
      value={selectedProvider}
      onChange={(e) => onProviderChange(e.target.value)}
      style={{
        padding: '8px 12px',
        background: 'rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '14px',
      }}
    >
      {providers.map(p => (
        <option key={p.type} value={p.type}>{p.name}</option>
      ))}
    </select>
  );
}
