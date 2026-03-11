// src/components/PreferencesDialog.tsx
import { useState, useEffect } from 'react';
import { usePreferences } from '../hooks/usePreferences';

interface PreferencesDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PreferencesDialog({ isOpen, onClose }: PreferencesDialogProps) {
  const {
    preferences,
    savePreferences,
    resetPreferences,
    updateTheme,
    updateLanguage,
    updateDefaultSegmentMode,
    updateExportFormat,
    updateItemsPerPage,
    updateNotifications,
    updateUI
  } = usePreferences();

  const [activeTab, setActiveTab] = useState<'appearance' | 'behavior' | 'export' | 'notifications' | 'ai-chat'>('appearance');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Preferences</h2>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {[
            { id: 'appearance', label: 'Appearance' },
            { id: 'behavior', label: 'Behavior' },
            { id: 'export', label: 'Export' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'ai-chat', label: 'AI Chat' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-secondary hover:text-primary border-b-2 border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'appearance' && (
            <AppearanceTab 
              preferences={preferences}
              updateTheme={updateTheme}
              updateLanguage={updateLanguage}
              updateUI={updateUI}
            />
          )}
          
          {activeTab === 'behavior' && (
            <BehaviorTab 
              preferences={preferences}
              updateDefaultSegmentMode={updateDefaultSegmentMode}
              updateItemsPerPage={updateItemsPerPage}
              updateUI={updateUI}
            />
          )}
          
          {activeTab === 'export' && (
            <ExportTab 
              preferences={preferences}
              updateExportFormat={updateExportFormat}
              updateUI={updateUI}
            />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationsTab 
              preferences={preferences}
              updateNotifications={updateNotifications}
            />
          )}
          
          {activeTab === 'ai-chat' && (
            <AIChatTab 
              preferences={preferences}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-border">
          <button
            onClick={resetPreferences}
            className="px-4 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface-elevated border border-border rounded-lg hover:bg-surface"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppearanceTab({ preferences, updateTheme, updateLanguage, updateUI }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Theme</label>
        <select
          value={preferences.theme}
          onChange={(e) => updateTheme(e.target.value)}
          className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Language</label>
        <select
          value={preferences.language}
          onChange={(e) => updateLanguage(e.target.value)}
          className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
        >
          <option value="en">English</option>
          <option value="el">Ελληνικά</option>
          <option value="es">Español</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">UI Options</label>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.ui.compactMode}
              onChange={(e) => updateUI({ compactMode: e.target.checked })}
            />
            Compact mode
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.ui.showSidebar}
              onChange={(e) => updateUI({ showSidebar: e.target.checked })}
            />
            Show sidebar by default
          </label>
        </div>
      </div>
    </div>
  );
}

function BehaviorTab({ preferences, updateDefaultSegmentMode, updateItemsPerPage, updateUI }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Default Segmentation Mode</label>
        <select
          value={preferences.defaultSegmentMode}
          onChange={(e) => updateDefaultSegmentMode(e.target.value)}
          className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
        >
          <option value="qa">Q&A</option>
          <option value="paragraphs">Paragraphs</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Items per page</label>
        <input
          type="number"
          min="5"
          max="100"
          value={preferences.itemsPerPage}
          onChange={(e) => updateItemsPerPage(parseInt(e.target.value))}
          className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Behavior Options</label>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoSave}
              onChange={(e) => updateUI({ autoSave: e.target.checked })}
            />
            Auto-save documents
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.autoSegment}
              onChange={(e) => updateUI({ autoSegment: e.target.checked })}
            />
            Auto-segment after upload
          </label>
        </div>
      </div>
    </div>
  );
}

function ExportTab({ preferences, updateExportFormat, updateUI }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Default Export Format</label>
        <select
          value={preferences.exportFormat}
          onChange={(e) => updateExportFormat(e.target.value)}
          className="w-full px-3 py-2 bg-surface-elevated border border-border rounded-lg"
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="txt">Plain Text</option>
          <option value="md">Markdown</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Export Options</label>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.showLineNumbers}
              onChange={(e) => updateUI({ showLineNumbers: e.target.checked })}
            />
            Include line numbers in text exports
          </label>
        </div>
      </div>
    </div>
  );
}

function NotificationsTab({ preferences, updateNotifications }: any) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">Notification Preferences</label>
        <div className="space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) => updateNotifications({ email: e.target.checked })}
            />
            Email notifications
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.notifications.browser}
              onChange={(e) => updateNotifications({ browser: e.target.checked })}
            />
            Browser notifications
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.notifications.sounds}
              onChange={(e) => updateNotifications({ sounds: e.target.checked })}
            />
            Sound effects
          </label>
        </div>
      </div>
    </div>
  );
}


function AIChatTab({ preferences }: any) {
  const [providerAutoConnect, setProviderAutoConnect] = useState<Record<string, boolean>>({});
  
  // Load auto-connect preferences from backend
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const aiChatAPI = await import('../lib/api/aiChat');
        const statuses = await aiChatAPI.getProviderStatus();
        const autoConnectMap: Record<string, boolean> = {};
        for (const status of statuses) {
          autoConnectMap[status.providerType] = status.autoConnect;
        }
        setProviderAutoConnect(autoConnectMap);
      } catch (error) {
        // Silently fail if backend is not available
        // User can still toggle preferences - they'll be saved when backend is available
        if (error instanceof Error && error.message.includes('Cannot connect')) {
          console.debug('Backend not available - preferences will load when backend is ready');
        } else {
          console.error('Failed to load auto-connect preferences:', error);
        }
      }
    };
    
    loadPreferences();
  }, []);
  
  const handleToggleAutoConnect = async (providerType: string, enabled: boolean) => {
    // Optimistically update UI
    setProviderAutoConnect(prev => ({ ...prev, [providerType]: enabled }));
    
    try {
      const aiChatAPI = await import('../lib/api/aiChat');
      await aiChatAPI.setAutoConnect(providerType, enabled);
    } catch (error) {
      // Revert on error
      setProviderAutoConnect(prev => ({ ...prev, [providerType]: !enabled }));
      
      if (error instanceof Error && error.message.includes('Cannot connect')) {
        alert('Cannot connect to server. Please ensure the backend is running.');
      } else {
        console.error('Failed to update auto-connect:', error);
        alert(`Failed to update auto-connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };
  
  const providers = [
    { type: 'openai', name: 'OpenAI (GPT-4, GPT-3.5)' },
    { type: 'anthropic', name: 'Anthropic (Claude)' },
    { type: 'gemini', name: 'Google (Gemini)' },
    { type: 'perplexity', name: 'Perplexity AI' },
    { type: 'deepseek', name: 'DeepSeek' },
    { type: 'mistral', name: 'Mistral AI' },
    { type: 'cohere', name: 'Cohere' },
    { type: 'together', name: 'Together AI' },
    { type: 'groq', name: 'Groq' },
    { type: 'huggingface', name: 'Hugging Face' },
  ];
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">AI Chat Auto-Connect</h3>
        <p className="text-sm text-secondary mb-4">
          Enable auto-connect to automatically sign in to AI providers when you open a chat window.
          <br />
          <strong>Note:</strong> Auto-connect is disabled by default for privacy. Enable only for providers you trust.
        </p>
        
        <div className="space-y-3">
          {providers.map(provider => (
            <label key={provider.type} className="flex items-center justify-between p-3 bg-surface-elevated rounded-lg border border-border">
              <div>
                <div className="font-medium">{provider.name}</div>
                <div className="text-xs text-secondary mt-1">
                  {providerAutoConnect[provider.type] 
                    ? 'Will auto-connect on chat open' 
                    : 'Manual connection required'}
                </div>
              </div>
              <input
                type="checkbox"
                checked={providerAutoConnect[provider.type] || false}
                onChange={(e) => handleToggleAutoConnect(provider.type, e.target.checked)}
                className="ml-4"
              />
            </label>
          ))}
        </div>
      </div>
      
      <div className="p-4 bg-surface-elevated rounded-lg border border-border">
        <div className="text-sm text-secondary">
          <strong>Privacy Note:</strong> When auto-connect is enabled, your credentials are stored encrypted on our servers.
          Conversations are stored only on AI provider servers - we do not log or track your chats.
        </div>
      </div>
    </div>
  );
}
