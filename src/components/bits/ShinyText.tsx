'use client';

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number;
  color?: string;
}

export default function ShinyText({ text, className = '', speed = 3, color = '#4F6EF7' }: ShinyTextProps) {
  return (
    <span
      className={`inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage: `linear-gradient(120deg, ${color} 40%, #ffffff 50%, ${color} 60%)`,
        backgroundSize: '200% 100%',
        animation: `shiny-sweep ${speed}s linear infinite`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    >
      {text}
      <style>{`@keyframes shiny-sweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </span>
  );
}
