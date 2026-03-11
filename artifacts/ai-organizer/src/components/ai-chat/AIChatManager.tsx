/**
 * AIChatManager - Global AI Chat Manager
 * 
 * Manages multiple AI chat windows that are available on all pages (except Login).
 * Each window can connect to a different AI provider (OpenAI, Anthropic, etc.).
 * 
 * Features:
 * - Multiple simultaneous chat windows
 * - OAuth authentication (Gmail, GitHub, Email/Password)
 * - Auto-connect preference (from settings)
 * - Mobile-responsive design
 * - Privacy-first: no conversation logging
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipeGesture } from '../../hooks/useSwipeGesture';
import { useAuth } from '../../auth/useAuth';
import { useLocation } from 'react-router-dom';
import { AIChatWindow } from './AIChatWindow';
import type { ChatWindow } from './types';
import { getProviderStatus, checkSession, listProviders } from '../../lib/api/aiChat';
import { useTheme } from '../../context/ThemeContext';
import { MessageCircle } from 'lucide-react';
import { MessengerWindow } from '../messenger';

interface AIChatManagerProps {
  // Optional: can be controlled externally
}

type ChatLayoutMode = 'floating' | 'sticky';

export function AIChatManager({}: AIChatManagerProps) {
  const { isAuthed } = useAuth();
  const location = useLocation();
  const { isDark } = useTheme();
  
  // Don't show chat on login page
  const isLoginPage = location.pathname === '/login';
  
  const [windows, setWindows] = useState<Map<string, ChatWindow>>(new Map());
  const [nextZIndex, setNextZIndex] = useState(1000);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [availableProviders, setAvailableProviders] = useState<Array<{ providerType: string; name: string }>>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [layoutMode, setLayoutMode] = useState<ChatLayoutMode>('floating');
  const [messengerOpen, setMessengerOpen] = useState(false);
  const [messengerMinimized, setMessengerMinimized] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 768;
  
  // Load available providers function
  const loadProviders = useCallback(async () => {
    setLoadingProviders(true);
    try {
      const providers = await listProviders();
      // Filter out providers without providerType and ensure all have valid providerType
      const validProviders = providers
        .filter(p => p.providerType && p.name) // Only include providers with valid providerType and name
        .map(p => ({ providerType: p.providerType, name: p.name }));
      
      setAvailableProviders(validProviders);
      
      if (validProviders.length === 0) {
        console.warn('No valid providers found after filtering', { providers });
      }
    } catch (error) {
      // Silently fail if backend is not available
      if (error instanceof Error && error.message.includes('Cannot connect')) {
        console.debug('Backend not available - provider list will load when backend is ready');
      } else {
        console.error('Failed to load providers:', error);
      }
      setAvailableProviders([]); // Clear providers on error
    } finally {
      setLoadingProviders(false);
    }
  }, []);
  
  // Load providers on mount
  useEffect(() => {
    if (!isAuthed || isLoginPage) return;
    loadProviders();
  }, [isAuthed, isLoginPage, loadProviders]);
  
  // Reload providers when dialog opens
  useEffect(() => {
    if (showProviderDialog && availableProviders.length === 0 && !loadingProviders) {
      loadProviders();
    }
  }, [showProviderDialog, availableProviders.length, loadingProviders, loadProviders]);

  // Listen for toggleAIChat custom event (fired from quick actions)
  useEffect(() => {
    const handler = () => setShowProviderDialog(true);
    window.addEventListener('toggleAIChat', handler);
    return () => window.removeEventListener('toggleAIChat', handler);
  }, []);
  
  // Auto-connect on mount (if enabled in settings)
  useEffect(() => {
    if (!isAuthed || isLoginPage) return;
    
    // Load providers with auto-connect enabled
    const loadAutoConnect = async () => {
      try {
        const statuses = await getProviderStatus();
        // Process all sessions in parallel for better performance
        const sessionChecks = statuses
          .filter(status => status.autoConnect && status.connected && status.providerType)
          .map(async (status) => {
            try {
              const session = await checkSession(status.providerType!);
              if (session.connected && !session.expired) {
                return status.providerType!;
              }
              return null;
            } catch (error) {
              // Silently fail individual session checks
              if (error instanceof Error && error.message.includes('Cannot connect')) {
                console.debug(`Backend not available - skipping session check for ${status.providerType}`);
              }
              return null;
            }
          });
        
        const validProviders = (await Promise.all(sessionChecks)).filter((p): p is string => p !== null);
        
        // Open windows for valid providers
        validProviders.forEach(providerType => {
          openWindow(providerType);
        });
      } catch (error) {
        // Silently fail if backend is not available
        // This is expected when backend is not running
        if (error instanceof Error && error.message.includes('Cannot connect')) {
          console.debug('Backend not available - skipping auto-connect');
        } else {
          console.error('Failed to load auto-connect providers:', error);
        }
      }
    };
    
    loadAutoConnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, isLoginPage]); // openWindow is stable, no need to include it
  
  // Calculate position for new window based on layout mode
  const calculateNewWindowPosition = useCallback((existingWindows: Map<string, ChatWindow>, mode: ChatLayoutMode, isMinimized: boolean = false) => {
    const windowWidth = 380;
    const windowHeight = 600;
    const padding = 20;
    
    if (mode === 'sticky') {
      // Sticky mode: place windows side-by-side in a row, starting from bottom-right
      // Reserve space for the control buttons (toggle + new chat button) on the right
      // Toggle button: ~120px width, New chat button: 60px width, gap: 12px, padding: 20px
      const controlButtonsWidth = 120 + 12 + 60; // Toggle button + gap + new chat button
      const controlButtonsPadding = 20; // Padding from edge
      const reservedRightSpace = controlButtonsWidth + controlButtonsPadding;
      
      const gapOpen = 12; // Gap for open windows
      const gapMinimized = 40; // Gap for minimized windows
      const minimizedWidth = 200;
      const startY = window.innerHeight - windowHeight - padding; // Bottom of screen - consistent Y for all
      
      // Separate windows into open and minimized, sorted by position (rightmost first)
      const openWindows = Array.from(existingWindows.values())
        .filter(w => !w.minimized)
        .sort((a, b) => b.position.x - a.position.x);
      const minimizedWindows = Array.from(existingWindows.values())
        .filter(w => w.minimized)
        .sort((a, b) => b.position.x - a.position.x);
      
      // Calculate position from right, ensuring proper gaps
      const startX = window.innerWidth - reservedRightSpace - windowWidth;
      const thisWidth = isMinimized ? minimizedWidth : windowWidth;
      
      // Get existing positions sorted by x (rightmost first)
      const existingPositions = Array.from(existingWindows.values())
        .map(w => ({
          x: w.position.x,
          width: w.minimized ? minimizedWidth : windowWidth,
          minimized: w.minimized,
        }))
        .sort((a, b) => b.x - a.x);
      
      let x: number;
      
      if (existingPositions.length === 0) {
        // First window: position at startX
        if (isMinimized) {
          x = startX + (windowWidth - minimizedWidth);
        } else {
          x = startX;
        }
      } else {
        // Position after the rightmost window with proper gap
        const rightmost = existingPositions[0];
        const gapToUse = rightmost.minimized && isMinimized ? gapMinimized : 
                        (!rightmost.minimized && !isMinimized ? gapOpen : 
                        Math.max(gapMinimized, gapOpen));
        x = rightmost.x - thisWidth - gapToUse;
        
        // Verify no overlap with any other window
        const overlaps = existingPositions.some(pos => {
          return !(x + thisWidth <= pos.x || x >= pos.x + pos.width);
        });
        
        if (overlaps) {
          // If overlaps, find the leftmost position and place to its left
          const leftmost = existingPositions[existingPositions.length - 1];
          x = leftmost.x - thisWidth - gapToUse;
        }
      }
      
      // Ensure position is not off-screen
      if (x < padding) {
        x = padding;
      }
      
      // Calculate row (for wrapping) - use average for estimation
      const availableWidth = window.innerWidth - padding - reservedRightSpace;
      const totalWindows = existingWindows.size + 1;
      const totalOpen = openWindows.length + (isMinimized ? 0 : 1);
      const totalMinimized = minimizedWindows.length + (isMinimized ? 1 : 0);
      const avgWidth = (totalOpen * windowWidth + totalMinimized * minimizedWidth) / totalWindows;
      const avgGap = (totalOpen * gapOpen + totalMinimized * gapMinimized) / totalWindows;
      const maxWindowsPerRow = Math.max(1, Math.floor(availableWidth / (avgWidth + avgGap)));
      const row = Math.floor((existingWindows.size) / maxWindowsPerRow);
      const y = startY - (row * (windowHeight + gapOpen));
      
      return { x, y };
    } else {
      // Floating mode: cascade positioning
      // Reserve space for control buttons on the right
      const controlButtonsWidth = 120 + 12 + 60; // Toggle button + gap + new chat button
      const controlButtonsPadding = 20;
      const reservedRightSpace = controlButtonsWidth + controlButtonsPadding;
      
      const offset = 30; // Offset between windows for cascade effect
      
      // Start from bottom-right, but leave space for control buttons
      let x = window.innerWidth - windowWidth - padding - reservedRightSpace;
      let y = window.innerHeight - windowHeight - padding;
      
      // If there are existing windows, try to find a non-overlapping position
      if (existingWindows.size > 0) {
        const existingPositions = Array.from(existingWindows.values()).map(w => ({
          x: w.position.x,
          y: w.position.y,
          width: w.size.width,
          height: w.size.height,
        }));
        
        // Try cascade positions (diagonal offset)
        let found = false;
        for (let i = 0; i < existingWindows.size + 1; i++) {
          const candidateX = window.innerWidth - windowWidth - padding - reservedRightSpace - (i * offset);
          const candidateY = window.innerHeight - windowHeight - padding - (i * offset);
          
          // Check if this position overlaps with any existing window
          const overlaps = existingPositions.some(pos => {
            return !(
              candidateX + windowWidth < pos.x ||
              candidateX > pos.x + pos.width ||
              candidateY + windowHeight < pos.y ||
              candidateY > pos.y + pos.height
            );
          });
          
          if (!overlaps && candidateX >= padding && candidateY >= padding) {
            x = candidateX;
            y = candidateY;
            found = true;
            break;
          }
        }
        
        // If cascade doesn't work, try grid layout
        if (!found) {
          const cols = Math.floor((window.innerWidth - 2 * padding) / (windowWidth + offset));
          const col = existingWindows.size % cols;
          const row = Math.floor(existingWindows.size / cols);
          
          x = padding + col * (windowWidth + offset);
          y = padding + row * (windowHeight + offset);
          
          // Ensure it fits on screen
          if (x + windowWidth > window.innerWidth - padding) {
            x = window.innerWidth - windowWidth - padding;
          }
          if (y + windowHeight > window.innerHeight - padding) {
            y = window.innerHeight - windowHeight - padding;
          }
        }
      }
      
      return { x, y };
    }
  }, []);
  
  // Update window positions when layout mode changes or when windows are minimized/maximized
  useEffect(() => {
    if (windows.size === 0) return;
    
    setWindows(prev => {
      const next = new Map();
      // Sort windows: open first, then minimized (both sorted by creation/position)
      const windowsArray = Array.from(prev.entries()).sort(([, a], [, b]) => {
        if (a.minimized !== b.minimized) {
          return a.minimized ? 1 : -1; // Open windows first
        }
        // Within same state, maintain order by id (creation time)
        return a.id.localeCompare(b.id);
      });
      
      // Process windows in order: open first, then minimized
      // This ensures proper gap calculation
      const openWindowsArray = windowsArray.filter(([, w]) => !w.minimized);
      const minimizedWindowsArray = windowsArray.filter(([, w]) => w.minimized);
      
      // Process open windows first
      openWindowsArray.forEach(([id, window]) => {
        const processedWindows = new Map(Array.from(next.entries()));
        const position = calculateNewWindowPosition(processedWindows, layoutMode, false);
        next.set(id, { ...window, position });
      });
      
      // Process minimized windows after open windows
      minimizedWindowsArray.forEach(([id, window]) => {
        const processedWindows = new Map(Array.from(next.entries()));
        const position = calculateNewWindowPosition(processedWindows, layoutMode, true);
        next.set(id, { ...window, position });
      });
      
      return next;
    });
  }, [layoutMode, calculateNewWindowPosition, windows.size]);
  
  const openWindow = useCallback((providerType: string) => {
    // Validate providerType
    if (!providerType || providerType === 'undefined') {
      console.error('openWindow: providerType is missing or invalid', { providerType });
      alert('Error: Cannot open chat window. Provider type is missing.');
      return null;
    }
    
    setWindows(prev => {
      // Check maximum limit: only 4 open (non-minimized) windows allowed
      const openWindowsCount = Array.from(prev.values()).filter(w => !w.minimized).length;
      if (openWindowsCount >= 4) {
        alert('Maximum of 4 open chat windows allowed. Please close or minimize a window first.');
        return prev;
      }
      
      // Check if window for this provider already exists and is not minimized
      for (const [id, window] of prev.entries()) {
        if (window.providerType === providerType && !window.minimized) {
          // Bring existing window to front instead of creating new one
          const next = new Map(prev);
          const existingWindow = next.get(id);
          if (existingWindow) {
            existingWindow.zIndex = nextZIndex;
            next.set(id, existingWindow);
            setNextZIndex(prev => prev + 1);
            return next;
          }
        }
      }
      
      // Calculate position that doesn't overlap with existing windows
      const position = calculateNewWindowPosition(prev, layoutMode, false); // New windows are not minimized
      
      const windowId = `${providerType}-${Date.now()}`;
      const newWindow: ChatWindow = {
        id: windowId,
        providerType,
        position,
        size: { width: 380, height: 600 },
        minimized: false,
        zIndex: nextZIndex,
      };
      
      const next = new Map(prev);
      next.set(windowId, newWindow);
      setNextZIndex(prev => prev + 1);
      return next;
    });
    
    return null;
  }, [nextZIndex, calculateNewWindowPosition]);
  
  const closeWindow = useCallback((windowId: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      next.delete(windowId);
      return next;
    });
  }, []);
  
  const updateWindow = useCallback((windowId: string, updates: Partial<ChatWindow>) => {
    setWindows(prev => {
      const next = new Map(prev);
      const window = next.get(windowId);
      if (window) {
        const updatedWindow = { ...window, ...updates };
        next.set(windowId, updatedWindow);
        
        // If minimized state changed in sticky mode, recalculate all positions
        if (layoutMode === 'sticky' && 'minimized' in updates && updates.minimized !== window.minimized) {
          // Trigger position recalculation by updating all windows
          const windowsArray = Array.from(next.entries()).sort(([, a], [, b]) => {
            if (a.minimized !== b.minimized) {
              return a.minimized ? 1 : -1; // Open windows first
            }
            return a.id.localeCompare(b.id);
          });
          
          const repositioned = new Map();
          windowsArray.forEach(([id, w]) => {
            const processedWindows = new Map(Array.from(repositioned.entries()));
            const position = calculateNewWindowPosition(processedWindows, layoutMode, w.minimized);
            repositioned.set(id, { ...w, position });
          });
          return repositioned;
        }
      }
      return next;
    });
  }, [layoutMode, calculateNewWindowPosition]);
  
  const bringToFront = useCallback((windowId: string) => {
    setWindows(prev => {
      const next = new Map(prev);
      const window = next.get(windowId);
      if (window) {
        window.zIndex = nextZIndex;
        next.set(windowId, window);
        setNextZIndex(prev => prev + 1);
      }
      return next;
    });
  }, [nextZIndex]);
  
  // ── Click outside to minimize all windows ──
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks on FABs, provider dialog, or inside chat windows
      if (
        target.closest('.ai-chat-fab') ||
        target.closest('.ai-chat-layout-toggle') ||
        target.closest('.messenger-fab') ||
        target.closest('[data-ai-chat-window]') ||
        target.closest('[data-messenger-window]') ||
        target.closest('[data-provider-dialog]')
      ) return;

      // Minimize all open AI chat windows
      setWindows(prev => {
        let changed = false;
        const next = new Map(prev);
        for (const [id, w] of next) {
          if (!w.minimized) { next.set(id, { ...w, minimized: true }); changed = true; }
        }
        return changed ? next : prev;
      });

      // Also minimize messenger
      if (messengerOpen && !messengerMinimized) {
        setMessengerMinimized(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [messengerOpen, messengerMinimized]);

  // Listen for openChatDrawer event from MobileSwipeProvider
  useEffect(() => {
    const handler = () => setMobileDrawerOpen(true);
    window.addEventListener('openChatDrawer', handler);
    return () => window.removeEventListener('openChatDrawer', handler);
  }, []);

  // Swipe left from right edge → open chat drawer (mobile)
  useSwipeGesture({
    direction: 'left',
    edgeZone: 30,
    threshold: 60,
    enabled: isMobileView && !mobileDrawerOpen,
    onSwipe: useCallback(() => setMobileDrawerOpen(true), []),
  });

  // Swipe right → close chat drawer (mobile)
  useSwipeGesture({
    direction: 'right',
    threshold: 60,
    enabled: isMobileView && mobileDrawerOpen,
    onSwipe: useCallback(() => setMobileDrawerOpen(false), []),
  });

  // Don't render on login page
  const isDemoMode = typeof window !== 'undefined' && localStorage.getItem('demo_mode') === 'true';
  if ((!isAuthed && !isDemoMode) || isLoginPage) {
    return null;
  }
  
  return (
    <>
      {/* Control Buttons — On mobile: swipe-activated split drawer. On desktop: vertical column */}
      {isMobileView ? (
        /* ── MOBILE: Split chat drawer (swipe left from right edge to open, swipe right to close) ── */
        <>
          {/* Edge indicator removed — swipe-only access on mobile */}
          {/* Split drawer overlay */}
          {mobileDrawerOpen && (
            <div
              style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                background: 'hsl(var(--background) / 0.4)',
                backdropFilter: 'blur(4px)',
                animation: 'fadeIn 0.15s ease',
              }}
              onClick={() => setMobileDrawerOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute', top: 0, right: 0, bottom: 0,
                  width: '85%', maxWidth: 360,
                  background: 'hsl(var(--card))',
                  borderLeft: `1px solid hsl(var(--border))`,
                  boxShadow: '-8px 0 32px hsl(var(--background) / 0.5)',
                  display: 'flex', flexDirection: 'column',
                  animation: 'slideInRight 0.2s ease',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '12px 16px', borderBottom: `1px solid hsl(var(--border))`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--foreground))' }}>Chat</span>
                  <button
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{ background: 'hsl(var(--muted))', border: 'none', borderRadius: 6, width: 28, height: 28, cursor: 'pointer', color: 'hsl(var(--muted-foreground))', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                </div>

                {/* AI Chat — top half */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderBottom: `1px solid hsl(var(--border))` }}>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg viewBox="0 0 100 100" width="14" height="14" style={{ flexShrink: 0 }}>
                        <ellipse cx="50" cy="50" rx="44" ry="17" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="7" />
                        <ellipse cx="50" cy="50" rx="44" ry="17" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="7" transform="rotate(60 50 50)" />
                        <ellipse cx="50" cy="50" rx="44" ry="17" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="7" transform="rotate(120 50 50)" />
                        <circle cx="50" cy="50" r="9" fill="hsl(var(--primary-foreground))" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>AI Chat</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <button
                      onClick={() => { setShowProviderDialog(true); setMobileDrawerOpen(false); }}
                      style={{
                        padding: '12px 20px', borderRadius: 10,
                        background: 'linear-gradient(145deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))',
                        border: 'none', cursor: 'pointer', color: 'hsl(var(--primary-foreground))',
                        fontSize: 13, fontWeight: 600, width: '100%',
                      }}
                    >
                      Start AI Chat
                    </button>
                  </div>
                </div>

                {/* Messenger — bottom half */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: 6, background: 'hsl(var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageCircle size={14} style={{ color: 'hsl(var(--foreground))' }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>Messenger</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <button
                      onClick={() => {
                        setMessengerOpen(true); setMessengerMinimized(false);
                        setMobileDrawerOpen(false);
                      }}
                      style={{
                        padding: '12px 20px', borderRadius: 10,
                        background: messengerOpen ? 'hsl(var(--primary) / 0.15)' : 'hsl(var(--muted) / 0.6)',
                        border: `1px solid hsl(var(--border))`,
                        cursor: 'pointer', color: 'hsl(var(--foreground))',
                        fontSize: 13, fontWeight: 600, width: '100%',
                      }}
                    >
                      {messengerOpen ? 'Open Messenger' : 'Start Messenger'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ── DESKTOP: Original vertical FAB column ── */
        <div data-ai-chat-controls style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '4px',
          zIndex: 10000,
          pointerEvents: 'auto',
          alignItems: 'center',
        }}>
        {/* Layout Mode Toggle */}
        {windows.size > 0 && (
          <button
            className="ai-chat-layout-toggle"
            onClick={() => setLayoutMode(prev => prev === 'floating' ? 'sticky' : 'floating')}
            style={{
              padding: '10px 14px',
              borderRadius: '30px',
              background: layoutMode === 'sticky'
                ? 'hsl(var(--primary) / 0.9)'
                : 'hsl(var(--primary) / 0.1)',
              border: `1px solid hsl(var(--primary) / ${layoutMode === 'sticky' ? 0.6 : 0.2})`,
              outline: 'none',
              color: layoutMode === 'sticky' ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: `0 4px 12px hsl(var(--primary) / 0.2)`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            title={`Switch to ${layoutMode === 'floating' ? 'sticky' : 'floating'} mode`}
          >
            {layoutMode === 'floating' ? (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Sticky
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                Floating
              </>
            )}
          </button>
        )}
        
        {/* AI Chat FAB (bottom) */}
        <button
          className="ai-chat-fab"
          onClick={() => setShowProviderDialog(true)}
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'linear-gradient(145deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.8) 100%)',
            border: `2px solid hsl(var(--primary) / 0.5)`,
            cursor: 'pointer',
            boxShadow: `0 6px 24px hsl(var(--primary) / 0.4), 0 2px 8px hsl(var(--background) / 0.3)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.06)';
            e.currentTarget.style.boxShadow = `0 10px 32px hsl(var(--primary) / 0.55), 0 4px 14px hsl(var(--background) / 0.4)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = `0 6px 24px hsl(var(--primary) / 0.4), 0 2px 8px hsl(var(--background) / 0.3)`;
          }}
          tabIndex={0}
          title="Open AI Chat"
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            width="46"
            height="46"
            style={{ display: 'block', flexShrink: 0, pointerEvents: 'none' }}
          >
            <ellipse cx="50" cy="50" rx="44" ry="17"
              fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="5" strokeLinecap="round"
            />
            <ellipse cx="50" cy="50" rx="44" ry="17"
              fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="5" strokeLinecap="round"
              transform="rotate(60 50 50)"
            />
            <ellipse cx="50" cy="50" rx="44" ry="17"
              fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="5" strokeLinecap="round"
              transform="rotate(120 50 50)"
            />
            <circle cx="50" cy="50" r="9" fill="hsl(var(--primary-foreground))" />
            <circle cx="94" cy="50" r="4" fill="hsl(var(--primary-foreground) / 0.9)" />
            <circle cx="28" cy="79" r="4" fill="hsl(var(--primary-foreground) / 0.9)" />
            <circle cx="28" cy="21" r="4" fill="hsl(var(--primary-foreground) / 0.9)" />
          </svg>
          <div
            style={{
              position: 'absolute',
              bottom: 1,
              right: 1,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: 'hsl(var(--primary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 2px 6px hsl(var(--primary) / 0.5)`,
              border: `2px solid hsl(var(--card))`,
            }}
          >
            <svg width="8" height="8" fill="none" stroke="hsl(var(--primary-foreground))" viewBox="0 0 24 24" style={{ display: 'block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M12 5v14M5 12h14" />
            </svg>
          </div>
        </button>

        {/* Messenger FAB (above AI) */}
        <button
          className="messenger-fab"
          onClick={() => {
            if (messengerOpen) {
              setMessengerOpen(false);
              setMessengerMinimized(false);
            } else {
              setMessengerOpen(true);
              setMessengerMinimized(false);
            }
          }}
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: messengerOpen
              ? 'hsl(var(--primary))'
              : 'linear-gradient(145deg, hsl(var(--accent)) 0%, hsl(var(--muted)) 100%)',
            border: `2px solid hsl(var(--primary) / ${messengerOpen ? 0.6 : 0.2})`,
            cursor: 'pointer',
            boxShadow: `0 4px 16px hsl(var(--foreground) / 0.15)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
          }}
          title="Messenger"
        >
          <MessageCircle
            size={24}
            style={{
              color: messengerOpen ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
            }}
          />
        </button>
      </div>
      )}
      
      {/* Provider Selection Dialog */}
      {showProviderDialog && (
        <div
          data-provider-dialog
          style={{
            position: 'fixed', inset: 0,
            background: 'hsl(var(--background) / 0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowProviderDialog(false)}
        >
          <div
            style={{
              background: 'hsl(var(--card))',
              backdropFilter: 'blur(20px)',
              border: `1px solid hsl(var(--border))`,
              borderRadius: '18px', padding: '24px',
              width: '90%', maxWidth: '380px',
              boxShadow: `0 8px 40px hsl(var(--background) / 0.5)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.7))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="hsl(var(--primary-foreground))">
                  <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.333 0-10 1.667-10 5v2h20v-2c0-3.333-6.667-5-10-5z" />
                </svg>
              </div>
              <div>
                <h3 style={{ color: 'hsl(var(--foreground))', margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Select AI Provider
                </h3>
                <p style={{ color: 'hsl(var(--muted-foreground))', margin: 0, fontSize: '12px', marginTop: '2px' }}>
                  Choose your AI assistant
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {loadingProviders ? (
                <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
                  Loading providers...
                </p>
              ) : availableProviders.length > 0 ? (
                availableProviders.map(provider => (
                  <button
                    key={provider.providerType}
                    onClick={() => {
                      if (provider.providerType) {
                        const openWindowsCount = Array.from(windows.values()).filter(w => !w.minimized).length;
                        if (openWindowsCount >= 4) {
                          alert('Maximum of 4 open chat windows allowed. Please close or minimize a window first.');
                          setShowProviderDialog(false);
                          return;
                        }
                        openWindow(provider.providerType);
                        setShowProviderDialog(false);
                      }
                    }}
                    style={{
                      padding: '12px 16px',
                      background: 'hsl(var(--muted) / 0.5)',
                      border: `1px solid hsl(var(--border))`,
                      borderRadius: '10px',
                      color: 'hsl(var(--foreground))',
                      fontSize: '14px', textAlign: 'left', cursor: 'pointer',
                      transition: 'all 0.18s ease', fontWeight: 500,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--primary) / 0.15)';
                      e.currentTarget.style.borderColor = 'hsl(var(--primary) / 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)';
                      e.currentTarget.style.borderColor = 'hsl(var(--border))';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    {provider.name}
                  </button>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 16px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔌</div>
                  <p style={{ color: 'hsl(var(--muted-foreground))', fontSize: '13px', margin: 0 }}>
                    No providers available. Please check your backend connection.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowProviderDialog(false)}
              style={{
                padding: '10px 20px', width: '100%',
                background: 'hsl(var(--muted) / 0.5)',
                border: 'none', borderRadius: '10px',
                color: 'hsl(var(--muted-foreground))',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'hsl(var(--muted))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'hsl(var(--muted) / 0.5)'; }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Render all chat windows */}
      {(() => {
        const windowsArray = Array.from(windows.values());
        // In sticky mode, calculate minimized indices for proper positioning
        const minimizedWindows = layoutMode === 'sticky' 
          ? windowsArray.filter(w => w.minimized).sort((a, b) => {
              // Sort by position.x (rightmost first)
              return b.position.x - a.position.x;
            })
          : [];
        
        return windowsArray.map(window => {
          const minimizedIndex = layoutMode === 'sticky' && window.minimized
            ? minimizedWindows.findIndex(w => w.id === window.id)
            : 0;
          const totalMinimized = minimizedWindows.length;
          
          return (
            <AIChatWindow
              key={window.id}
              window={window}
              onClose={() => closeWindow(window.id)}
              onUpdate={(updates) => updateWindow(window.id, updates)}
              onBringToFront={() => bringToFront(window.id)}
              layoutMode={layoutMode}
              minimizedIndex={minimizedIndex}
              totalMinimized={totalMinimized}
            />
          );
        });
      })()}
      {/* Messenger Window */}
      {messengerOpen && (
        <MessengerWindow
          onClose={() => { setMessengerOpen(false); setMessengerMinimized(false); }}
          onMinimize={() => setMessengerMinimized(!messengerMinimized)}
          minimized={messengerMinimized}
          zIndex={nextZIndex + 1}
          position={{
            x: Math.max(0, Math.min(globalThis.window.innerWidth - (globalThis.window.innerWidth < 420 ? globalThis.window.innerWidth : 380) - 10, globalThis.window.innerWidth - 400 - 100)),
            y: Math.max(0, globalThis.window.innerWidth < 420 ? 0 : globalThis.window.innerHeight - 620 - 20),
          }}
          size={{
            width: globalThis.window.innerWidth < 420 ? globalThis.window.innerWidth : 380,
            height: globalThis.window.innerWidth < 420 ? globalThis.window.innerHeight : 600,
          }}
        />
      )}
    </>
  );
}
