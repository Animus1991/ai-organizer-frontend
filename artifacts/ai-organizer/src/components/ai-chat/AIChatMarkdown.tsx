/**
 * AIChatMarkdown - Markdown renderer for AI chat messages
 * Renders markdown with code highlighting, LaTeX, tables, and links
 */
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface AIChatMarkdownProps {
  content: string;
  isUser?: boolean;
}

// Simple syntax highlighting for code blocks
function highlightCode(code: string, language?: string): string {
  const keywords = [
    'import', 'from', 'export', 'default', 'const', 'let', 'var', 'function',
    'return', 'if', 'else', 'for', 'while', 'class', 'extends', 'new', 'this',
    'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
    'def', 'self', 'print', 'True', 'False', 'None', 'lambda', 'yield',
    'int', 'float', 'str', 'list', 'dict', 'tuple', 'set', 'bool',
  ];

  return code
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g, '<span style="color:hsl(142 71% 55%)">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span style="color:hsl(38 92% 60%)">$1</span>')
    .replace(/(\/\/.*$|#.*$)/gm, '<span style="color:hsl(var(--muted-foreground))">$1</span>')
    .replace(
      new RegExp(`\\b(${keywords.join('|')})\\b`, 'g'),
      '<span style="color:hsl(262 83% 68%);font-weight:600">$1</span>'
    );
}

export function AIChatMarkdown({ content, isUser = false }: AIChatMarkdownProps) {
  // Check if content is an error message
  const isError = content.startsWith('❌') || content.startsWith('🔌') || content.startsWith('⏱️') || content.startsWith('💳');

  if (isError) {
    return (
      <div style={{
        color: 'hsl(var(--destructive))',
        fontSize: '13px',
        padding: '4px 0',
        fontStyle: 'italic',
      }}>
        {content}
      </div>
    );
  }

  return (
    <div className="ai-chat-markdown" style={{ fontSize: '14px', lineHeight: 1.65 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Code blocks
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match?.[1];
            const codeStr = String(children).replace(/\n$/, '');
            
            // Inline code
            if (!match && !codeStr.includes('\n')) {
              return (
                <code
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'hsl(var(--muted) / 0.5)',
                    color: 'hsl(var(--primary))',
                    fontSize: '0.9em',
                    fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            
            // Block code
            return (
              <div style={{
                position: 'relative',
                margin: '8px 0',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid hsl(var(--border))',
              }}>
                {language && (
                  <div style={{
                    padding: '4px 10px',
                    background: 'hsl(var(--muted) / 0.5)',
                    fontSize: '10px',
                    fontWeight: 700,
                    color: 'hsl(var(--muted-foreground))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    borderBottom: '1px solid hsl(var(--border))',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <span>{language}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(codeStr)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'hsl(var(--muted-foreground))',
                        fontSize: '10px',
                        padding: '2px 4px',
                      }}
                    >
                      Copy
                    </button>
                  </div>
                )}
                <pre
                  style={{
                    margin: 0,
                    padding: '10px 12px',
                    background: 'hsl(var(--muted) / 0.2)',
                    overflowX: 'auto',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
                  }}
                >
                  <code
                    dangerouslySetInnerHTML={{ __html: highlightCode(codeStr, language || undefined) }}
                  />
                </pre>
              </div>
            );
          },
          // Tables
          table({ children }) {
            return (
              <div style={{ overflowX: 'auto', margin: '8px 0' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px',
                  overflow: 'hidden',
                }}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return (
              <thead style={{
                background: 'hsl(var(--muted) / 0.4)',
              }}>
                {children}
              </thead>
            );
          },
          th({ children }) {
            return (
              <th style={{
                padding: '6px 10px',
                textAlign: 'left',
                fontWeight: 700,
                borderBottom: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}>
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td style={{
                padding: '5px 10px',
                borderBottom: '1px solid hsl(var(--border) / 0.5)',
                color: 'hsl(var(--foreground) / 0.85)',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {children}
              </td>
            );
          },
          // Links
          a({ children, href }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'hsl(var(--primary))',
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(var(--primary) / 0.3)',
                  textUnderlineOffset: '2px',
                }}
              >
                {children}
              </a>
            );
          },
          // Paragraphs
          p({ children }) {
            return (
              <p style={{ margin: '4px 0', color: 'hsl(var(--foreground) / 0.95)' }}>
                {children}
              </p>
            );
          },
          // Lists
          ul({ children }) {
            return <ul style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ul>;
          },
          ol({ children }) {
            return <ol style={{ margin: '4px 0', paddingLeft: '18px' }}>{children}</ol>;
          },
          li({ children }) {
            return (
              <li style={{ margin: '2px 0', color: 'hsl(var(--foreground) / 0.9)' }}>
                {children}
              </li>
            );
          },
          // Headings
          h1({ children }) {
            return <h1 style={{ fontSize: '18px', fontWeight: 700, margin: '8px 0 4px', color: 'hsl(var(--foreground))' }}>{children}</h1>;
          },
          h2({ children }) {
            return <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '6px 0 4px', color: 'hsl(var(--foreground))' }}>{children}</h2>;
          },
          h3({ children }) {
            return <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '6px 0 2px', color: 'hsl(var(--foreground))' }}>{children}</h3>;
          },
          // Blockquote
          blockquote({ children }) {
            return (
              <blockquote style={{
                margin: '6px 0',
                padding: '6px 12px',
                borderLeft: '3px solid hsl(var(--primary) / 0.5)',
                background: 'hsl(var(--muted) / 0.2)',
                borderRadius: '0 6px 6px 0',
                fontStyle: 'italic',
                color: 'hsl(var(--foreground) / 0.8)',
              }}>
                {children}
              </blockquote>
            );
          },
          // Horizontal rule
          hr() {
            return <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid hsl(var(--border))' }} />;
          },
          // Strong/bold
          strong({ children }) {
            return <strong style={{ fontWeight: 700, color: 'hsl(var(--foreground))' }}>{children}</strong>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
