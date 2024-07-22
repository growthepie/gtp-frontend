import { last } from "lodash";
import {
  useEffect,
  useRef,
  useCallback,
  useState,
  createContext,
  useContext,
} from "react";

type SVGSparklineProps = {
  chainKey: string;
  data: [number, number][];
  change: number;
};

const GradientColors = {
  negative: ["#FE5468", "#FFDF27"],
  positive: ["#10808C", "#1DF7EF"],
  neutral: ["#868686", "#ABABAB"],
};

const SVG_WIDTH = 110;
const SVG_HEIGHT = 30;
const PADDING = 5;
const DRAW_WIDTH = 100;
const DRAW_HEIGHT = 20;

// Define gradients outside of the component
const gradientDefs = (
  <defs>
    <linearGradient id="gradient-negative" x1="100" y1="0" x2="200" y2="50">
      <stop offset="0%" stopColor={GradientColors.negative[0]} />
      <stop offset="100%" stopColor={GradientColors.negative[1]} />
    </linearGradient>
    <linearGradient id="gradient-positive" x1="100" y1="0" x2="100" y2="50">
      <stop offset="0%" stopColor={GradientColors.positive[0]} />
      <stop offset="100%" stopColor={GradientColors.positive[1]} />
    </linearGradient>
    <linearGradient id="gradient-neutral" x1="100" y1="0" x2="100" y2="50">
      <stop offset="0%" stopColor={GradientColors.neutral[0]} />
      <stop offset="100%" stopColor={GradientColors.neutral[1]} />
    </linearGradient>
  </defs>
);
export default function SVGSparkline({ chainKey }: SVGSparklineProps) {
  const { data, change, value, hoverDataPoint, setHoverDataPoint, minUnix, maxUnix } =
    useSVGSparkline();

  const [adjustedData, setAdjustedData] = useState<[number, number | null][]>([]);

  // fill any missing data points with null values for the sparkline
  useEffect(() => {
    const adjusted: [number, number | null][] = [];
    for (let i = minUnix; i <= maxUnix; i += 86400000) {
      const dataPoint = data.find(([timestamp]) => timestamp === i);
      if (dataPoint) {
        adjusted.push(dataPoint);
      } else {
        adjusted.push([i, null]);
      }
    }
    setAdjustedData(adjusted);
  }, [data, minUnix, maxUnix]);

  const percentChangeType = !change ? "neutral" : (change * 100).toFixed(1) === "0.0" ? "neutral" : change < 0 ? "negative" : "positive";

  const dataValuesWithNulls = adjustedData.map(([, y]) => y);
  const dataValues = dataValuesWithNulls.filter((y) => y !== null) as number[];

  const dataMin = 0;
  const dataMax = Math.max(...dataValues);

  const calculateYCoord = useCallback((y) => {
    return DRAW_HEIGHT - ((y - dataMin) / (dataMax - dataMin)) * DRAW_HEIGHT;
  }, [dataMax, dataMin]);

  // Generate the paths for the sparkline
  const generatePaths = useCallback(() => {
    let grayPath = "";
    let coloredPath = "";
    let currentPath: [number, number][] = [];
    const gradientStartIndex = adjustedData.length - 7; // Start gradient for last 7 days

    adjustedData.forEach((point, i) => {
      const [timestamp, y] = point;
      if (y === null) {
        if (currentPath.length > 0) {
          const pathString = `M${currentPath[0][0]},${currentPath[0][1]}` +
            currentPath.slice(1).map(([x, y]) => `L${x},${y}`).join('');
          if (i <= gradientStartIndex) {
            grayPath += pathString;
          } else {
            coloredPath += pathString;
          }
          currentPath = [];
        }
        return;
      }

      const xCoord = (i / (adjustedData.length - 1)) * DRAW_WIDTH;
      const yCoord = calculateYCoord(y);

      currentPath.push([xCoord, yCoord]);

      if (i === gradientStartIndex - 1) {
        grayPath += `M${currentPath[0][0]},${currentPath[0][1]}` +
          currentPath.slice(1).map(([x, y]) => `L${x},${y}`).join('');
        currentPath = [[xCoord, yCoord]];
      }

      // If this is a lone point, draw a circle
      if ((i === 0 || adjustedData[i - 1][1] === null) &&
        (i === adjustedData.length - 1 || adjustedData[i + 1][1] === null)) {
        const circlePath = `M${xCoord},${yCoord}m-1,0a1,1 0 1,0 2,0a1,1 0 1,0 -2,0`;
        if (i < gradientStartIndex) {
          grayPath += circlePath;
        } else {
          coloredPath += circlePath;
        }
      }
    });

    // Add any remaining path
    if (currentPath.length > 0) {
      coloredPath += `M${currentPath[0][0]},${currentPath[0][1]}` +
        currentPath.slice(1).map(([x, y]) => `L${x},${y}`).join('');
    }

    return { grayPath, coloredPath };
  }, [adjustedData, calculateYCoord]);

  const { grayPath, coloredPath } = generatePaths();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    let x = e.clientX - rect.left - PADDING;

    x = Math.max(0, Math.min(x, DRAW_WIDTH));

    const dataIndex = Math.round((x / DRAW_WIDTH) * (adjustedData.length - 1));
    const closestPoint = adjustedData[dataIndex];

    if (!closestPoint || closestPoint[1] === null) {
      setHoveredIndex(null);
      setHoverDataPoint(null);
      return;
    }

    setHoveredIndex(dataIndex);
    setHoverDataPoint(closestPoint);
  }, [adjustedData, setHoverDataPoint]);

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
    setHoverDataPoint(null);
  }, [setHoverDataPoint]);

  return (
    <div className="relative -top-[4px]" style={{ width: SVG_WIDTH, height: SVG_HEIGHT }}>
      <svg
        width={SVG_WIDTH}
        height={SVG_HEIGHT}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {gradientDefs}
        <g transform={`translate(${PADDING}, ${PADDING})`}>
          <path
            d={grayPath}
            fill="none"
            stroke="#CDD8D3"
            strokeWidth="1.5"
          />
          <path
            d={coloredPath}
            fill="none"
            stroke={`url(#gradient-${percentChangeType})`}
            strokeWidth="1.5"
          />
          {hoveredIndex !== null && (
            <>
              <line
                x1={(hoveredIndex / (adjustedData.length - 1)) * DRAW_WIDTH}
                y1="0"
                x2={(hoveredIndex / (adjustedData.length - 1)) * DRAW_WIDTH}
                y2={DRAW_HEIGHT}
                stroke="#ffffff33"
                strokeWidth="1.5"
              />
              <circle
                cx={(hoveredIndex / (adjustedData.length - 1)) * DRAW_WIDTH}
                cy={calculateYCoord(adjustedData[hoveredIndex][1])}
                r="3"
                fill={hoveredIndex >= adjustedData.length - 7 ? GradientColors[percentChangeType][0] + "66" : "#CDD8D366"}
              />
            </>
          )}
        </g>
      </svg>
    </div>
  );
}

type SVGSparklineContextType = {
  data: [number, number][];
  minUnix: number;
  maxUnix: number;
  change: number | null;
  value: number;
  valueType: string;
  hoverDataPoint: [number, number | null] | null;
  setHoverDataPoint: (value: [number, number | null] | null) => void;
  isDBLoading: boolean;
};

const SVGSparklineContext = createContext<SVGSparklineContextType | null>(
  null,
);

export const SVGSparklineProvider = ({
  data,
  minUnix,
  maxUnix,
  change,
  value,
  valueType,
  isDBLoading,
  children,
}: SVGSparklineContextType & { children: React.ReactNode }) => {
  const [hoverDataPoint, setHoverDataPoint] = useState<[number, number | null] | null>(null);

  return (
    <SVGSparklineContext.Provider
      value={{ minUnix, maxUnix, data, change, value, valueType, hoverDataPoint, setHoverDataPoint, isDBLoading }}
    >
      {children}
    </SVGSparklineContext.Provider>
  );
};

export const useSVGSparkline = () => {
  const ctx = useContext(SVGSparklineContext);

  if (!ctx) {
    throw new Error(
      "useSVGSparkline must be used within a SVGSparklineProvider",
    );
  }

  return ctx;
};