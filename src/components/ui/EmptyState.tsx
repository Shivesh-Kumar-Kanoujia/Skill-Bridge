import React from 'react';
import { Button } from './Button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 border border-dashed border-[#D0CFC5] rounded-xl bg-white/60">
      <div className="w-12 h-12 rounded-xl bg-[#D8E3D0] text-[#31594B] flex items-center justify-center mb-4 shadow-xs">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h4 className="text-base font-serif font-bold text-[#292F2B]">{title}</h4>
      <p className="text-xs sm:text-sm text-[#68716B] max-w-sm mt-1.5 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-5">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
