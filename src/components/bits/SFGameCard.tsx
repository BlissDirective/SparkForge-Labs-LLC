'use client';

import { useState } from 'react';
import { Star, Clock, Zap } from 'lucide-react';
import type { GameRegistryEntry } from '@/types/game';
import TiltedCard from './TiltedCard';
import SpotlightCard from './SpotlightCard';

interface SFGameCardProps {
  game: GameRegistryEntry;
  onClick?: () => void;
  featured?: boolean;
}

export function SFGameCard({ game, onClick, featured = false }: SFGameCardProps) {
  const [hovered, setHovered] = useState(false);
  const CardWrapper = featured ? SpotlightCard : TiltedCard;

  return (
    <CardWrapper
      spotlightColor={featured ? `${game.color}25` : undefined}
      className={`cursor-pointer ${featured ? 'ring-2' : ''}`}
      style={featured ? { ringColor: game.color } : undefined}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative overflow-hidden rounded-t-sf-lg">
        <div
          className="w-full aspect-[4/3] flex items-center justify-center transition-transform duration-300"
          style={{
            background: `linear-gradient(135deg, ${game.color}20, ${game.color}40)`,
            transform: hovered ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          <span className="text-5xl" role="img" aria-label={game.name}>{game.icon}</span>
        </div>
        {game.isNew && (
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded-sf-full text-[10px] font-bold text-white bg-sf-accent-green">
            NEW
          </span>
        )}
        {featured && (
          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-sf-full text-[10px] font-bold text-white" style={{ backgroundColor: game.color }}>
            FEATURED
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded-sf-full text-[10px] font-semibold" style={{ backgroundColor: `${game.color}15`, color: game.color }}>
            {game.category}
          </span>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Star key={i} className="w-3 h-3" style={{ color: i < game.difficulty ? '#FFD93D' : '#EEF2FA', fill: i < game.difficulty ? '#FFD93D' : 'none' }} />
            ))}
          </div>
        </div>

        <h3 className="font-bold text-base mb-1" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>
          {game.name}
        </h3>
        <p className="text-xs mb-3 line-clamp-2" style={{ color: '#8C94AC' }}>{game.description}</p>

        <div className="flex items-center justify-between text-[11px]" style={{ color: '#8C94AC' }}>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{game.estimatedMinutes}m</span>
          <span className="flex items-center gap-1 font-semibold" style={{ color: '#4F6EF7' }}><Zap className="w-3 h-3" />{game.xpReward} XP</span>
        </div>
      </div>
    </CardWrapper>
  );
}
