'use client';

import { useEffect, useRef } from 'react';

interface LottieAnimationProps {
  animationData: any;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export default function LottieAnimation({
  animationData,
  className = "w-64 h-64",
  loop = true,
  autoplay = true
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationInstance: any = null;
    let isMounted = true;

    const loadLottie = async () => {
      try {
        const lottie = (await import('lottie-web')).default;

        if (!isMounted) return;

        if (containerRef.current) {
          // Clear any existing animation
          containerRef.current.innerHTML = '';

          animationInstance = lottie.loadAnimation({
            container: containerRef.current,
            renderer: 'svg',
            loop,
            autoplay,
            animationData,
          });
        }
      } catch (error) {
        console.error('Error loading Lottie animation:', error);
      }
    };

    loadLottie();

    return () => {
      isMounted = false;
      if (animationInstance) {
        animationInstance.destroy();
      }
    };
  }, [animationData, loop, autoplay]);

  return <div ref={containerRef} className={className} />;
}