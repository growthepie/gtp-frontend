import { useState, useCallback } from 'react';

interface UseConfettiOptions {
  duration?: number;
  particleCount?: number;
}

export const useConfetti = (options: UseConfettiOptions = {}) => {
  const [isActive, setIsActive] = useState(false);
  
  const triggerConfetti = useCallback(() => {
    setIsActive(true);
    // Reset after a brief moment to allow retriggering
    setTimeout(() => setIsActive(false), 100);
  }, []);

  return {
    isActive,
    triggerConfetti,
    duration: options.duration || 10000,
    particleCount: options.particleCount || 150,
  };
}; 