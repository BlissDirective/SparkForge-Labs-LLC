'use client';

import { useRef, useCallback } from 'react';

interface Spark {
  id: number;
  x: number;
  y: number;
  angle: number;
  color: string;
}

interface ClickSparkProps {
  children: React.ReactNode;
  colors?: string[];
  sparkCount?: number;
}

export default function ClickSpark({ children, colors = ['#E945F5', '#4F6EF7', '#FFD93D', '#2ECC71'], sparkCount = 8 }: ClickSparkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sparksRef = useRef<HTMLDivElement>(null);
  let idCounter = 0;

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || !sparksRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < sparkCount; i++) {
      const angle = (Math.PI * 2 * i) / sparkCount;
      const spark = document.createElement('div');
      const id = ++idCounter;
      spark.style.cssText = `
        position: absolute; left: ${x}px; top: ${y}px;
        width: 4px; height: 4px; border-radius: 50%;
        background: ${colors[i % colors.length]};
        pointer-events: none; z-index: 100;
        animation: spark-fly 0.6s ease-out forwards;
        --spark-angle: ${angle}rad;
      `;
      sparksRef.current.appendChild(spark);
      setTimeout(() => spark.remove(), 600);
    }
  }, [colors, sparkCount]);

  return (
    <div ref={containerRef} onClick={handleClick} className="relative select-none">
      <div ref={sparksRef} className="absolute inset-0 pointer-events-none overflow-hidden" />
      {children}
      <style>{`
        @keyframes spark-fly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(calc(cos(var(--spark-angle)) * 60px), calc(sin(var(--spark-angle)) * 60px)) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
