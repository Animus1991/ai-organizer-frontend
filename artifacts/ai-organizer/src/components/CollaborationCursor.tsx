/**
 * CollaborationCursor - Shows other users' cursors and selections
 */

import React from 'react';
import { useCollaboration } from './CollaborationProvider';

interface CollaborationCursorProps {
  containerRef: React.RefObject<HTMLElement>;
  content: string;
}

export function CollaborationCursor({ containerRef, content }: CollaborationCursorProps) {
  const { cursors, selections, users, currentUser } = useCollaboration();

  const renderCursor = (userId: string, cursor: any) => {
    const user = users.find(u => u.id === userId);
    if (!user || userId === currentUser?.id) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: cursor.x,
          top: cursor.y,
          width: '20px',
          height: '20px',
          pointerEvents: 'none',
          zIndex: 1000,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          style={{
            width: '2px',
            height: '20px',
            backgroundColor: user.color,
            transform: 'rotate(-45deg)',
            transformOrigin: 'center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '0px',
            backgroundColor: user.color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          {user.name}
        </div>
      </div>
    );
  };

  const renderSelection = (userId: string, selection: any) => {
    const user = users.find(u => u.id === userId);
    if (!user || userId === currentUser?.id) return null;

    // Calculate selection position (simplified)
    const beforeText = content.substring(0, selection.start);
    const selectedText = content.substring(selection.start, selection.end);
    
    // This is a simplified calculation - in real implementation,
    // you'd need to calculate actual text positions
    const lineHeight = 20;
    const startLine = beforeText.split('\n').length - 1;
    const startChar = beforeText.split('\n').pop()?.length || 0;

    return (
      <div
        style={{
          position: 'absolute',
          left: `${startChar * 8}px`, // Approximate character width
          top: `${startLine * lineHeight}px`,
          backgroundColor: `${user.color}33`,
          borderLeft: `2px solid ${user.color}`,
          padding: '2px 4px',
          borderRadius: '2px',
          pointerEvents: 'none',
          zIndex: 999,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20px',
            left: '0',
            backgroundColor: user.color,
            color: 'white',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '11px',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          }}
        >
          {user.name} selected
        </div>
      </div>
    );
  };

  return (
    <>
      {Array.from(cursors.entries()).map(([userId, cursor]) => (
        <div key={`cursor-${userId}`}>
          {renderCursor(userId, cursor)}
        </div>
      ))}
      {Array.from(selections.entries()).map(([userId, selection]) => (
        <div key={`selection-${userId}`}>
          {renderSelection(userId, selection)}
        </div>
      ))}
    </>
  );
}

export default CollaborationCursor;
