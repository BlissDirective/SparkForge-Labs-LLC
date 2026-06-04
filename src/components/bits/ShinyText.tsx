'use client';

interface ShinyTextProps {
  text?: string;
  children?: React.ReactNode;
  className?: string;
  speed?: number;
  color?: string;
  /** When true, renders plain (no shimmer animation). */
  disabled?: boolean;
}

export default function ShinyText({ text, children, className = '', speed = 3, color = '#4F6EF7', disabled = false }: ShinyTextProps) {
  const content = text ?? children;

  if (disabled) {
    return <span className={`inline-block ${className}`}>{content}</span>;
  }

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
      {content}
      <style>{`@keyframes shiny-sweep { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </span>
  );
}
