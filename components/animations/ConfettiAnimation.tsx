'use client';

import { useEffect, useState, useRef } from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useMaster } from '@/contexts/MasterContext';
import { useUIContext } from '@/contexts/UIContext';
import Image from 'next/image';

interface ConfettiPiece {
  id: number;
  left: number;
  animationDelay: number;
  color: string;
  size: number;
  icon: GTPIconName;
}

interface ConfettiAnimationProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  fullScreen?: boolean;
  showFullAnimation?: boolean;
  isLoading?: boolean;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isActive,
  duration = 10000,
  particleCount = 200,
  fullScreen = false,
  showFullAnimation = false,
  isLoading = false,
}) => {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const { AllChains } = useMaster();
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const animationRunning = useRef(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadingWasTrue = useRef(false);
  const { isSidebarOpen } = useUIContext();

  const colors = [
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#96ceb4',
    '#ffeaa7',
    '#dda0dd',
    '#98d8c8',
    '#f7dc6f',
    '#bb8fce',
    '#85c1e9',
  ];

  // Array of celebratory and themed GTP icons for confetti
  
  useEffect(() => {
    if (isActive && !animationRunning.current) {
  
      animationRunning.current = true;
      loadingWasTrue.current = true;
      
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < particleCount; i++) {
        const iconIndex = Math.floor(Math.random() * AllChains.length);
        pieces.push({
          id: i,
          left: Math.random() * 100,
          animationDelay: Math.random() * 10,
          color: AllChains[iconIndex].colors.dark[0],
          size: Math.random() * 10 + 15, // Slightly larger for icons
          icon: `gtp:${AllChains[iconIndex].key}-logo-monochrome` as GTPIconName,
        });
      }
      setConfettiPieces(pieces);
      setShowConfetti(true);
      setFadeOut(false);
      
      if (showFullAnimation) {
        // Original behavior: fade out 2 seconds before the end
        fadeTimerRef.current = setTimeout(() => {
          console.log('🎊 Starting fadeOut at:', Date.now());
          setFadeOut(true);
        }, duration - 2000);

        // Hide completely after fade transition completes
        hideTimerRef.current = setTimeout(() => {
          console.log('🎊 Hiding confetti completely at:', Date.now());
          setShowConfetti(false);
          setFadeOut(false);
          animationRunning.current = false;
        }, duration + 500);
      }
    }
  }, [isActive, duration, particleCount, showFullAnimation]);

  // New effect to handle loading state changes
  useEffect(() => {
    if (!showFullAnimation && loadingWasTrue.current && !isLoading && showConfetti) {
      console.log('🎊 Loading completed, starting fadeOut');
      // Clear any existing timers
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      
      // Start immediate fade out
      setFadeOut(true);
      
      // Hide completely after fade transition completes
      hideTimerRef.current = setTimeout(() => {
        console.log('🎊 Hiding confetti completely after loading finished');
        setShowConfetti(false);
        setFadeOut(false);
        animationRunning.current = false;
        loadingWasTrue.current = false;
      }, 2000); // Match the fade transition duration
    }
  }, [isLoading, showFullAnimation, showConfetti]);

  // Cleanup only on component unmount
  useEffect(() => {
    return () => {
      console.log('🎊 Component unmounting - cleaning up timers');
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
        fadeTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []); // Empty dependency array - cleanup only on unmount

  

  if (!showConfetti) return null;

  return (
    <div 
      className={`pointer-events-none z-[9999] ${
        fullScreen 
          ? 'fixed inset-0 bg-forest-900/90 overflow-hidden' 
          : 'absolute inset-0 bg-forest-900/20'
      }`}
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 2s ease-out'
      }}
    >
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece -mt-8 absolute"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.animationDelay}s`,
          }}
        >
          <GTPIcon 
            icon={piece.icon}
            size="sm"
            style={{ 
              color: piece.color,
              fontSize: `${piece.size}px`,
              width: `${piece.size}px`,
              height: `${piece.size}px`,
            }}
            className="drop-shadow-sm"
          />
        </div>
      ))}
        
      {/* Text container with proper positioning for each mode */}
      <div 
        className={`pointer-events-none w-full  z-[400] ${
          fullScreen 
            ? 'absolute' 
            : isSidebarOpen ? 'fixed' : 'fixed'
        }`}
        style={
          fullScreen
            ? {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }
            : isSidebarOpen
              ? {
                  top: '50%',
                  left: 'calc(100px + 50%)',
                  right: 0,
                  transform: 'translate(-50%, -50%)',
                }
              : {
                  top: '50%',
                  left: 'calc(24px + 50%)',
                  right: 0,
                  transform: 'translate(-50%, -50%)',
                }
        }
      >
        <div className="flex items-center justify-center">
          <GTPIcon 
            className="animate-pulse w-32 h-32 drop-shadow-2xl text-white" 
            icon={"ethereum-logo-monochrome"} 
            size="xl"
          />
          <span className="heading-large-lg drop-shadow-lg ml-4 text-color-text-primary" style={{ color: 'rgb(var(--text-primary))' }}>
            Happy Birthday Ethereum!
          </span>
        </div>
        <div className="flex items-center justify-center">
        <Image src="/anniversary.svg" alt="Confetti" loading="eager" width={250} height={100} className={`object-contain relative top-[300px] fade-in `} />
        </div>
      </div>

      <style jsx>{`
        .confetti-piece {
          animation: confetti-fall 5s linear forwards;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-50vh) rotate(0deg);
            opacity: 1;
          }
          10% {
            transform: translateY(0vh) rotate(72deg);
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }



        .confetti-piece:nth-child(odd) {
          animation-duration: 4s;
        }

        .confetti-piece:nth-child(even) {
          animation-duration: 5s;
        }

        .confetti-piece:nth-child(3n) {
          animation-duration: 6s;
        }
      `}</style>
    </div>
  );
};

export default ConfettiAnimation; 