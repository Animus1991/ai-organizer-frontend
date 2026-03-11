/**
 * AI Chat API Client
 * 
 * Handles all API calls for AI chat functionality:
 * - Provider management
 * - OAuth authentication
 * - Chat completion
 * - Auto-connect preferences
 */

import { getAccessToken } from '../api';

// Use the same base URL pattern as apiClient.ts
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://127.0.0.1:8000";
const API_BASE = `${API_BASE_URL}/api/ai-chat`;

// Types
export interface ProviderInfo {
  providerType: string;
  name: string;
  description: string;
  supportedModels: string[];
  authMethods: string[];
  supportsConversationHistory: boolean;
}

export interface ProviderStatus {
  providerType: string;
  connected: boolean;
  authMethod?: string;
  autoConnect: boolean;
  lastUsedAt?: string;
}

export interface AuthMethodInfo {
  method: string;
  name: string;
  description: string;
  requiresCredentials: boolean;
}

export interface OAuthInitResponse {
  authorizationUrl: string;
  state: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatCompletionRequest {
  providerType: string;
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  conversationId?: string;
}

export interface ChatCompletionResponse {
  content: string;
  model: string;
  provider: string;
  conversationId?: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

// Helper function for authenticated requests with timeout
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  timeoutMs: number = 5000 // 5 second timeout by default
): Promise<T> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    clearTimeout(timeoutId);

    // Check if response is HTML (error page) instead of JSON
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      // Likely an error page or server not running
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
      throw new Error('Server returned non-JSON response. Is the backend running?');
    }

    if (!response.ok) {
      let errorDetail = response.statusText;
      try {
        const errorData = await response.json();
        // Handle standardized error format: { code, message, details }
        if (errorData.message) {
          errorDetail = errorData.message;
          // Add helpful context for OAuth configuration errors
          if (errorData.code === 'bad_request' && errorDetail.includes('not configured')) {
            const authProvider = errorData.details?.auth_provider || 'OAuth provider';
            errorDetail = `${authProvider} is not configured. Please set up OAuth credentials in your backend configuration. See OAUTH_SETUP_INSTRUCTIONS.md for details.`;
          }
        } else if (errorData.detail) {
          // Handle FastAPI validation errors (detail can be array or string)
          if (Array.isArray(errorData.detail)) {
            // Validation errors - join messages
            errorDetail = errorData.detail.map((err: any) => 
              typeof err === 'string' ? err : err.msg || JSON.stringify(err)
            ).join(', ');
          } else if (typeof errorData.detail === 'string') {
            errorDetail = errorData.detail;
          } else {
            errorDetail = JSON.stringify(errorData.detail);
          }
        } else {
          errorDetail = errorData.error || response.statusText;
        }
      } catch {
        // If response is not JSON, use statusText
        errorDetail = response.statusText;
      }
      throw new Error(errorDetail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Cannot connect to server. Is the backend running?');
    }
    
    // Handle network errors (server not running, CORS, etc.)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Cannot connect to server. Is the backend running?');
    }
    throw error;
  }
}

// Provider Management
export async function listProviders(): Promise<ProviderInfo[]> {
  return apiRequest<ProviderInfo[]>('/providers/list');
}

export async function getAuthMethods(
  providerType?: string
): Promise<Record<string, AuthMethodInfo[]>> {
  const url = providerType
    ? `/providers/auth-methods?provider_type=${providerType}`
    : '/providers/auth-methods';
  return apiRequest<Record<string, AuthMethodInfo[]>>(url);
}

export async function getProviderStatus(): Promise<ProviderStatus[]> {
  return apiRequest<ProviderStatus[]>('/providers/status');
}

// OAuth Authentication
export async function initOAuth(
  providerType: string,
  authProvider: string,
  redirectUri: string
): Promise<OAuthInitResponse> {
  return apiRequest<OAuthInitResponse>('/auth/oauth/init', {
    method: 'POST',
    body: JSON.stringify({
      provider_type: providerType,
      auth_provider: authProvider,
      redirect_uri: redirectUri,
    }),
  });
}

export async function oauthCallback(
  providerType: string,
  authProvider: string,
  code: string,
  state: string
): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>('/auth/oauth/callback', {
    method: 'POST',
    body: JSON.stringify({
      provider_type: providerType,
      auth_provider: authProvider,
      code,
      state,
    }),
  });
}

// Email/Password Authentication
export async function emailPasswordAuth(
  providerType: string,
  email: string,
  password: string
): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>('/auth/email-password', {
    method: 'POST',
    body: JSON.stringify({
      provider_type: providerType,
      email,
      password,
    }),
  });
}

// API Key Authentication (store API key)
export async function apiKeyAuth(
  providerType: string,
  apiKey: string
): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>('/auth/api-key', {
    method: 'POST',
    body: JSON.stringify({
      provider_type: providerType,
      api_key: apiKey,
    }),
  });
}

// Logout
export async function logoutProvider(providerType: string): Promise<{ status: string; message: string }> {
  return apiRequest<{ status: string; message: string }>(
    `/auth/logout?provider_type=${providerType}`,
    { method: 'POST' }
  );
}

// Session Management
export async function checkSession(providerType: string): Promise<{
  connected: boolean;
  autoConnect: boolean;
  authMethod?: string;
  expired?: boolean;
}> {
  return apiRequest<{
    connected: boolean;
    autoConnect: boolean;
    authMethod?: string;
    expired?: boolean;
  }>(`/session/check?provider_type=${providerType}`);
}

export async function setAutoConnect(
  providerType: string,
  autoConnect: boolean
): Promise<{ status: string; autoConnect: boolean }> {
  return apiRequest<{ status: string; autoConnect: boolean }>(
    `/session/auto-connect?provider_type=${providerType}&auto_connect=${autoConnect}`,
    { method: 'POST' }
  );
}

// Chat Completion
export async function chatCompletion(
  request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  return apiRequest<ChatCompletionResponse>('/chat/completion', {
    method: 'POST',
    body: JSON.stringify({
      provider_type: request.providerType,
      messages: request.messages,
      model: request.model,
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      stream: request.stream,
      conversation_id: request.conversationId,
    }),
  });
}

// Chat Streaming (TODO: implement SSE)
export async function* chatStream(
  request: ChatCompletionRequest
): AsyncGenerator<string, void, unknown> {
  // TODO: Implement Server-Sent Events streaming
  throw new Error('Streaming not yet implemented');
}
