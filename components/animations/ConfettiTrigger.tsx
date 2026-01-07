'use client';

import { useState } from 'react';
import ConfettiAnimation from './ConfettiAnimation';

interface ConfettiTriggerProps {
  buttonText?: string;
  buttonClassName?: string;
  duration?: number;
  particleCount?: number;
}

const ConfettiTrigger: React.FC<ConfettiTriggerProps> = ({
  buttonText = "🎉 Celebrate!",
  buttonClassName = "",
  duration = 10000,
  particleCount = 150,
}) => {
  const [isConfettiActive, setIsConfettiActive] = useState(false);

  const triggerConfetti = () => {
    setIsConfettiActive(true);
    // Reset after a brief moment to allow retriggering
    setTimeout(() => setIsConfettiActive(false), 100);
  };

  return (
    <>
      <button
        onClick={triggerConfetti}
        className={`
          rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 
          px-6 py-3 text-white font-semibold shadow-lg 
          hover:from-purple-600 hover:to-pink-600 
          transform transition-all duration-200 
          hover:scale-105 active:scale-95
          focus:outline-none focus:ring-4 focus:ring-purple-300
          ${buttonClassName}
        `}
      >
        {buttonText}
      </button>
      <ConfettiAnimation 
        isActive={isConfettiActive}
        duration={duration}
        particleCount={particleCount}
      />
    </>
  );
};

export default ConfettiTrigger; 