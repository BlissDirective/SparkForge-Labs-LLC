'use client';

import { forwardRef } from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarType = 'image' | 'initials' | 'icon';

interface SFAvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  initials?: string;
  icon?: React.ReactNode;
  size?: AvatarSize;
  online?: boolean;
  border?: boolean;
}

const sizeMap: Record<AvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 80 };
const fontMap: Record<AvatarSize, string> = { xs: 'text-[10px]', sm: 'text-xs', md: 'text-sm', lg: 'text-lg', xl: 'text-2xl' };

export const SFAvatar = forwardRef<HTMLDivElement, SFAvatarProps>(
  ({ src, alt, initials, icon, size = 'md', online = false, border = false, className = '', style, ...props }, ref) => {
    const s = sizeMap[size];
    const gradient = 'linear-gradient(135deg, #9B59B6, #4F6EF7)';

    return (
      <div ref={ref} className={`relative inline-flex shrink-0 ${className}`} style={style} {...props}>
        <div
          className={`rounded-sf-full flex items-center justify-center font-bold text-white overflow-hidden ${fontMap[size]} ${border ? 'ring-2 ring-white' : ''}`}
          style={{ width: s, height: s, background: gradient }}
        >
          {src ? <img src={src} alt={alt || ''} className="w-full h-full object-cover" /> :
           initials ? initials.slice(0, 2).toUpperCase() :
           icon || <span className="opacity-60">&#9786;</span>}
        </div>
        {online && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-sf-accent-green ring-2 ring-white" />
        )}
      </div>
    );
  }
);
SFAvatar.displayName = 'SFAvatar';
