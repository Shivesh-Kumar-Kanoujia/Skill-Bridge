import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'forest' | 'sage' | 'amber' | 'neutral' | 'outline' | 'category' | 'success';
  size?: 'sm' | 'md';
}

export function Badge({ className, variant = 'neutral', size = 'sm', children, ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-md tracking-tight transition-colors";

  const variantStyles = {
    forest: "bg-[#31594B] text-white",
    sage: "bg-[#D8E3D0] text-[#31594B] border border-[#C8D9C2]/60",
    amber: "bg-[#FBF4EC] text-[#8C5323] border border-[#F3E5D8]",
    neutral: "bg-[#ECE8DD] text-[#292F2B]",
    outline: "border border-[#E3E2D9] text-[#68716B] bg-white/80",
    category: "bg-[#F0F5EC] text-[#31594B] border border-[#D8E3D0] font-semibold",
    success: "bg-[#EAF5ED] text-[#356B4B] border border-[#C2E0CC] font-semibold",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs sm:text-sm",
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </span>
  );
}
