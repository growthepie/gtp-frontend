'use client';

import { useEffect, useState, useRef } from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";

interface ConfettiPiece {
  id: number;
  left: number;
  animationDelay: number;
  color: string;
  size: number;
}

interface ConfettiAnimationProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  fullScreen?: boolean;
}

const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isActive,
  duration = 10000,
  particleCount = 150,
  fullScreen = false,
}) => {
  const [confettiPieces, setConfettiPieces] = useState<ConfettiPiece[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const animationRunning = useRef(false);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (isActive && !animationRunning.current) {
      console.log('🎊 Starting confetti animation with duration:', duration);
      animationRunning.current = true;
      
      const pieces: ConfettiPiece[] = [];
      for (let i = 0; i < particleCount; i++) {
        pieces.push({
          id: i,
          left: Math.random() * 100,
          animationDelay: Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 10 + 5,
        });
      }
      setConfettiPieces(pieces);
      setShowConfetti(true);
      setFadeOut(false);
      
      // Start fade out 2 seconds before the end
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
  }, [isActive]); // Trigger only, no cleanup here

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
      className={`pointer-events-none z-[9999] overflow-hidden  ${
        fullScreen 
          ? 'fixed inset-0 bg-forest-900/90' 
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
          className="confetti-piece absolute"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDelay: `${piece.animationDelay}s`,
          }}
        />
      ))}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        style={{
          bottom: fullScreen ? '0px' : '35%',
          right: fullScreen ? '0px' : '5%',
        }}
        >
          <GTPIcon 
            className="animate-pulse w-32 h-32 drop-shadow-2xl text-white" 
            icon={"ethereum-logo-monochrome"} 
            size="xl"
          />
          <span className="heading-large-lg">Happy Birthday Ethereum!</span>
        </div>

      <style jsx>{`
        .confetti-piece {
          animation: confetti-fall 5s linear forwards;
          border-radius: 2px;
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