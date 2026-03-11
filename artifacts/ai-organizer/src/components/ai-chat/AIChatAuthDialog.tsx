/**
 * AIChatAuthDialog - Authentication Dialog
 * 
 * Supports OAuth (Gmail, GitHub) and Email/Password authentication.
 */

import React, { useState, useEffect } from 'react';
import { initOAuth, oauthCallback, emailPasswordAuth, apiKeyAuth } from '../../lib/api/aiChat';

interface AIChatAuthDialogProps {
  providerType: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function AIChatAuthDialog({ providerType, onClose, onSuccess }: AIChatAuthDialogProps) {
  const [authMethod, setAuthMethod] = useState<'oauth_gmail' | 'oauth_github' | 'email_password' | 'api_key'>('oauth_gmail');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Validate providerType on mount
  useEffect(() => {
    if (!providerType) {
      console.error('AIChatAuthDialog: providerType is missing!', { providerType });
      alert('Error: Provider type is missing. Please close and try again.');
    }
  }, [providerType]);
  
  const handleOAuth = async (authProvider: 'gmail' | 'github') => {
    setLoading(true);
    try {
      // Validate inputs
      if (!providerType || !authProvider) {
        throw new Error(`Provider type and auth provider are required. providerType: ${providerType}, authProvider: ${authProvider}`);
      }
      
      // Get redirect URI (backend endpoint, not frontend)
      // The OAuth callback must be handled by the backend
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
      const redirectUri = `${API_BASE_URL}/api/ai-chat/auth/oauth/callback`;
      
      // Initialize OAuth flow
      const { authorizationUrl, state } = await initOAuth(
        providerType,
        authProvider,
        redirectUri
      );
      
      // Store state in sessionStorage for validation
      sessionStorage.setItem(`oauth_state_${providerType}`, state);
      sessionStorage.setItem(`oauth_provider_${providerType}`, authProvider);
      
      // Open OAuth provider in popup window
      const popup = window.open(
        authorizationUrl,
        'oauth-popup',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );
      
      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }
      
      // Listen for OAuth callback message from popup
      let cleanupTimeout: NodeJS.Timeout | null = null;
      
      const messageHandler = (event: MessageEvent) => {
        // Verify message origin
        const FRONTEND_URL = window.location.origin;
        if (event.origin !== FRONTEND_URL && event.origin !== API_BASE_URL) {
          return; // Ignore messages from unknown origins
        }
        
        if (event.data?.type === 'oauth-callback') {
          // Clean up timeout and listener
          if (cleanupTimeout) {
            clearTimeout(cleanupTimeout);
          }
          window.removeEventListener('message', messageHandler);
          
          // Note: We don't call popup.close() here because:
          // 1. The backend HTML response already calls window.close() in the popup
          // 2. Calling popup.close() from the parent window triggers Cross-Origin-Opener-Policy warnings
          // 3. The popup will close itself automatically via the backend's HTML response
          
          if (event.data.status === 'success') {
            setLoading(false);
            onSuccess();
          } else {
            setLoading(false);
            alert(`OAuth failed: ${event.data.error || 'Unknown error'}`);
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Set a timeout as fallback to clean up if no message is received
      // (e.g., if user closes popup manually or OAuth flow times out)
      // Note: We can't check popup.closed directly due to Cross-Origin-Opener-Policy
      cleanupTimeout = setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        setLoading(false);
      }, 10 * 60 * 1000); // 10 minutes timeout
      
    } catch (error) {
      console.error('OAuth initialization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide more helpful error messages
      let userMessage = errorMessage;
      if (errorMessage.includes('not configured') || errorMessage.includes('Missing:')) {
        // Extract missing variables from error message if available
        const missingMatch = errorMessage.match(/Missing: ([^.]+)/);
        const missingVars = missingMatch ? missingMatch[1] : 'client ID and secret';
        
        userMessage = `OAuth provider is not configured on the server.\n\nMissing: ${missingVars}\n\nPlease:\n1. Add these variables to your .env file (backend/.env or root/.env)\n2. Set them to your actual OAuth credentials\n3. Restart the backend server\n4. See backend/OAUTH_SETUP_INSTRUCTIONS.md for detailed setup instructions\n\nAlternatively, you can use Email/Password or API Key authentication below.`;
      } else if (errorMessage.includes('Not authenticated')) {
        userMessage = 'You must be logged in to connect AI providers. Please log in first.';
      }
      
      alert(`OAuth failed: ${userMessage}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEmailPassword = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await emailPasswordAuth(providerType, email, password);
      onSuccess();
    } catch (error) {
      console.error('Email/Password auth failed:', error);
      alert(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApiKey = async () => {
    if (!apiKey) return;
    setLoading(true);
    try {
      await apiKeyAuth(providerType, apiKey);
      onSuccess();
    } catch (error) {
      console.error('API key auth failed:', error);
      alert(`Authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 30, 0.95) 0%, rgba(15, 15, 25, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px' }}>
          Connect to {providerType}
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* OAuth Buttons */}
          <button
            onClick={() => handleOAuth('gmail')}
            disabled={loading}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #4285f4 0%, #34a853 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Sign in with Gmail
          </button>
          
          <button
            onClick={() => handleOAuth('github')}
            disabled={loading}
            style={{
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Sign in with GitHub
          </button>
          
          {/* Email/Password */}
          <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            />
            <button
              onClick={handleEmailPassword}
              disabled={loading || !email || !password}
              style={{
                width: '100%',
                padding: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontWeight: 600,
                cursor: (loading || !email || !password) ? 'not-allowed' : 'pointer',
                opacity: (loading || !email || !password) ? 0.6 : 1,
              }}
            >
              Sign in with Email/Password
            </button>
          </div>
          
          {/* API Key */}
          <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <input
              type="password"
              placeholder="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
              }}
            />
            <button
              onClick={handleApiKey}
              disabled={loading || !apiKey}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: 600,
                cursor: (loading || !apiKey) ? 'not-allowed' : 'pointer',
                opacity: (loading || !apiKey) ? 0.6 : 1,
              }}
            >
              Use API Key
            </button>
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            marginTop: '16px',
            width: '100%',
            padding: '8px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
