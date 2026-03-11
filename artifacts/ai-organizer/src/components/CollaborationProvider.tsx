/**
 * CollaborationProvider - Real-time collaboration features
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
}

interface Cursor {
  userId: string;
  x: number;
  y: number;
  timestamp: number;
}

interface Selection {
  userId: string;
  start: number;
  end: number;
  timestamp: number;
}

interface Edit {
  userId: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content?: string;
  length?: number;
  timestamp: number;
}

interface CollaborationContextType {
  isConnected: boolean;
  users: User[];
  currentUser: User | null;
  cursors: Map<string, Cursor>;
  selections: Map<string, Selection>;
  edits: Edit[];
  connect: () => void;
  disconnect: () => void;
  sendCursor: (x: number, y: number) => void;
  sendSelection: (start: number, end: number) => void;
  sendEdit: (edit: Omit<Edit, 'userId' | 'timestamp'>) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}

interface CollaborationProviderProps {
  children: React.ReactNode;
  documentId: string;
  userId?: string;
  userName?: string;
}

export function CollaborationProvider({ children, documentId, userId = 'user-1', userName = 'User' }: CollaborationProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [selections, setSelections] = useState<Map<string, Selection>>(new Map());
  const [edits, setEdits] = useState<Edit[]>([]);

  // Generate user color based on ID
  const generateUserColor = useCallback((id: string) => {
    const colors = [
      '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'
    ];
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  }, []);

  // Initialize current user
  const currentUser: User = {
    id: userId,
    name: userName,
    color: generateUserColor(userId),
  };

  // Simulate WebSocket connection
  const connect = useCallback(() => {
    // Simulate connection delay
    setTimeout(() => {
      setIsConnected(true);
      setUsers([currentUser]);
      
      // Simulate other users joining
      setTimeout(() => {
        setUsers(prev => [
          ...prev,
          {
            id: 'user-2',
            name: 'Alice',
            color: '#10b981',
          }
        ]);
      }, 2000);
    }, 500);
  }, [currentUser, generateUserColor]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setUsers([currentUser]);
    setCursors(new Map());
    setSelections(new Map());
  }, [currentUser]);

  const sendCursor = useCallback((x: number, y: number) => {
    if (!isConnected) return;

    const cursor: Cursor = {
      userId: currentUser.id,
      x,
      y,
      timestamp: Date.now(),
    };

    setCursors(prev => new Map(prev.set(currentUser.id, cursor)));

    // Simulate broadcasting to other users
    setTimeout(() => {
      // Remove cursor after user stops moving
      setCursors(prev => {
        const newMap = new Map(prev);
        if (newMap.get(currentUser.id)?.timestamp === cursor.timestamp) {
          setTimeout(() => {
            setCursors(prev => {
              const updated = new Map(prev);
              updated.delete(currentUser.id);
              return updated;
            });
          }, 3000);
        }
        return newMap;
      });
    }, 100);
  }, [isConnected, currentUser.id]);

  const sendSelection = useCallback((start: number, end: number) => {
    if (!isConnected) return;

    const selection: Selection = {
      userId: currentUser.id,
      start,
      end,
      timestamp: Date.now(),
    };

    setSelections(prev => new Map(prev.set(currentUser.id, selection)));
  }, [isConnected, currentUser.id]);

  const sendEdit = useCallback((edit: Omit<Edit, 'userId' | 'timestamp'>) => {
    if (!isConnected) return;

    const fullEdit: Edit = {
      ...edit,
      userId: currentUser.id,
      timestamp: Date.now(),
    };

    setEdits(prev => [...prev, fullEdit]);

    // Simulate broadcasting to other users
    setTimeout(() => {
      // Simulate other user's reaction
      if (Math.random() > 0.7) {
        const reactionEdit: Edit = {
          userId: 'user-2',
          type: 'insert',
          position: edit.position + (edit.content?.length || 0),
          content: ' [collaborated]',
          timestamp: Date.now(),
        };
        setEdits(prev => [...prev, reactionEdit]);
      }
    }, 1000 + Math.random() * 2000);
  }, [isConnected, currentUser.id]);

  // Clean up old cursors and selections
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      // Clean old cursors (older than 3 seconds)
      setCursors(prev => {
        const cleaned = new Map();
        prev.forEach((cursor, id) => {
          if (now - cursor.timestamp < 3000) {
            cleaned.set(id, cursor);
          }
        });
        return cleaned;
      });

      // Clean old selections (older than 10 seconds)
      setSelections(prev => {
        const cleaned = new Map();
        prev.forEach((selection, id) => {
          if (now - selection.timestamp < 10000) {
            cleaned.set(id, selection);
          }
        });
        return cleaned;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const value: CollaborationContextType = {
    isConnected,
    users,
    currentUser,
    cursors,
    selections,
    edits,
    connect,
    disconnect,
    sendCursor,
    sendSelection,
    sendEdit,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

export default CollaborationProvider;
