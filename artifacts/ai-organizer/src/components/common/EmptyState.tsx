/**
 * EmptyState Component - Polished empty state display
 * Semantic design tokens, responsive support & consistent theming
 */

import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  style, 
  className = '', 
  children 
}: EmptyStateProps) {
  return (
    <div
      className={`
        bg-gradient-to-br from-card/80 to-background/80
        backdrop-blur-xl
        border border-border/50
        rounded-2xl
        p-8 sm:p-12
        text-center
        animate-fade-in
        ${className}
      `}
      style={style}
    >
      {icon && (
        <div className="text-4xl sm:text-5xl mb-4 opacity-70 animate-in fade-in-0 zoom-in-95 duration-500">
          {icon}
        </div>
      )}
      
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
        {title}
      </h2>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      )}
      
      {children && (
        <div className="mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      )}
    </div>
  );
}
