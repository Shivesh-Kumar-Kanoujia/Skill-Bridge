'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, leftIcon, rightIcon, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium transition-colors duration-150 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#31594B] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer";

    const variantStyles = {
      primary: "clay-btn-primary",
      secondary: "clay-btn-secondary",
      outline: "border border-[#E3E2D9] bg-white text-[#292F2B] hover:bg-[#F4F1E8] hover:border-[#D0CFC5] shadow-xs active:translate-y-px",
      ghost: "text-[#292F2B] hover:bg-[#ECE8DD]/80",
      danger: "bg-red-50 text-[#B5473C] border border-red-200 hover:bg-red-100",
      amber: "bg-[#D99A62] text-white hover:bg-[#C58850] shadow-xs font-semibold active:translate-y-px",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-10 px-4 text-sm gap-2",
      lg: "h-12 px-6 text-base gap-2.5",
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...(props as any)}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
