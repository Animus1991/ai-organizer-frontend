/**
 * CollaborationPanel - Shows active users and collaboration status
 */

import React from 'react';
import { useCollaboration } from './CollaborationProvider';

interface CollaborationPanelProps {
  className?: string;
}

export function CollaborationPanel({ className = '' }: CollaborationPanelProps) {
  const { isConnected, users, currentUser, edits } = useCollaboration();

  if (!currentUser) return null;

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '200px',
        backdropFilter: 'blur(10px)',
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isConnected ? '#10b981' : '#ef4444',
              animation: isConnected ? 'pulse 2s infinite' : 'none',
            }}
          />
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 600, 
            color: '#ffffff' 
          }}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        
        <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
          Real-time collaboration
        </div>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <h4 style={{ 
          fontSize: '13px', 
          fontWeight: 600, 
          color: '#ffffff', 
          marginBottom: '8px' 
        }}>
          Active Users ({users.length})
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.map(user => (
            <div
              key={user.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px',
                borderRadius: '6px',
                background: user.id === currentUser.id 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: user.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#ffffff',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: 500, 
                  color: '#ffffff' 
                }}>
                  {user.name}
                </div>
                {user.id === currentUser.id && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: 'rgba(255, 255, 255, 0.6)' 
                  }}>
                    (You)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {edits.length > 0 && (
        <div>
          <h4 style={{ 
            fontSize: '13px', 
            fontWeight: 600, 
            color: '#ffffff', 
            marginBottom: '8px' 
          }}>
            Recent Activity
          </h4>
          
          <div style={{ 
            maxHeight: '120px', 
            overflowY: 'auto',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {edits.slice(-5).reverse().map((edit, index) => {
              const user = users.find(u => u.id === edit.userId);
              return (
                <div
                  key={edit.timestamp}
                  style={{
                    marginBottom: '4px',
                    padding: '4px 6px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderLeft: `2px solid ${user?.color || '#6b7280'}`,
                  }}
                >
                  <div style={{ fontWeight: 500, marginBottom: '2px' }}>
                    {user?.name || 'Unknown'}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {edit.type === 'insert' && 'inserted text'}
                    {edit.type === 'delete' && 'deleted text'}
                    {edit.type === 'replace' && 'replaced text'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}

export default CollaborationPanel;
