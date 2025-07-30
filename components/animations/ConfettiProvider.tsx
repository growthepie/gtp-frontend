'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfettiAnimation from './ConfettiAnimation';

interface ConfettiContextType {
  triggerConfetti: (options?: { 
    duration?: number; 
    particleCount?: number; 
    fullScreen?: boolean;
    showFullAnimation?: boolean;
    isLoading?: boolean;
  }) => void;
  defaultFullScreen: boolean;
}

const ConfettiContext = createContext<ConfettiContextType | undefined>(undefined);

export const useGlobalConfetti = (defaultFullScreen: boolean = false) => {
  const context = useContext(ConfettiContext);
  if (!context) {
    throw new Error('useGlobalConfetti must be used within a ConfettiProvider');
  }
  
  // Return a version of triggerConfetti that uses the provided defaultFullScreen
  const triggerConfetti = useCallback((options: { 
    duration?: number; 
    particleCount?: number; 
    fullScreen?: boolean;
    showFullAnimation?: boolean;
    isLoading?: boolean;
  } = {}) => {
    context.triggerConfetti({
      ...options,
      fullScreen: options.fullScreen !== undefined ? options.fullScreen : defaultFullScreen
    });
  }, [context.triggerConfetti, defaultFullScreen]);
  
  return { triggerConfetti };
};

interface ConfettiProviderProps {
  children: React.ReactNode;
}

export const ConfettiProvider: React.FC<ConfettiProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(10000);
  const [particleCount, setParticleCount] = useState(150);
  const [fullScreen, setFullScreen] = useState(false);
  const [showFullAnimation, setShowFullAnimation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shouldRenderConfetti, setShouldRenderConfetti] = useState(false);

  const triggerConfetti = useCallback((options: { 
    duration?: number; 
    particleCount?: number; 
    fullScreen?: boolean;
    showFullAnimation?: boolean;
    isLoading?: boolean;
  } = {}) => {
    const newDuration = options.duration || 10000;
    setDuration(newDuration);
    setParticleCount(options.particleCount || 150);
    setFullScreen(options.fullScreen || false);
    setShowFullAnimation(options.showFullAnimation || false);
    setIsLoading(options.isLoading || false);
    setIsActive(true);
    
    // Keep component mounted for fullscreen animations
    if (options.fullScreen) {
      setShouldRenderConfetti(true);
      // Hide the component after animation completes (adjust based on showFullAnimation)
      const hideDelay = options.showFullAnimation ? newDuration + 1000 : 3000; // Shorter delay if not showing full animation
      setTimeout(() => {
        setShouldRenderConfetti(false);
      }, hideDelay);
    }
    
    // Reset after a brief moment to allow retriggering
    setTimeout(() => setIsActive(false), 100);
  }, []);

  return (
    <ConfettiContext.Provider value={{ triggerConfetti, defaultFullScreen: false }}>
      {children}
      {/* Render global confetti for fullscreen scenarios and keep mounted during animation */}
      {shouldRenderConfetti && (
        <ConfettiAnimation 
          isActive={isActive}
          duration={duration}
          particleCount={particleCount}
          fullScreen={fullScreen}
          showFullAnimation={showFullAnimation}
          isLoading={isLoading}
        />
      )}
    </ConfettiContext.Provider>
  );
}; 