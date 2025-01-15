import React from 'react';

interface PathData {
  d: string;
  fill: string;
}

interface DynamicIconProps {
  pathString: string;
  size?: number;
  color?: string;
  viewBox?: string;
  className?: string;
}

const DynamicIcon: React.FC<DynamicIconProps> = ({ 
  pathString, 
  size = 24, 
  color = 'currentColor', 
  viewBox = "0 0 15 15",
  className = '' 
}) => {
  if (!pathString) return null;

  const parsePaths = (str: string): PathData[] => {
    const paths: PathData[] = [];
    const pathRegex = /<path[^>]*>/g;
    const matches = str.match(pathRegex);
    
    if (matches) {
      matches.forEach(pathStr => {
        const dMatch = pathStr.match(/d="([^"]*)"/);
        const fillMatch = pathStr.match(/fill="([^"]*)"/);
        
        if (dMatch) {
          paths.push({
            d: dMatch[1],
            fill: fillMatch ? fillMatch[1] : color
          });
        }
      });
    }
    return paths;
  };

  const paths = parsePaths(pathString);

  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {paths.map((path, index) => (
        <path
          key={index}
          d={path.d}
          fill={path.fill === 'currentColor' ? color : path.fill}
        />
      ))}
    </svg>
  );
};

export default DynamicIcon;