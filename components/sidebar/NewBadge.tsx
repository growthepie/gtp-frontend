import React, { forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type NewBadgeProps = {
  badgeId?: string;
  style?: React.CSSProperties;
  className?: string;
};

const NewBadge = forwardRef<HTMLDivElement, NewBadgeProps>(({ badgeId, style, className, ...restProps }, ref) => {
  // Sanitize badgeId to remove spaces and special characters for valid SVG ID references
  const sanitizedId = (badgeId || 'default').replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '');

  return (
    <motion.div
      ref={ref}
      style={style}
      // @ts-ignore
      className={`z-50 pointer-events-none ${className || ''}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        duration: 0.2,
        ease: "easeOut",
        opacity: { duration: 0.15 },
        scale: { duration: 0.2 }
      }}
      {...restProps}
    >
      <svg width="47" height="35" viewBox="0 0 47 35" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`paint0_linear_new_badge_portal_${sanitizedId}`} x1="23.8679" y1="0.0712891" x2="23.8679" y2="27.0713" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FE5468"/>
            <stop offset="1" stopColor="#FFDF27"/>
          </linearGradient>
          <linearGradient id={`paint1_linear_new_badge_portal_${sanitizedId}`} x1="35.6179" y1="27.0713" x2="38.0208" y2="37.2058" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FE5468"/>
            <stop offset="1" stopColor="#FFDF27"/>
          </linearGradient>
        </defs>
        <path d="M0.86792 13.5713C0.86792 6.11545 6.91208 0.0712891 14.3679 0.0712891H46.8679V27.0713H14.3679C6.91208 27.0713 0.86792 21.0271 0.86792 13.5713Z" fill={`url(#paint0_linear_new_badge_portal_${sanitizedId})`}/>
        <path d="M11.8359 12.6873V19.0713H9.90392V9.13129H11.4439L16.5819 15.6833V9.14529H18.5139V19.0713H16.9039L11.8359 12.6873ZM27.4837 17.3773V19.0713H20.5817V9.13129H27.3577V10.8253H22.5137V13.2193H26.6997V14.7873H22.5137V17.3773H27.4837ZM32.3919 9.15929H34.1839L35.3179 12.4493L36.4659 9.15929H38.2439L36.5359 13.6813L37.7959 16.8453L40.6099 9.13129H42.7099L38.7339 19.0713H37.0679L35.3179 14.8993L33.5819 19.0713H31.9159L27.9539 9.13129H30.0259L32.8539 16.8453L34.0859 13.6813L32.3919 9.15929Z" fill="rgb(var(--bg-default))"/>
        <path d="M24.3679 34.5713V27.0713H46.8679L24.3679 34.5713Z" fill={`url(#paint1_linear_new_badge_portal_${sanitizedId})`}/>
      </svg>
    </motion.div>

  );
});

NewBadge.displayName = 'NewBadge';

export default NewBadge;

