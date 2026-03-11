import { useState, useEffect } from "react";

type CompareChunk = {
  id: string;
  title: string;
  content: string;
  slotId: string;
};

type LayoutMode = '2-vertical' | '2-horizontal' | '3-vertical' | '3-horizontal' | '4-grid';

type EnhancedCompareModalProps = {
  chunks: CompareChunk[];
  isOpen: boolean;
  onClose: () => void;
  onSwapChunks?: (chunk1Id: string, chunk2Id: string) => void;
};

export function EnhancedCompareModal({ chunks, isOpen, onClose, onSwapChunks }: EnhancedCompareModalProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('2-vertical');
  const [showDiff, setShowDiff] = useState(false);
  const [diffMode, setDiffMode] = useState<'side-by-side' | 'unified'>('side-by-side');

  // Auto-detect layout based on chunk count
  useEffect(() => {
    if (chunks.length === 2) {
      setLayoutMode('2-vertical');
    } else if (chunks.length === 3) {
      setLayoutMode('3-vertical');
    } else if (chunks.length === 4) {
      setLayoutMode('4-grid');
    }
  }, [chunks.length]);

  const getLayoutClass = () => {
    switch (layoutMode) {
      case '2-vertical': return 'compareGrid2Vertical';
      case '2-horizontal': return 'compareGrid2Horizontal';
      case '3-vertical': return 'compareGrid3Vertical';
      case '3-horizontal': return 'compareGrid3Horizontal';
      case '4-grid': return 'compareGrid4Grid';
      default: return 'compareGrid2Vertical';
    }
  };

  const calculateDiff = (text1: string, text2: string) => {
    const lines1 = text1.split('\n');
    const lines2 = text2.split('\n');
    
    const diff: Array<{line: string; type: 'added' | 'removed' | 'unchanged'; lineNumber?: number}> = [];
    
    // Simple diff algorithm - can be enhanced with proper diff library
    const maxLines = Math.max(lines1.length, lines2.length);
    
    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';
      
      if (line1 === line2) {
        diff.push({ line: line1, type: 'unchanged', lineNumber: i + 1 });
      } else {
        if (line1) diff.push({ line: line1, type: 'removed', lineNumber: i + 1 });
        if (line2) diff.push({ line: line2, type: 'added', lineNumber: i + 1 });
      }
    }
    
    return diff;
  };

  const getDiffLines = (chunk1: CompareChunk, chunk2: CompareChunk) => {
    if (!showDiff || chunks.length !== 2) return null;
    
    const diff = calculateDiff(chunk1.content, chunk2.content);
    
    if (diffMode === 'unified') {
      return (
        <div className="diffUnified">
          {diff.map((item, index) => (
            <div key={index} className={`diffLine diffLine-${item.type}`}>
              <span className="diffLineNumber">{item.lineNumber}</span>
              <span className="diffContent">{item.line || ' '}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  const renderChunk = (chunk: CompareChunk, index: number) => {
    const lines = chunk.content.split('\n');
    
    return (
      <div key={chunk.id} className="compareChunk">
        <div className="compareChunkHeader">
          <div className="compareChunkTitle">{chunk.title}</div>
          <div className="compareChunkActions">
            <button 
              className="compareChunkBtn"
              onClick={() => navigator.clipboard.writeText(chunk.content)}
              title="Copy content"
            >
              📋
            </button>
            {onSwapChunks && index > 0 && (
              <button 
                className="compareChunkBtn"
                onClick={() => onSwapChunks(chunks[0].id, chunk.id)}
                title="Swap with first"
              >
                🔄
              </button>
            )}
          </div>
        </div>
        <div className="compareChunkContent">
          {showDiff && chunks.length === 2 && index === 0 ? (
            <div className="diffSideBySide">
              {lines.map((line, lineIndex) => {
                const otherChunk = chunks[1];
                const otherLines = otherChunk.content.split('\n');
                const otherLine = otherLines[lineIndex];
                
                let lineClass = 'diffLine-unchanged';
                if (line !== otherLine) {
                  lineClass = otherLine ? 'diffLine-modified' : 'diffLine-removed';
                }
                
                return (
                  <div key={lineIndex} className={`diffLine ${lineClass}`}>
                    <span className="diffLineNumber">{lineIndex + 1}</span>
                    <span className="diffContent">{line}</span>
                  </div>
                );
              })}
            </div>
          ) : showDiff && chunks.length === 2 && index === 1 ? (
            <div className="diffSideBySide">
              {lines.map((line, lineIndex) => {
                const firstChunk = chunks[0];
                const firstLines = firstChunk.content.split('\n');
                const firstLine = firstLines[lineIndex];
                
                let lineClass = 'diffLine-unchanged';
                if (line !== firstLine) {
                  lineClass = firstLine ? 'diffLine-modified' : 'diffLine-added';
                }
                
                return (
                  <div key={lineIndex} className={`diffLine ${lineClass}`}>
                    <span className="diffLineNumber">{lineIndex + 1}</span>
                    <span className="diffContent">{line}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="compareLines">
              {lines.map((line, lineIndex) => (
                <div key={lineIndex} className="compareLine">
                  <span className="compareLineNumber">{lineIndex + 1}</span>
                  <span className="compareLineContent">{line}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (chunks.length === 0) return null;

  if (!isOpen) return null;

  return (
    <div className="enhancedCompareOverlay">
      <div className="enhancedCompareModal">
        <div className="compareModalHeader">
          <div className="compareModalTitle">
            Enhanced Compare ({chunks.length} chunks)
          </div>
          <div className="compareModalControls">
            {chunks.length === 2 && (
              <>
                <button 
                  className={`compareControlBtn ${showDiff ? 'active' : ''}`}
                  onClick={() => setShowDiff(!showDiff)}
                >
                  {showDiff ? 'Hide Diff' : 'Show Diff'}
                </button>
                {showDiff && (
                  <select 
                    className="compareControlSelect"
                    value={diffMode}
                    onChange={(e) => setDiffMode(e.target.value as 'side-by-side' | 'unified')}
                  >
                    <option value="side-by-side">Side by Side</option>
                    <option value="unified">Unified</option>
                  </select>
                )}
              </>
            )}
            
            {chunks.length === 2 && (
              <>
                <button 
                  className={`compareControlBtn ${layoutMode === '2-vertical' ? 'active' : ''}`}
                  onClick={() => setLayoutMode('2-vertical')}
                >
                  Vertical
                </button>
                <button 
                  className={`compareControlBtn ${layoutMode === '2-horizontal' ? 'active' : ''}`}
                  onClick={() => setLayoutMode('2-horizontal')}
                >
                  Horizontal
                </button>
              </>
            )}
            
            {chunks.length === 3 && (
              <>
                <button 
                  className={`compareControlBtn ${layoutMode === '3-vertical' ? 'active' : ''}`}
                  onClick={() => setLayoutMode('3-vertical')}
                >
                  Vertical
                </button>
                <button 
                  className={`compareControlBtn ${layoutMode === '3-horizontal' ? 'active' : ''}`}
                  onClick={() => setLayoutMode('3-horizontal')}
                >
                  Horizontal
                </button>
              </>
            )}
            
            <button className="compareControlBtn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        
        {showDiff && chunks.length === 2 && diffMode === 'unified' ? (
          <div className="compareModalBody">
            {getDiffLines(chunks[0], chunks[1])}
          </div>
        ) : (
          <div className={`compareModalBody ${getLayoutClass()}`}>
            {chunks.map((chunk, index) => renderChunk(chunk, index))}
          </div>
        )}
      </div>
    </div>
  );
}
