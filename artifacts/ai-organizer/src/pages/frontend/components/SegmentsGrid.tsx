import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { SegmentRow } from "../../../hooks/home/useHomeState";
import { useTheme } from "../../../context/ThemeContext";

type SegmentsGridProps = {
  segments: SegmentRow[];
  onPick: (segment: SegmentRow) => void;
  onDoubleClick: (segment: SegmentRow) => void;
};

export function SegmentsGrid({
  segments,
  onPick,
  onDoubleClick,
}: SegmentsGridProps) {
  const { isDark } = useTheme();

  return (
    <div className="segmentsGrid">
      {segments.map((segment) => (
        <div
          key={segment.id}
          className="segmentCard"
          onClick={() => onPick(segment)}
          onDoubleClick={() => onDoubleClick(segment)}
          style={{
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(47, 41, 65, 0.1)'}`,
            borderRadius: '16px',
            padding: '16px',
            background: isDark 
              ? 'linear-gradient(145deg, rgba(16, 20, 30, 0.9) 0%, rgba(10, 14, 22, 0.95) 100%)'
              : 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 248, 252, 0.95) 100%)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '200px',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backdropFilter: 'blur(12px)',
            boxShadow: isDark
              ? '0 12px 36px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 12px 36px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.4)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 16px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
              : '0 16px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(47, 41, 65, 0.1)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = isDark
              ? '0 12px 36px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              : '0 12px 36px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
          }}>
            <span style={{ fontSize: '18px' }}>🧩</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: 600,
                color: isDark ? 'rgba(255, 255, 255, 0.9)' : '#2f2941',
                letterSpacing: '-0.01em',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {segment.title || `Segment ${segment.id}`}
              </h3>
              {segment.mode && (
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '11px',
                  color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(47, 41, 65, 0.6)',
                  fontWeight: 500,
                }}>
                  {segment.mode}
                </p>
              )}
            </div>
          </div>
          
          <div style={{
            flex: 1,
            overflow: 'hidden',
            fontSize: '12px',
            lineHeight: '1.5',
            color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(47, 41, 65, 0.7)',
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                p: ({ children }) => <p style={{ margin: '0 0 8px 0' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ margin: '0 0 8px 0', paddingLeft: '16px' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '0 0 8px 0', paddingLeft: '16px' }}>{children}</ol>,
                li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                code: ({ node, inline, children, ...props }: any) => 
                  inline ? (
                    <code style={{
                      background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(47, 41, 65, 0.1)',
                      padding: '2px 4px',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }} {...props}>{children}</code>
                  ) : (
                    <code style={{
                      display: 'block',
                      background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(47, 41, 65, 0.05)',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      overflow: 'auto',
                      margin: '8px 0',
                    }} {...props}>{children}</code>
                  )
              }}
            >
              {segment.content?.length > 200 
                ? segment.content.substring(0, 200) + '...' 
                : segment.content || ''
              }
            </ReactMarkdown>
          </div>
        </div>
      ))}
    </div>
  );
}
