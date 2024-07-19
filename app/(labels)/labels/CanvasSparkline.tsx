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
};

const GradientStops = {
  negative: [3.33 * 23, 0, 100, 20],
  positive: [3.33 * 23, 0, 100, 20],
};

const CANVAS_WIDTH = 110;
const CANVAS_HEIGHT = 30;
const PADDING = 5;
const DRAW_WIDTH = 100;
const DRAW_HEIGHT = 20;

export default function CanvasSparkline({ chainKey }: CanvasSparklineProps) {
  const todayUTCStart = new Date().setUTCHours(0, 0, 0, 0);

  const { data, change, value, hoverDataPoint, setHoverDataPoint } =
    useCanvasSparkline();
  // creates a canvas element and draws the sparkline on it
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);

  const isNegative = change < 0;

  const dataMin = Math.min(...data.map(([, y]) => y));
  const dataMax = Math.max(...data.map(([, y]) => y));

  const calculateYCoord = useCallback((y) => {
    return 20 - ((y - dataMin) / (dataMax - dataMin)) * 20;
  }, [dataMax, dataMin]);

  const drawSparkline = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const [x1, y1, x2, y2] =
        GradientStops[isNegative ? "negative" : "positive"];
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      const [color1, color2] =
        GradientColors[isNegative ? "negative" : "positive"];

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(PADDING, PADDING);

      // Adjust the drawing logic
      const reversedData = data.slice().reverse();
      Array(30)
        .fill(undefined)
        .forEach((_, i) => {
          const y = reversedData[i]?.[1];
          if (y === undefined) return;

          let xCoord = DRAW_WIDTH - i * (DRAW_WIDTH / 29);
          let yCoord = DRAW_HEIGHT - ((y - dataMin) / (dataMax - dataMin)) * DRAW_HEIGHT;

          switch (i) {
            case 0:
              ctx.beginPath();
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 1.5;
              ctx.moveTo(xCoord, yCoord);
              break;
            // end path of first line segment and start path of second line segment
            case 7:
              ctx.lineTo(xCoord, yCoord);
              ctx.stroke();

              ctx.beginPath();
              ctx.strokeStyle = "#CDD8D3";
              ctx.moveTo(xCoord, yCoord);
              break;
            case data.length - 1:
              ctx.lineTo(xCoord, yCoord);
              ctx.stroke();
              break;
            default:
              ctx.lineTo(xCoord, yCoord);
              break;
          }
        });

      ctx.restore(); // Reset the drawing context
    },
    [data, dataMax, dataMin, isNegative],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawSparkline(ctx);
  }, [canvasRef, data, drawSparkline]);

  // const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const canvas = hoverCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      let x = e.clientX - rect.left - PADDING;
      let y = e.clientY - rect.top - PADDING;

      // Ensure x is within the drawing area
      x = Math.max(0, Math.min(x, DRAW_WIDTH));

      // Calculate the index of the closest data point
      const dataIndex = Math.round((x / DRAW_WIDTH) * (data.length - 1));
      const closestPoint = data[dataIndex];

      if (!closestPoint) return;

      const [timestamp, value] = closestPoint;

      // Calculate the x-coordinate for the circle (snapped to the closest data point)
      const pointX = (dataIndex / (data.length - 1)) * DRAW_WIDTH;

      // Calculate the y-coordinate for the circle
      const pointY = DRAW_HEIGHT - ((value - dataMin) / (dataMax - dataMin)) * DRAW_HEIGHT;

      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.save();
      ctx.translate(PADDING, PADDING);

      // Draw hover line at mouse position
      ctx.beginPath();
      ctx.fillStyle = "#ffffff33";
      ctx.fillRect(x, 0, 1, DRAW_HEIGHT);

      // Draw hover circle at closest data point
      ctx.beginPath();
      ctx.fillStyle = pointX > (DRAW_WIDTH / 30) * 23
        ? (isNegative ? GradientColors.negative[1] + "66" : GradientColors.positive[1] + "66")
        : "#CDD8D366";
      ctx.arc(pointX, pointY, 3, 0, 2 * Math.PI);
      ctx.fill();

      ctx.restore();

      setHoverDataPoint(closestPoint);
    });

    canvas.addEventListener("mouseleave", () => {
      // setHoveredIndex(null);
      setHoverDataPoint(null);
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    });

    return () => {
      canvas.removeEventListener("mousemove", () => { });
      canvas.removeEventListener("mouseleave", () => { });
    };
  }, [hoverCanvasRef, data, dataMax, dataMin, isNegative, todayUTCStart, calculateYCoord, setHoverDataPoint]);

  return (
    <>
      <div className="relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute -top-[4px]" />
        <canvas ref={hoverCanvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="absolute -top-[4px]" />
      </div>
    </>
  );
}

type CanvasSparklineContextType = {
  data: [number, number][];
  change: number;
  value: number;
  hoverDataPoint: number[] | null;
  setHoverDataPoint: (value: number[] | null) => void;
};

const CanvasSparklineContext = createContext<CanvasSparklineContextType | null>(
  null,
);

export const CanvasSparklineProvider = ({
  data,
  change,
  value,
  children,
}: CanvasSparklineContextType & { children: React.ReactNode }) => {
  const [hoverDataPoint, setHoverDataPoint] = useState<number[] | null>(null);

  return (
    <CanvasSparklineContext.Provider
      value={{ data, change, value, hoverDataPoint, setHoverDataPoint }}
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
