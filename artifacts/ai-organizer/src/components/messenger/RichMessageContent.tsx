/**
 * RichMessageContent - Renders LaTeX, code blocks, and data tables inline in chat
 * Detects patterns: $...$, $$...$$, ```lang...```, |table|format|
 */
import React from 'react';

interface RichMessageContentProps {
  content: string;
  isMine: boolean;
  searchHighlight?: string;
}

type ContentBlock =
  | { type: 'text'; content: string }
  | { type: 'latex-inline'; content: string }
  | { type: 'latex-block'; content: string }
  | { type: 'code'; content: string; language: string }
  | { type: 'table'; rows: string[][] };

// Syntax highlighting color map
const syntaxColors: Record<string, string> = {
  keyword: 'hsl(262 83% 65%)',
  string: 'hsl(142 71% 50%)',
  comment: 'hsl(var(--muted-foreground) / 0.6)',
  number: 'hsl(38 92% 55%)',
  function: 'hsl(200 80% 55%)',
  operator: 'hsl(0 84% 65%)',
};

// Simple syntax highlighter
function highlightSyntax(code: string, lang: string): React.ReactNode[] {
  const lines = code.split('\n');
  return lines.map((line, lineIdx) => {
    // Simple regex-based highlighting
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Comments
    const commentMatch = remaining.match(/^(\s*)(#.*|\/\/.*)$/);
    if (commentMatch) {
      tokens.push(
        <span key={`${lineIdx}-ws`}>{commentMatch[1]}</span>,
        <span key={`${lineIdx}-cm`} style={{ color: syntaxColors.comment, fontStyle: 'italic' }}>{commentMatch[2]}</span>
      );
      return <div key={lineIdx}>{tokens}</div>;
    }

    // Tokenize by patterns
    const regex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+\.?\d*\b|\b(?:def|class|return|import|from|if|else|elif|for|while|in|not|and|or|const|let|var|function|async|await|true|false|True|False|None|null|undefined)\b)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(remaining)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining.substring(lastIndex, match.index)}</span>);
      }
      const token = match[0];
      let color: string | undefined;
      if (/^["']/.test(token)) color = syntaxColors.string;
      else if (/^\d/.test(token)) color = syntaxColors.number;
      else color = syntaxColors.keyword;
      tokens.push(<span key={`${lineIdx}-${keyIdx++}`} style={{ color, fontWeight: color === syntaxColors.keyword ? 600 : undefined }}>{token}</span>);
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < remaining.length) {
      tokens.push(<span key={`${lineIdx}-${keyIdx++}`}>{remaining.substring(lastIndex)}</span>);
    }

    return <div key={lineIdx}>{tokens.length > 0 ? tokens : ' '}</div>;
  });
}

function parseContent(content: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    // Code block: ```lang\ncode\n```
    const codeMatch = remaining.match(/^```(\w*)\n([\s\S]*?)```/);
    if (codeMatch) {
      blocks.push({ type: 'code', content: codeMatch[2].trimEnd(), language: codeMatch[1] || 'text' });
      remaining = remaining.substring(codeMatch[0].length);
      continue;
    }

    // Block LaTeX: $$...$$
    const blockLatex = remaining.match(/^\$\$([\s\S]*?)\$\$/);
    if (blockLatex) {
      blocks.push({ type: 'latex-block', content: blockLatex[1].trim() });
      remaining = remaining.substring(blockLatex[0].length);
      continue;
    }

    // Table: lines with |...|
    const tableMatch = remaining.match(/^(\|[^\n]+\|\n?)+/);
    if (tableMatch) {
      const rows = tableMatch[0].trim().split('\n').map(row =>
        row.split('|').filter(cell => cell.trim() !== '' && !cell.match(/^[\s-]+$/)).map(c => c.trim())
      ).filter(r => r.length > 0);
      if (rows.length > 0) {
        blocks.push({ type: 'table', rows });
        remaining = remaining.substring(tableMatch[0].length);
        continue;
      }
    }

    // Find next special block
    const nextSpecial = remaining.search(/```|\$\$|\$[^$]|\|[^\n]+\|/);
    if (nextSpecial === -1) {
      // Check for inline LaTeX in remaining
      const parts = parseInlineLatex(remaining);
      blocks.push(...parts);
      break;
    } else if (nextSpecial === 0) {
      // Inline LaTeX: $...$
      const inlineLatex = remaining.match(/^\$([^$\n]+)\$/);
      if (inlineLatex) {
        blocks.push({ type: 'latex-inline', content: inlineLatex[1] });
        remaining = remaining.substring(inlineLatex[0].length);
        continue;
      }
      // No match, consume one character
      blocks.push({ type: 'text', content: remaining[0] });
      remaining = remaining.substring(1);
    } else {
      blocks.push({ type: 'text', content: remaining.substring(0, nextSpecial) });
      remaining = remaining.substring(nextSpecial);
    }
  }

  return blocks;
}

function parseInlineLatex(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  const regex = /\$([^$\n]+)\$/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    blocks.push({ type: 'latex-inline', content: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    blocks.push({ type: 'text', content: text.substring(lastIndex) });
  }
  if (blocks.length === 0) blocks.push({ type: 'text', content: text });
  return blocks;
}

function highlightText(text: string, highlight?: string): React.ReactNode {
  if (!highlight || !highlight.trim()) return text;
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === highlight.toLowerCase()
      ? <mark key={i} style={{ background: 'hsl(38 92% 50% / 0.3)', borderRadius: '2px', padding: '0 1px' }}>{part}</mark>
      : part
  );
}

export function RichMessageContent({ content, isMine, searchHighlight }: RichMessageContentProps) {
  const hasRichContent = /```|\$\$|\$[^$]/.test(content) || /\|[^\n]+\|/.test(content);
  
  if (!hasRichContent) {
    return <span>{highlightText(content, searchHighlight)}</span>;
  }

  const blocks = parseContent(content);

  return (
    <span>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <span key={i}>{highlightText(block.content, searchHighlight)}</span>;

          case 'latex-inline':
            return (
              <span key={i} style={{
                fontFamily: '"Cambria Math", "Latin Modern Math", Georgia, serif',
                fontStyle: 'italic',
                padding: '0 2px',
                color: isMine ? 'hsl(var(--primary-foreground))' : 'hsl(262 83% 58%)',
                fontSize: '0.95em',
              }}>
                {renderLatex(block.content)}
              </span>
            );

          case 'latex-block':
            return (
              <div key={i} style={{
                textAlign: 'center', padding: '8px 12px', margin: '4px 0',
                background: isMine ? 'hsl(var(--primary-foreground) / 0.1)' : 'hsl(var(--muted) / 0.4)',
                borderRadius: '6px', borderLeft: `3px solid ${isMine ? 'hsl(var(--primary-foreground) / 0.3)' : 'hsl(262 83% 58% / 0.4)'}`,
                fontFamily: '"Cambria Math", "Latin Modern Math", Georgia, serif',
                fontStyle: 'italic', fontSize: '1.05em',
                color: isMine ? 'hsl(var(--primary-foreground))' : 'hsl(262 83% 58%)',
              }}>
                {renderLatex(block.content)}
              </div>
            );

          case 'code':
            return (
              <div key={i} style={{
                margin: '4px 0', borderRadius: '6px', overflow: 'hidden',
                border: `1px solid ${isMine ? 'hsl(var(--primary-foreground) / 0.15)' : 'hsl(var(--border))'}`,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '2px 8px',
                  background: isMine ? 'hsl(var(--primary-foreground) / 0.1)' : 'hsl(var(--muted) / 0.6)',
                  fontSize: '9px', fontWeight: 600,
                  color: isMine ? 'hsl(var(--primary-foreground) / 0.6)' : 'hsl(var(--muted-foreground))',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  <span>{block.language}</span>
                  <span>📋</span>
                </div>
                <div style={{
                  padding: '8px 10px',
                  background: isMine ? 'hsl(220 20% 12%)' : 'hsl(220 20% 10%)',
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                  fontSize: '11.5px', lineHeight: '1.6',
                  color: '#e4e4e7',
                  overflowX: 'auto', whiteSpace: 'pre',
                }}>
                  {highlightSyntax(block.content, block.language)}
                </div>
              </div>
            );

          case 'table':
            return (
              <div key={i} style={{ margin: '4px 0', overflow: 'auto', borderRadius: '6px', border: `1px solid ${isMine ? 'hsl(var(--primary-foreground) / 0.15)' : 'hsl(var(--border))'}` }}>
                <table style={{
                  width: '100%', borderCollapse: 'collapse', fontSize: '11px',
                }}>
                  <thead>
                    <tr>
                      {block.rows[0]?.map((cell, ci) => (
                        <th key={ci} style={{
                          padding: '4px 8px', textAlign: 'left',
                          background: isMine ? 'hsl(var(--primary-foreground) / 0.1)' : 'hsl(var(--muted) / 0.6)',
                          color: isMine ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                          fontWeight: 700, borderBottom: `1px solid ${isMine ? 'hsl(var(--primary-foreground) / 0.15)' : 'hsl(var(--border))'}`,
                          whiteSpace: 'nowrap',
                        }}>
                          {cell}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.slice(1).map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{
                            padding: '3px 8px',
                            borderBottom: `1px solid ${isMine ? 'hsl(var(--primary-foreground) / 0.08)' : 'hsl(var(--border) / 0.5)'}`,
                            color: isMine ? 'hsl(var(--primary-foreground) / 0.9)' : 'hsl(var(--foreground))',
                            fontVariantNumeric: 'tabular-nums',
                          }}>
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
        }
      })}
    </span>
  );
}

/** Render LaTeX-like notation to styled spans (no external dep) */
function renderLatex(tex: string): React.ReactNode {
  // Simple LaTeX rendering: fractions, subscripts, superscripts, Greek letters
  let result = tex;
  const greekMap: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ',
    '\\pi': 'π', '\\sigma': 'σ', '\\omega': 'ω', '\\phi': 'φ',
    '\\psi': 'ψ', '\\rho': 'ρ', '\\tau': 'τ', '\\eta': 'η',
    '\\Delta': 'Δ', '\\Sigma': 'Σ', '\\Omega': 'Ω', '\\Pi': 'Π',
    '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
    '\\sum': 'Σ', '\\prod': 'Π', '\\int': '∫',
    '\\sqrt': '√', '\\pm': '±', '\\times': '×', '\\div': '÷',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
    '\\in': '∈', '\\forall': '∀', '\\exists': '∃',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\Rightarrow': '⇒',
    '\\cdot': '·', '\\ldots': '…', '\\cdots': '⋯',
  };

  // Replace Greek letters
  Object.entries(greekMap).forEach(([key, val]) => {
    result = result.split(key).join(val);
  });

  // Replace \frac{a}{b} → a/b
  result = result.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1/$2)');

  // Replace ^{...} → superscript notation
  result = result.replace(/\^{([^}]+)}/g, (_, p) => `⁽${p}⁾`);
  result = result.replace(/\^(\w)/g, (_, p) => {
    const sups: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', 'n': 'ⁿ', 'i': 'ⁱ', 'T': 'ᵀ' };
    return sups[p] || `^${p}`;
  });

  // Replace _{...} → subscript notation
  result = result.replace(/_{([^}]+)}/g, (_, p) => `₍${p}₎`);
  result = result.replace(/_(\w)/g, (_, p) => {
    const subs: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉', 'i': 'ᵢ', 'j': 'ⱼ', 'n': 'ₙ' };
    return subs[p] || `_${p}`;
  });

  // Clean up remaining braces
  result = result.replace(/[{}]/g, '');

  return result;
}
