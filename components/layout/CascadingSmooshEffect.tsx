import React, { ReactNode, useState } from 'react';

interface CascadeSection {
  id: string;
  content: ReactNode;
  minWidth?: number;
  maxWidth?: number;
  basis?: number;
  priority?: number; // Higher number = compress first (rightmost)
  className?: string;
  showGradient?: boolean;
  hoverExpand?: boolean;
  fixedWidth?: boolean;
}

interface CascadingSmooshEffectProps {
  sections: CascadeSection[];
  className?: string;
  minWidth?: string;
  gap?: string;
}

const CascadingSmooshEffect: React.FC<CascadingSmooshEffectProps> = ({ 
  sections, 
  className = "", 
  minWidth = "800px",
  gap = "5px"
}) => {
  // Sort by priority - LOWER priority should be on the left (compress last)
  // const sortedSections = [...sections].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  // Create nested structure for proper right-to-left compression
  const createNestedStructure = (sections: CascadeSection[]): ReactNode => {
    if (sections.length === 0) return null;
    if (sections.length === 1) {
      return <SectionWrapper key={sections[0].id} section={sections[0]} isLast={true} />;
    }

    const isLast = sections.length === 1;

    // Take the leftmost (lowest priority) item
    const [first, ...rest] = sections;
    
    return (
      <>
        <SectionWrapper key={first.id} section={first} isLast={isLast} />
        {rest.length > 0 && (
          <div className="flex gap-x-[5px] flex-grow flex-shrink basis-0">
            {createNestedStructure(rest)}
          </div>
        )}
      </>
    );
  };

  return (
    <div 
      className={className}
      style={{ minWidth }}
    >
      <div className="w-full flex" style={{ gap }}>
        {createNestedStructure(sections)}
      </div>
    </div>
  );
};

const SectionWrapper: React.FC<{ section: CascadeSection, isLast: boolean }> = ({ section, isLast }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    content,
    minWidth = 67,
    maxWidth,
    basis,
    className = '',
    showGradient = true,
    hoverExpand = true,
    fixedWidth = false,
    priority = 0
  } = section;

  const expandedWidth = maxWidth || Math.max(minWidth * 2, 200);
  
  // Build classes based on priority and settings
  const containerClasses = [
    '@container',
    'relative',
    'transition-all',
    'duration-300',
    className
  ];

  // Fixed width sections don't flex
  if (fixedWidth) {
    containerClasses.push('flex-shrink-0');
  } else {
    // Higher priority (rightmost) items are more flexible
    if (priority <= 1) {
      // Leftmost items - most stable
      containerClasses.push('flex-shrink-0');
    } else if (priority <= 3) {
      // Middle items
      containerClasses.push('flex-shrink flex-grow');
    } else {
      // Rightmost items - most compressible
      containerClasses.push('flex-shrink flex-grow');
    }
    
    // Use basis for middle/right items
    if (priority > 1) {
      containerClasses.push(`basis-[${basis || minWidth}px]`);
    }
  }

  // Dynamic inline styles for hover
  const containerStyle: React.CSSProperties = {
    minWidth: `${isHovered && hoverExpand ? expandedWidth : minWidth}px`,
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    width: fixedWidth ? `${minWidth}px` : undefined,
    flexBasis: !fixedWidth && basis ? `${basis}px` : undefined,
  };

  return (
    <div 
      className={containerClasses.join(' ')} 
      style={containerStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative w-full ${isLast ? "overflow-hidden" : "overflow-visible"}  rounded-full group`}>
        {content}
        
        {showGradient && (
          <div 
            className="transition-all duration-300 z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] rounded-full pointer-events-none"
            style={{ 
              background: 'linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(22,28,27,0.93) 76%)',
              opacity: isHovered ? 0 : 1
            }}
          />
        )}
      </div>
    </div>
  );
};

export default CascadingSmooshEffect;