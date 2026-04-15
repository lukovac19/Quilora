import { useEffect, useState } from 'react';

interface ParallaxOptions {
  speed?: number; // How much to move (lower = slower, 0.1 to 1.0)
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function useParallax({ speed = 0.5, direction = 'up' }: ParallaxOptions = {}) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setOffset(scrolled * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  const getTransform = () => {
    switch (direction) {
      case 'up':
        return `translateY(-${offset}px)`;
      case 'down':
        return `translateY(${offset}px)`;
      case 'left':
        return `translateX(-${offset}px)`;
      case 'right':
        return `translateX(${offset}px)`;
      default:
        return `translateY(-${offset}px)`;
    }
  };

  return { transform: getTransform() };
}
