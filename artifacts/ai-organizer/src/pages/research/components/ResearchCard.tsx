/**
 * ResearchCard Component - Polished card for research content
 * Semantic design tokens, responsive support & compact design
 */

import React from "react";

type ResearchCardProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  containerRef?: React.Ref<HTMLDivElement>;
  containerStyle?: React.CSSProperties;
  className?: string;
};

export function ResearchCard({
  title,
  subtitle,
  children,
  containerRef,
  containerStyle,
  className = '',
}: ResearchCardProps) {
  return (
    <div
      ref={containerRef}
      className={`
        min-w-0 w-full max-w-full
        overflow-wrap-anywhere
        p-4 sm:p-5
        rounded-2xl
        border border-border/50
        bg-gradient-to-br from-card/60 to-background/60
        backdrop-blur-sm
        shadow-md hover:shadow-lg
        transition-all duration-300
        animate-fade-in
        ${className}
      `}
      style={containerStyle}
    >
      {/* Header */}
      <div className="mb-3 sm:mb-4">
        <div className="font-bold text-base sm:text-lg text-foreground mb-1">
          {title}
        </div>
        <div className="text-xs sm:text-sm text-muted-foreground leading-snug">
          {subtitle}
        </div>
      </div>
      
      {/* Content */}
      <div className="text-sm">
        {children}
      </div>
    </div>
  );
}
