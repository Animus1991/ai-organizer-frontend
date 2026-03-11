import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';

interface ScreenshotItem {
  id: string;
  imageData: string;
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  isCropped?: boolean;
  originalData?: string;
}

interface ScreenshotModeProps {
  isActive: boolean;
  onToggle: () => void;
  onCoordinatesExport?: (screenshots: ScreenshotItem[]) => void;
}

export function ScreenshotMode({ isActive, onToggle, onCoordinatesExport }: ScreenshotModeProps) {
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState({ x: 0, y: 0 });
  const [showCoordinates, setShowCoordinates] = useState<string | null>(null);
  const [cropMode, setCropMode] = useState<string | null>(null);
  const [cropSelection, setCropSelection] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isCropping, setIsCropping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) {
      // Reset mode when deactivated
      setScreenshots([]);
      setIsSelecting(false);
      setShowCoordinates(null);
      setCropMode(null);
      setIsCropping(false);
    }
  }, [isActive]);

  // Global event listeners for screenshot dragging (needed because overlay has pointerEvents: none)
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      setScreenshots(prev => prev.map(s => 
        s.id === isDragging
          ? { ...s, x: x - dragOffset.x, y: y - dragOffset.y }
          : s
      ));
    };

    const handleGlobalMouseUp = () => {
      setIsDragging(null);
    };

    // Add global listeners
    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent text selection
    console.log('=== MOUSE DOWN EVENT ===');
    console.log('isActive:', isActive);
    console.log('containerRef.current:', !!containerRef.current);
    console.log('isSelecting:', isSelecting);
    
    if (!isActive || !containerRef.current) {
      console.log('Early return - not active or no container');
      return;
    }
    
    // ONLY SNIPPING MODE - BLOCK ALL OTHER FUNCTIONALITY
    if (isSelecting) {
      console.log('Snipping mode is active - starting selection from mouse position');
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log('Snipping selection started at mouse position:', x, y);
      
      // Set both start and end to the same initial position
      setSelectionStart({ x, y });
      setSelectionEnd({ x, y });
      console.log('Selection start/end set to mouse position');
      return; // STOP HERE - NO OTHER FUNCTIONALITY
    }
    
    // DRAG & DROP FOR SCREENSHOTS (when not in snipping mode)
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on a screenshot for drag
    const clickedScreenshot = screenshots.find(s => 
      x >= s.x && x <= s.x + s.width &&
      y >= s.y && y <= s.y + s.height
    );
    
    if (clickedScreenshot) {
      console.log('Clicked on screenshot:', clickedScreenshot.title);
      setIsDragging(clickedScreenshot.id);
      setDragOffset({
        x: x - clickedScreenshot.x,
        y: y - clickedScreenshot.y
      });
      return;
    }
    
    console.log('Not in snipping mode - blocking interaction');
    // BLOCK ALL OTHER INTERACTIONS WHEN SNIPPING MODE IS ACTIVE
    return;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    console.log('=== MOUSE MOVE EVENT ===');
    console.log('isSelecting:', isSelecting);
    console.log('isDragging:', isDragging);
    
    if (!isActive || !containerRef.current) return;
    
    // SNIPPING MODE
    if (isSelecting) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log('Snipping selection updating to:', x, y);
      setSelectionEnd({ x, y });
      return; // STOP HERE - NO OTHER FUNCTIONALITY
    }
    
    // DRAG & DROP FOR SCREENSHOTS
    if (isDragging) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      console.log('Dragging screenshot to:', x, y);
      
      setScreenshots(prev => prev.map(s => 
        s.id === isDragging 
          ? { ...s, x: x - dragOffset.x, y: y - dragOffset.y }
          : s
      ));
      return;
    }
    
    console.log('Not in snipping mode - blocking interaction');
    // BLOCK ALL OTHER INTERACTIONS WHEN SNIPPING MODE IS ACTIVE
    return;
  };
  
  // @ts-ignore: Kept for future use — screenshot-from-selection utility
  const _createScreenshotFromSelection = async () => {
    console.log('=== CREATING SCREENSHOT FROM SELECTION ===');
    
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    console.log('Selection dimensions:', { width, height });
    
    if (width > 10 && height > 10) { // Minimum size threshold
      try {
        console.log('Creating screenshot from selection:', { width, height });
        
        // Use html2canvas for real screenshot
        const canvas = await html2canvas(document.body, {
          x: Math.min(selectionStart.x, selectionEnd.x) + (window.scrollX || window.pageXOffset || 0),
          y: Math.min(selectionStart.y, selectionEnd.y) + (window.scrollY || window.pageYOffset || 0),
          width: width,
          height: height,
          useCORS: true,
          allowTaint: true
        });
        
        const imageData = canvas.toDataURL('image/png');
        
        // AUTO-COPY TO CLIPBOARD for pasting outside the app
        try {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const clipboardItem = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([clipboardItem]);
              console.log('Screenshot copied to clipboard! You can paste it anywhere.');
            }
          }, 'image/png');
        } catch (clipboardError) {
          console.warn('Could not copy to clipboard:', clipboardError);
        }
        
        const newScreenshot: ScreenshotItem = {
          id: Date.now().toString(),
          imageData,
          x: Math.min(selectionStart.x, selectionEnd.x),
          y: Math.min(selectionStart.y, selectionEnd.y),
          width,
          height,
          title: `Screenshot ${screenshots.length + 1}`
        };
        
        setScreenshots(prev => [...prev, newScreenshot]);
        console.log('Screenshot created and copied to clipboard!');
        
        // Reset snipping mode after successful screenshot
        setIsSelecting(false);
        setSelectionStart({ x: 0, y: 0 });
        setSelectionEnd({ x: 0, y: 0 });
        console.log('Snipping mode deactivated after screenshot');
        
      } catch (error) {
        console.error('Failed to create screenshot:', error);
        // Fallback to placeholder
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.fillStyle = '#6366f1';
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px Arial';
          ctx.fillText('Screenshot Area', 10, height / 2);
          
          const imageData = canvas.toDataURL();
          
          const newScreenshot: ScreenshotItem = {
            id: Date.now().toString(),
            imageData,
            x: Math.min(selectionStart.x, selectionEnd.x),
            y: Math.min(selectionStart.y, selectionEnd.y),
            width,
            height,
            title: `Screenshot ${screenshots.length + 1}`
          };
          
          setScreenshots(prev => [...prev, newScreenshot]);
          console.log('Fallback screenshot created');
          
          // Reset snipping mode after fallback screenshot
          setIsSelecting(false);
          setSelectionStart({ x: 0, y: 0 });
          setSelectionEnd({ x: 0, y: 0 });
        }
      }
    }
  };

  const handleMouseUp = async () => {
    console.log('=== MOUSE UP EVENT ===');
    console.log('isSelecting:', isSelecting);
    console.log('isDragging:', isDragging);
    console.log('selectionStart:', selectionStart);
    console.log('selectionEnd:', selectionEnd);
    
    if (!isActive) return;
    
    // SNIPPING MODE - CREATE SCREENSHOT
    if (isSelecting && containerRef.current) {
      console.log('Snipping selection ended - creating screenshot');
      
      // Create screenshot from selection
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      
      console.log('Selection dimensions:', { width, height });
      
      if (width > 10 && height > 10) { // Minimum size threshold
        try {
          console.log('Creating screenshot from selection:', { width, height });
          
          // Use html2canvas for real screenshot
          const canvas = await html2canvas(document.body, {
            x: Math.min(selectionStart.x, selectionEnd.x) + (window.scrollX || window.pageXOffset || 0),
            y: Math.min(selectionStart.y, selectionEnd.y) + (window.scrollY || window.pageYOffset || 0),
            width: width,
            height: height,
            useCORS: true,
            allowTaint: true
          });
          
          const imageData = canvas.toDataURL('image/png');
          
          // AUTO-COPY TO CLIPBOARD for pasting outside the app
          try {
            canvas.toBlob(async (blob) => {
              if (blob) {
                const clipboardItem = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([clipboardItem]);
                console.log('✅ Screenshot copied to clipboard! You can paste it anywhere (Ctrl+V).');
              }
            }, 'image/png');
          } catch (clipboardError) {
            console.warn('Could not copy to clipboard:', clipboardError);
          }
          
          const newScreenshot: ScreenshotItem = {
            id: Date.now().toString(),
            imageData,
            x: Math.min(selectionStart.x, selectionEnd.x),
            y: Math.min(selectionStart.y, selectionEnd.y),
            width,
            height,
            title: `Screenshot ${screenshots.length + 1}`
          };
          
          setScreenshots(prev => [...prev, newScreenshot]);
          console.log('Screenshot created and copied to clipboard!');
        } catch (error) {
          console.error('Failed to create screenshot:', error);
          // Fallback to placeholder
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.fillStyle = '#6366f1';
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px Arial';
            ctx.fillText('Screenshot Area', 10, height / 2);
            
            const imageData = canvas.toDataURL();
            
            // AUTO-COPY FALLBACK TO CLIPBOARD
            try {
              canvas.toBlob(async (blob) => {
                if (blob) {
                  const clipboardItem = new ClipboardItem({ 'image/png': blob });
                  await navigator.clipboard.write([clipboardItem]);
                  console.log('✅ Fallback screenshot copied to clipboard!');
                }
              }, 'image/png');
            } catch (clipboardError) {
              console.warn('Could not copy fallback to clipboard:', clipboardError);
            }
            
            const newScreenshot: ScreenshotItem = {
              id: Date.now().toString(),
              imageData,
              x: Math.min(selectionStart.x, selectionEnd.x),
              y: Math.min(selectionStart.y, selectionEnd.y),
              width,
              height,
              title: `Screenshot ${screenshots.length + 1}`
            };
            
            setScreenshots(prev => [...prev, newScreenshot]);
            console.log('Fallback screenshot created and copied!');
          }
        }
      } else {
        console.log('Selection too small - ignoring');
      }
      
      setIsSelecting(false);
      setSelectionStart({ x: 0, y: 0 });
      setSelectionEnd({ x: 0, y: 0 });
      console.log('Snipping mode deactivated');
      return; // STOP HERE - NO OTHER FUNCTIONALITY
    }
    
    // DRAG MODE - STOP DRAGGING
    if (isDragging) {
      console.log('Stopping drag for screenshot:', isDragging);
      setIsDragging(null);
      return;
    }
    
    console.log('Not in snipping mode - blocking interaction');
    // BLOCK ALL OTHER INTERACTIONS WHEN SNIPPING MODE IS ACTIVE
    return;
  };

  const handleCopyCoordinates = (screenshot: ScreenshotItem) => {
    const coordsText = `${screenshot.title}: { x: ${Math.round(screenshot.x)}, y: ${Math.round(screenshot.y)}, width: ${Math.round(screenshot.width)}, height: ${Math.round(screenshot.height)} }`;
    navigator.clipboard.writeText(coordsText).then(() => {
      console.log('Screenshot coordinates copied:', coordsText);
    });
  };

  const handleDeleteScreenshot = (id: string) => {
    setScreenshots(prev => prev.filter(s => s.id !== id));
  };

  const handleExportAll = () => {
    if (onCoordinatesExport) {
      onCoordinatesExport(screenshots);
    }
  };

  const handleClearAll = () => {
    setScreenshots([]);
  };

  const handleCropStart = (screenshotId: string) => {
    setCropMode(screenshotId);
    setIsCropping(true);
    setCropSelection({ x: 0, y: 0, width: 0, height: 0 });
  };

  const handleCropImage = (screenshotId: string) => {
    const screenshot = screenshots.find(s => s.id === screenshotId);
    if (!screenshot || cropSelection.width < 10 || cropSelection.height < 10) return;

    // Create canvas for cropping
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cropSelection.width;
      canvas.height = cropSelection.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw cropped portion
        ctx.drawImage(
          img,
          cropSelection.x,
          cropSelection.y,
          cropSelection.width,
          cropSelection.height,
          0,
          0,
          cropSelection.width,
          cropSelection.height
        );
        
        const croppedImageData = canvas.toDataURL('image/png');
        
        // AUTO-COPY CROPPED IMAGE TO CLIPBOARD
        try {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const clipboardItem = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([clipboardItem]);
              console.log('Cropped image copied to clipboard! You can paste it anywhere.');
            }
          }, 'image/png');
        } catch (clipboardError) {
          console.warn('Could not copy cropped image to clipboard:', clipboardError);
        }
        
        // Create new cropped screenshot item
        const croppedScreenshot: ScreenshotItem = {
          id: Date.now().toString(),
          imageData: croppedImageData,
          x: screenshot.x + cropSelection.x,
          y: screenshot.y + cropSelection.y,
          width: cropSelection.width,
          height: cropSelection.height,
          title: `${screenshot.title} - Cropped`,
          isCropped: true,
          originalData: screenshot.imageData
        };
        
        setScreenshots(prev => [...prev, croppedScreenshot]);
        setCropMode(null);
        setIsCropping(false);
      }
    };
    
    img.src = screenshot.imageData;
  };

  const handleCropCancel = () => {
    setCropMode(null);
    setIsCropping(false);
    setCropSelection({ x: 0, y: 0, width: 0, height: 0 });
  };

  if (!isActive) {
    return (
      <button
        className="screenshot-toggle-btn"
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: '16px',
          right: '24px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          border: 'none',
          outline: '0 none transparent',
          outlineOffset: '0',
          color: 'white',
          padding: '12px',
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 100000,
          boxShadow: '0 4px 16px rgba(99, 102, 241, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '48px',
          height: '48px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = 'none';
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(99, 102, 241, 0.4)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = '0 none transparent';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.3)';
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        title="Screenshot Mode"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: 'block' }}>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
      </button>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Screenshot Mode Controls */}
      <div className="screenshot-controls" style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        zIndex: 100000, // ABOVE the overlay
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <button
          onClick={onToggle}
          style={{
            background: '#ef4444',
            border: 'none',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          ❌ Exit Mode
        </button>
        
        <div style={{ color: 'white', fontSize: '12px', textAlign: 'center' }}>
          📸 Screenshot Mode Active
        </div>
        
        {/* Crop Tool Section */}
        <div style={{
          background: cropMode ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.2)',
          border: cropMode ? '2px solid rgba(245, 158, 11, 0.8)' : '1px solid rgba(245, 158, 11, 0.5)',
          borderRadius: '6px',
          padding: '8px',
          marginTop: '8px',
          transition: 'all 0.3s ease'
        }}>
          <div style={{ color: '#f59e0b', fontSize: '11px', fontWeight: '600', textAlign: 'center', marginBottom: '6px' }}>
            ✂️ CROP TOOL
          </div>
          <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '9px', textAlign: 'center', marginBottom: '6px' }}>
            1. Create screenshot<br/>
            2. Click ✂️ CROP on screenshot<br/>
            3. Select area & crop
          </div>
          
          {/* Paint Mode Indicator */}
          {isSelecting && (
            <div style={{
              background: 'rgba(99, 102, 241, 0.4)',
              border: '2px solid rgba(99, 102, 241, 0.8)',
              borderRadius: '4px',
              padding: '6px',
              marginBottom: '6px'
            }}>
              <div style={{ color: '#6366f1', fontSize: '10px', fontWeight: '600', textAlign: 'center' }}>
                🎨 PAINT MODE ACTIVE
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '8px', textAlign: 'center', marginTop: '2px' }}>
                Click & drag to select area
              </div>
            </div>
          )}
          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexDirection: 'column' }}>
            <button
              onClick={() => {
                console.log('=== SNIPPING BUTTON CLICKED ===');
                console.log('Current isSelecting state:', isSelecting);
                console.log('Setting isSelecting to true');
                
                // Activate snipping mode
                setIsSelecting(true);
                setSelectionStart({ x: 0, y: 0 });
                setSelectionEnd({ x: 0, y: 0 });
                
                console.log('Snipping mode activated - isSelecting should now be true');
                
                // Force a re-render
                setTimeout(() => {
                  console.log('Timeout check - isSelecting is now:', isSelecting);
                }, 100);
              }}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: '2px solid #f59e0b',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '700',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.6)',
                width: '100%',
                textAlign: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.8)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.6)';
              }}
            >
              ✂️ START SNIPPING
            </button>
            {isSelecting && (
              <button
                onClick={() => {
                  console.log('Paint mode cancelled');
                  setIsSelecting(false);
                  setSelectionStart({ x: 0, y: 0 });
                  setSelectionEnd({ x: 0, y: 0 });
                }}
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  border: '2px solid #6366f1',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                ❌ CANCEL SNIPPING
              </button>
            )}
            {cropMode && (
              <button
                onClick={handleCropCancel}
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: '2px solid #ef4444',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.4)',
                  width: '100%',
                  textAlign: 'center'
                }}
              >
                ❌ CANCEL CROP
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={handleClearAll}
          style={{
            background: '#f59e0b',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          🗑️ Clear All
        </button>
        
        <button
          onClick={handleExportAll}
          style={{
            background: '#10b981',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📋 Export All
        </button>
        
        {/* COPY LAST SCREENSHOT TO CLIPBOARD - Prominent Button */}
        {screenshots.length > 0 && (
          <button
            onClick={async () => {
              const lastScreenshot = screenshots[screenshots.length - 1];
              try {
                const response = await fetch(lastScreenshot.imageData);
                const blob = await response.blob();
                const clipboardItem = new ClipboardItem({ 'image/png': blob });
                await navigator.clipboard.write([clipboardItem]);
                console.log('✅ Last screenshot copied to clipboard!');
                alert('✅ Screenshot copied! You can now paste it anywhere (Ctrl+V)');
              } catch (err) {
                console.error('Failed to copy:', err);
                alert('❌ Failed to copy. Try again.');
              }
            }}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              border: '2px solid #8b5cf6',
              color: 'white',
              padding: '10px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.5)',
              width: '100%',
              textAlign: 'center',
              marginTop: '8px'
            }}
          >
            📋 COPY TO CLIPBOARD
          </button>
        )}
        
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', textAlign: 'center' }}>
          Click & drag to select area<br/>
          Drag screenshots to move<br/>
          ✂️ Use Crop Tool on screenshots
        </div>
        
        {/* Crop Mode Indicator */}
        {cropMode && (
          <div style={{
            background: 'rgba(245, 158, 11, 0.2)',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '4px',
            padding: '8px',
            marginTop: '8px'
          }}>
            <div style={{ color: '#f59e0b', fontSize: '11px', fontWeight: '600', textAlign: 'center' }}>
              ✂️ CROP MODE ACTIVE
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '9px', textAlign: 'center', marginTop: '4px' }}>
              Click & drag on screenshot to crop
            </div>
            <button
              onClick={handleCropCancel}
              style={{
                background: '#ef4444',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '9px',
                width: '100%',
                marginTop: '4px'
              }}
            >
              Exit Crop Mode
            </button>
          </div>
        )}
      </div>

      {/* Screenshot Container - FULL SCREEN OVERLAY */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => console.log('=== CONTAINER CLICKED ===')}
        style={{
          position: 'fixed', // Fixed positioning for full screen coverage
          top: 0,
          left: 0,
          width: '100vw', // Full viewport width
          height: '100vh', // Full viewport height
          cursor: cropMode ? 'crosshair' : isSelecting ? 'crosshair' : 'default',
          zIndex: 99999, // MAXIMUM to cover ALL sidebars, modals, and content
          backgroundColor: isSelecting ? 'rgba(99, 102, 241, 0.15)' : 'transparent', // Slightly stronger tint
          // Only capture events when actively snipping, otherwise let events pass through for drag & drop
          pointerEvents: isSelecting || cropMode ? 'auto' : 'none',
        }}
      >
        {/* Selection rectangle for snipping */}
        {isSelecting && selectionStart.x !== 0 && selectionEnd.x !== 0 && (
          <div
            className="selection-rect"
            style={{
              position: 'absolute',
              border: '2px dashed #ffffff',
              backgroundColor: 'rgba(99, 102, 241, 0.2)',
              pointerEvents: 'none',
              zIndex: 10001,
              left: Math.min(selectionStart.x, selectionEnd.x),
              top: Math.min(selectionStart.y, selectionEnd.y),
              width: Math.abs(selectionEnd.x - selectionStart.x),
              height: Math.abs(selectionEnd.y - selectionStart.y),
            }}
          />
        )}

        {/* Screenshots */}
        {screenshots.map((screenshot) => (
          <div
            key={screenshot.id}
            style={{
              position: 'absolute',
              left: screenshot.x,
              top: screenshot.y,
              width: screenshot.width,
              height: screenshot.height,
              border: showCoordinates === screenshot.id ? '3px solid #10b981' : '2px solid #6366f1',
              borderRadius: '4px',
              cursor: cropMode === screenshot.id ? 'crosshair' : 'move',
              overflow: 'hidden',
              // CRITICAL: Screenshots must capture events even when parent overlay has pointerEvents: none
              pointerEvents: 'auto',
              zIndex: 100000, // Above the overlay to ensure screenshots are always on top
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (cropMode === screenshot.id) {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  setCropSelection({
                    x: x - screenshot.x,
                    y: y - screenshot.y,
                    width: 0,
                    height: 0
                  });
                  setIsCropping(true);
                }
              } else {
                const rect = containerRef.current?.getBoundingClientRect();
                if (rect) {
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  setIsDragging(screenshot.id);
                  setDragOffset({
                    x: x - screenshot.x,
                    y: y - screenshot.y
                  });
                }
              }
            }}
          >
            {/* Screenshot Image */}
            <img
              src={screenshot.imageData}
              alt={screenshot.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                pointerEvents: 'none'
              }}
            />
            
            {/* Crop Selection Rectangle */}
            {cropMode === screenshot.id && isCropping && (
              <div
                style={{
                  position: 'absolute',
                  left: cropSelection.x,
                  top: cropSelection.y,
                  width: cropSelection.width,
                  height: cropSelection.height,
                  border: '2px dashed #10b981',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  pointerEvents: 'none',
                  zIndex: 1000
                }}
              />
            )}
            
            {/* Screenshot Controls */}
            <div
              style={{
                position: 'absolute',
                top: '-50px',
                left: '0',
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '12px',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                zIndex: 10002,
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              <span>{screenshot.title}</span>
              {cropMode === screenshot.id ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCropImage(screenshot.id);
                    }}
                    style={{
                      background: 'rgba(16, 185, 129, 0.8)',
                      border: 'none',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '9px'
                    }}
                  >
                    ✂️ Crop
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCropCancel();
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.8)',
                      border: 'none',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '9px'
                    }}
                  >
                    ❌ Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCropStart(screenshot.id);
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '600',
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.6)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(245, 158, 11, 0.4)';
                    }}
                  >
                    ✂️ CROP
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCoordinates(showCoordinates === screenshot.id ? null : screenshot.id);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '9px'
                    }}
                  >
                    📍
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyCoordinates(screenshot);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '9px'
                    }}
                    title="Copy coordinates"
                  >
                    📍
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      // Manual copy image to clipboard
                      try {
                        const response = await fetch(screenshot.imageData);
                        const blob = await response.blob();
                        const clipboardItem = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([clipboardItem]);
                        console.log('✅ Screenshot copied to clipboard!');
                      } catch (err) {
                        console.error('Failed to copy image:', err);
                      }
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: '600'
                    }}
                    title="Copy image to clipboard"
                  >
                    📋 Copy
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteScreenshot(screenshot.id);
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.8)',
                      border: 'none',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '2px',
                      cursor: 'pointer',
                      fontSize: '9px'
                    }}
                  >
                    ❌
                  </button>
                </>
              )}
            </div>
            
            {/* Coordinates Display */}
            {showCoordinates === screenshot.id && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '-30px',
                  left: '0',
                  background: 'rgba(16, 185, 129, 0.9)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  zIndex: 10001
                }}
              >
                x: {Math.round(screenshot.x)}, y: {Math.round(screenshot.y)}<br/>
                w: {Math.round(screenshot.width)}, h: {Math.round(screenshot.height)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
