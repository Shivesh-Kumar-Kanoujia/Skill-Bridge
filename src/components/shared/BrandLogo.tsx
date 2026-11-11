import React from 'react';
import Image from 'next/image';

export type BrandLogoSize = 'xs' | 'sm' | 'navbar' | 'md' | 'lg' | 'xl';

interface BrandLogoProps {
  size?: BrandLogoSize;
  eager?: boolean;
  framed?: boolean;
  className?: string;
}

const SIZE_CONFIG: Record<BrandLogoSize, { px: number; boxClass: string }> = {
  xs: { px: 28, boxClass: 'w-7 h-7 rounded-md' },
  sm: { px: 36, boxClass: 'w-9 h-9 rounded-lg' },
  navbar: { px: 44, boxClass: 'w-9 h-9 rounded-lg sm:w-11 sm:h-11 sm:rounded-xl' },
  md: { px: 44, boxClass: 'w-11 h-11 rounded-xl' },
  lg: { px: 56, boxClass: 'w-14 h-14 rounded-xl' },
  xl: { px: 80, boxClass: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl' },
};

/**
 * Official SkillBridge logo mark rendered from the 1:1 brand asset without cropping or distortion.
 */
export function BrandLogo({
  size = 'md',
  eager = false,
  framed = true,
  className = '',
}: BrandLogoProps) {
  const { px, boxClass } = SIZE_CONFIG[size];

  return (
    <span
      className={[
        'inline-flex items-center justify-center aspect-square shrink-0 overflow-hidden bg-[#FDF8F4]',
        framed ? 'border border-[#E3E2D9]' : '',
        boxClass,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Image
        src="/images/skillbridge-logo.jpg"
        alt="SkillBridge"
        width={px}
        height={px}
        loading={eager ? 'eager' : undefined}
        draggable={false}
        className="w-full h-full object-contain select-none"
      />
    </span>
  );
}

interface BrandLoaderProps {
  message?: string;
  compact?: boolean;
}

/**
 * Shared Sage & Cream branded loading screen for auth-gated and suspended views.
 */
export function BrandLoader({ message = 'Checking session...', compact = false }: BrandLoaderProps) {
  return (
    <div
      className={[
        'flex-1 flex items-center justify-center bg-[#F4F1E8]',
        compact ? 'py-12' : 'py-24',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-3">
        <BrandLogo size="md" eager />
        <div className="w-6 h-6 border-2 border-[#31594B] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#68716B] font-medium">{message}</p>
      </div>
    </div>
  );
}
