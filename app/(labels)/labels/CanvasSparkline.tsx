import { last } from "lodash";
import {
  useEffect,
  useRef,
  useCallback,
  useState,
  createContext,
  useContext,
} from "react";

type CanvasSparklineProps = {
  chainKey: string;
  data: [number, number][];
  change: number;
};

const GradientColors = {
  negative: ["#FE5468", "#FFDF27"],
  positive: ["#10808C", "#1DF7EF"],
  neutral: ["#868686", "#ABABAB"],
};

const GradientStops = {
  negative: [3.33 * 25, 0, 200, 50],
  positive: [3.33 * 23, 0, 100, 20],
  neutral: [3.33 * 23, 0, 100, 20],
};

const CANVAS_WIDTH = 110;
const CANVAS_HEIGHT = 30;
const PADDING = 5;
const DRAW_WIDTH = 100;
const DRAW_HEIGHT = 20;

export default function CanvasSparkline({ chainKey }: CanvasSparklineProps) {
  const todayUTCStart = new Date().setUTCHours(0, 0, 0, 0);

  const { data, change, value, hoverDataPoint, setHoverDataPoint, minUnix, maxUnix } =
    useCanvasSparkline();

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

  // creates a canvas element and draws the sparkline on it
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);

  const percentChangeType = !change ? "neutral" : (change * 100).toFixed(1) === "0.0" ? "neutral" : change < 0 ? "negative" : "positive";

  const dataValuesWithNulls = adjustedData.map(([, y]) => y);
  const dataValues = dataValuesWithNulls.filter((y) => y !== null) as number[];

  const dataMin = 0;
  const dataMax = Math.max(...dataValues);

  const calculateYCoord = useCallback((y) => {
    return 20 - ((y - dataMin) / (dataMax - dataMin)) * 20;
  }, [dataMax, dataMin]);

  // Helper function to draw a path
  const drawPath = (ctx, path, style) => {
    if (path.length < 2) return;

    ctx.beginPath();
    ctx.moveTo(path[0][0], path[0][1]);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i][0], path[i][1]);
    }
    ctx.strokeStyle = style;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  };

  const drawSparkline = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const [x1, y1, x2, y2] =
        GradientStops[percentChangeType];
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      const [color1, color2] =
        GradientColors[percentChangeType];

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(PADDING, PADDING);

      let currentPath: [number, number][] = [];
      // 7 days before maxUnix
      const gradientStartIndex = adjustedData.findIndex(
        ([timestamp]) => timestamp === maxUnix - 6 * 86400000,
      );

      adjustedData.forEach((point, i) => {
        const [timestamp, y] = point;
        if (y === null) {
          if (currentPath.length > 0) {
            drawPath(ctx, currentPath, i >= gradientStartIndex ? gradient : "#CDD8D3");
            currentPath = [];
          }
          return;
        }

        const xCoord = (i / (adjustedData.length - 1)) * DRAW_WIDTH;
        const yCoord = DRAW_HEIGHT - ((y - dataMin) / (dataMax - dataMin)) * DRAW_HEIGHT;

        currentPath.push([xCoord, yCoord]);

        if (i === gradientStartIndex - 1) {
          drawPath(ctx, currentPath, i >= gradientStartIndex ? gradient : "#CDD8D3");
          currentPath = [[xCoord, yCoord]];
        }

        // If this is a lone point, draw a circle
        if ((i === 0 || adjustedData[i - 1][1] === null) &&
          (i === adjustedData.length - 1 || adjustedData[i + 1][1] === null)) {
          ctx.beginPath();
          ctx.arc(xCoord, yCoord, 1, 0, 2 * Math.PI);
          ctx.fillStyle = i >= gradientStartIndex ? gradient : "#CDD8D3";
          ctx.fill();
        }
      });

      // Draw any remaining path
      if (currentPath.length > 0) {
        drawPath(ctx, currentPath, gradient);
      }

      ctx.restore();
    },
    [adjustedData, dataMax, percentChangeType, maxUnix],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawSparkline(ctx);
  }, [canvasRef, adjustedData, drawSparkline]);

  // const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = hoverCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left - PADDING;
      let y = e.clientY - rect.top - PADDING;

      x = Math.max(0, Math.min(x, DRAW_WIDTH));

      const dataIndex = Math.round((x / DRAW_WIDTH) * (adjustedData.length - 1));
      const closestPoint = adjustedData[dataIndex];

      if (!closestPoint || closestPoint[1] === null) {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        setHoverDataPoint(null);
        return;
      }

      const [timestamp, value] = closestPoint;

      const pointX = (dataIndex / (adjustedData.length - 1)) * DRAW_WIDTH;
      const pointY = DRAW_HEIGHT - ((value - dataMin) / (dataMax - dataMin)) * DRAW_HEIGHT;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(PADDING, PADDING);

      // Draw hover line
      ctx.beginPath();
      ctx.fillStyle = "#ffffff33";
      ctx.fillRect(pointX, 0, 1, DRAW_HEIGHT);

      // Draw hover circle
      ctx.beginPath();
      ctx.fillStyle = pointX > (DRAW_WIDTH / 30) * 23
        ? (GradientColors[percentChangeType][0] + "66")
        : "#CDD8D366";
      ctx.arc(pointX, pointY, 3, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();

      setHoverDataPoint(closestPoint);
    };

    const handleMouseLeave = () => {
      setHoverDataPoint(null);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [hoverCanvasRef, adjustedData, dataMax, dataMin, percentChangeType, setHoverDataPoint]);

  return (
    <>
      <div className="relative -top-[4px]" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute" />
        <canvas ref={hoverCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute" />
      </div>
    </>
  );
}

type CanvasSparklineContextType = {
  data: [number, number][];
  minUnix: number;
  maxUnix: number;
  change: number | null;
  value: number;
  valueType: string;
  hoverDataPoint: [number, number | null] | null;
  setHoverDataPoint: (value: [number, number | null] | null) => void;
};

const CanvasSparklineContext = createContext<CanvasSparklineContextType | null>(
  null,
);

export const CanvasSparklineProvider = ({
  data,
  minUnix,
  maxUnix,
  change,
  value,
  valueType,
  children,
}: CanvasSparklineContextType & { children: React.ReactNode }) => {
  const [hoverDataPoint, setHoverDataPoint] = useState<[number, number | null] | null>(null);

  return (
    <CanvasSparklineContext.Provider
      value={{ minUnix, maxUnix, data, change, value, valueType, hoverDataPoint, setHoverDataPoint }}
    >
      {children}
    </CanvasSparklineContext.Provider>
  );
};

export const useCanvasSparkline = () => {
  const ctx = useContext(CanvasSparklineContext);

  if (!ctx) {
    throw new Error(
      "useCanvasSparkline must be used within a CanvasSparklineProvider",
    );
  }

  return ctx;
};
