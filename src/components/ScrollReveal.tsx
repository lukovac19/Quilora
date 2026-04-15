import { useScrollReveal } from '../hooks/useScrollReveal';
import { ReactNode, CSSProperties } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  duration?: number;
  yOffset?: number;
  /** When set, animates translateX from this value to 0 (negative = enter from left, positive = from right). */
  xOffset?: number;
  scale?: number;
}

export function ScrollReveal({
  children,
  delay = 0,
  className = '',
  duration = 0.5,
  yOffset = 24,
  xOffset,
  scale = 0.98,
}: ScrollRevealProps) {
  const { ref, isVisible } = useScrollReveal();

  const transform =
    xOffset !== undefined
      ? isVisible
        ? 'translateX(0) scale(1)'
        : `translateX(${xOffset}px) scale(${scale})`
      : isVisible
        ? 'translateY(0) scale(1)'
        : `translateY(${yOffset}px) scale(${scale})`;

  const style: CSSProperties = {
    opacity: isVisible ? 1 : 0,
    transform,
    transition: `opacity ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s, transform ${duration}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
    willChange: 'transform, opacity',
  };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
