/**
 * Enhanced UI Components - Material Design 3 Implementation
 * Industry Standards 2024-2025
 */

import React, { forwardRef, ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';
import { designSystem } from '../../lib/designSystem';

// === BUTTON COMPONENT ===
interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          variant === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500',
          variant === 'secondary' && 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
          variant === 'outline' && 'border border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus-visible:ring-primary-500',
          variant === 'ghost' && 'text-neutral-100 hover:bg-neutral-800 focus-visible:ring-neutral-500',
          variant === 'link' && 'text-primary-600 underline hover:text-primary-700 focus-visible:ring-primary-500',
          size === 'sm' && 'px-3 py-1.5 text-xs min-h-[36px]',
          size === 'md' && 'px-4 py-2.5 text-sm min-h-[44px]',
          size === 'lg' && 'px-6 py-3 text-base min-h-[48px]',
          fullWidth && 'w-full',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
        )}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// === INPUT COMPONENT ===
interface EnhancedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    leftIcon,
    rightIcon,
    fullWidth = false,
    ...props 
  }, ref) => {
    return (
      <div className={cn('space-y-2', fullWidth && 'w-full', className)}>
        {label && (
          <label className="text-sm font-medium text-neutral-100">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            className={cn(
              'flex h-11 w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-red-500 focus-visible:ring-red-500',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);

EnhancedInput.displayName = 'EnhancedInput';

// === CARD COMPONENT ===
interface EnhancedCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({ 
    className, 
    variant = 'default', 
    padding = 'md',
    children,
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-neutral-900 border border-neutral-800',
      outlined: 'bg-neutral-900 border-2 border-neutral-700',
      elevated: 'bg-neutral-900 border border-neutral-800 shadow-lg'
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// === BADGE COMPONENT ===
interface EnhancedBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
}

export const EnhancedBadge = forwardRef<HTMLSpanElement, EnhancedBadgeProps>(
  ({ 
    className, 
    variant = 'default', 
    size = 'md',
    children,
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-primary-100 text-primary-800 border border-primary-200',
      secondary: 'bg-neutral-100 text-neutral-800 border border-neutral-200',
      success: 'bg-green-100 text-green-800 border border-green-200',
      warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      error: 'bg-red-100 text-red-800 border border-red-200'
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base'
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

EnhancedBadge.displayName = 'EnhancedBadge';

// === SKELETON COMPONENT (Enhanced) ===
interface EnhancedSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  circle?: boolean;
  lines?: number;
  animated?: boolean;
}

export const EnhancedSkeleton = forwardRef<HTMLDivElement, EnhancedSkeletonProps>(
  ({ 
    className, 
    width, 
    height, 
    circle = false,
    lines = 1,
    animated = true,
    ...props 
  }, ref) => {
    if (lines > 1) {
      return (
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-4 bg-neutral-800 rounded',
                animated && 'animate-pulse',
                i === lines - 1 && 'w-3/4' // Last line shorter
              )}
              style={{
                width: i === lines - 1 ? '75%' : width,
                height: height || '1rem'
              }}
            />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          'bg-neutral-800',
          circle ? 'rounded-full' : 'rounded',
          animated && 'animate-pulse',
          className
        )}
        style={{
          width,
          height
        }}
        {...props}
      />
    );
  }
);

EnhancedSkeleton.displayName = 'EnhancedSkeleton';

// === AVATAR COMPONENT ===
interface EnhancedAvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

export const EnhancedAvatar = forwardRef<HTMLDivElement, EnhancedAvatarProps>(
  ({ 
    className, 
    src, 
    alt, 
    size = 'md',
    fallback,
    children,
    ...props 
  }, ref) => {
    const sizes = {
      sm: 'h-8 w-8 text-sm',
      md: 'h-10 w-10 text-base',
      lg: 'h-12 w-12 text-lg',
      xl: 'h-16 w-16 text-xl'
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center rounded-full bg-neutral-800 text-neutral-100 font-medium',
          sizes[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          fallback || children
        )}
      </div>
    );
  }
);

EnhancedAvatar.displayName = 'EnhancedAvatar';

// === SEPARATOR COMPONENT ===
interface EnhancedSeparatorProps extends HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  decorative?: boolean;
}

export const EnhancedSeparator = forwardRef<HTMLDivElement, EnhancedSeparatorProps>(
  ({ 
    className, 
    orientation = 'horizontal',
    decorative = true,
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        role={decorative ? 'none' : 'separator'}
        aria-orientation={orientation}
        className={cn(
          'shrink-0 bg-neutral-800',
          orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
          className
        )}
        {...props}
      />
    );
  }
);

EnhancedSeparator.displayName = 'EnhancedSeparator';

// === TOOLTIP COMPONENT ===
interface EnhancedTooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  content: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export const EnhancedTooltip = forwardRef<HTMLDivElement, EnhancedTooltipProps>(
  ({ 
    className, 
    content,
    position = 'top',
    delay = 300,
    children,
    ...props 
  }, ref) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const timeoutRef = React.useRef<number | null>(null);

    const showTooltip = React.useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setIsVisible(true), delay);
    }, [delay]);

    const hideTooltip = React.useCallback(() => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsVisible(false);
    }, []);

    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    const positions = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
    };

    return (
      <div
        ref={ref}
        className={cn('relative inline-block', className)}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        {...props}
      >
        {children}
        {isVisible && (
          <div
            className={cn(
              'absolute z-50 px-2 py-1 text-xs text-white bg-neutral-900 rounded shadow-lg border border-neutral-700 whitespace-nowrap',
              positions[position]
            )}
            role="tooltip"
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);

EnhancedTooltip.displayName = 'EnhancedTooltip';

// === PROGRESS COMPONENT ===
interface EnhancedProgressProps extends HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}

export const EnhancedProgress = forwardRef<HTMLDivElement, EnhancedProgressProps>(
  ({ 
    className, 
    value = 0,
    max = 100,
    size = 'md',
    variant = 'default',
    showLabel = false,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    const variants = {
      default: 'bg-primary-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600'
    };

    return (
      <div ref={ref} className={cn('w-full space-y-1', className)} {...props}>
        {showLabel && (
          <div className="flex justify-between text-sm text-neutral-400">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div className={cn('w-full bg-neutral-800 rounded-full overflow-hidden', sizes[size])}>
          <div
            className={cn('h-full transition-all duration-300 ease-out', variants[variant])}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

EnhancedProgress.displayName = 'EnhancedProgress';

