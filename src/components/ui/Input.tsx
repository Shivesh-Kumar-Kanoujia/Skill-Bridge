import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, leftIcon, rightElement, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-[#292F2B] uppercase tracking-wider">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-[#68716B] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "w-full h-10 rounded-lg bg-white border border-[#E3E2D9] px-3.5 text-sm text-[#292F2B] placeholder:text-[#8E9690] transition-all focus:outline-none focus:ring-2 focus:ring-[#31594B] focus:border-transparent disabled:bg-[#F4F1E8] disabled:cursor-not-allowed shadow-2xs",
              leftIcon ? "pl-10" : "",
              rightElement ? "pr-10" : "",
              error ? "border-[#B5473C] focus:ring-[#B5473C]" : "",
              className
            )}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-3.5 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-[#B5473C] font-medium">{error}</p>}
        {helperText && !error && <p className="text-xs text-[#68716B]">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
