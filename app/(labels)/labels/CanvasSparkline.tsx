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

export default function CanvasSparkline({ chainKey }: CanvasSparklineProps) {
  const todayUTCStart = new Date().setUTCHours(0, 0, 0, 0);

  const { data, change, value, hoverValue, setHoverValue } =
    useCanvasSparkline();
  // creates a canvas element and draws the sparkline on it
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hoverCanvasRef = useRef<HTMLCanvasElement>(null);

  const isNegative = change < 0;

  const dataMin = Math.min(...data.map(([, y]) => y));
  const dataMax = Math.max(...data.map(([, y]) => y));

  const drawSparkline = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      const [x1, y1, x2, y2] =
        GradientStops[isNegative ? "negative" : "positive"];
      const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      const [color1, color2] =
        GradientColors[isNegative ? "negative" : "positive"];

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);

      ctx.clearRect(0, 0, 100, 20);

      // reverse so we draw from right to left
      const reversedData = data.slice().reverse();
      Array(30)
        .fill(undefined)
        .forEach((_, i) => {
          const y = reversedData[i]?.[1];

          if (y === null) return;

          let xCoord = 100 - i * (100 / 30);
          let yCoord = 20 - ((y - dataMin) / (dataMax - dataMin)) * 20;

          // to the nearest 1/2 pixel
          xCoord = Math.round(xCoord * 2) / 2;
          yCoord = Math.round(yCoord * 2) / 2;

          // if its out of bounds, bring it back in bounds
          xCoord = Math.min(Math.max(xCoord, 0), 100);
          yCoord = Math.min(Math.max(yCoord, 0), 20);

          switch (i) {
            case 0:
              ctx.beginPath();
              ctx.strokeStyle = gradient;
              ctx.lineWidth = 1;
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
      let x = e.clientX - rect.left;
      let y = e.clientY - rect.top;

      //find closest timestamp
      const xTimestamp =
        todayUTCStart - (30 - Math.floor((x / 100) * 30)) * 86400000;

      // calculate the x and y coordinates of the hovered point based on the timestamp
      let xCoord = 100 - (((todayUTCStart - xTimestamp) / 86400000) * 100) / 30;
      let yCoord = data.find(([timestamp]) => timestamp === xTimestamp)?.[1];

      if (!yCoord) return;

      // to the nearest 1/2 pixel
      x = Math.round(x * 2) / 2;
      yCoord = Math.round(yCoord * 2) / 2;

      // if its out of bounds, bring it back in bounds
      x = Math.min(Math.max(x, 0), 100);
      // yCoord = Math.min(Math.max(yCoord, 0), 20);

      // setHoveredIndex(xCoord);
      setHoverValue(
        data.find(([timestamp]) => timestamp === xTimestamp)?.[1] ?? null,
      );

      ctx.clearRect(0, 0, 100, 20);
      ctx.beginPath();
      // cursor line
      ctx.fillStyle = "#ffffff33";
      ctx.fillRect(x, 0, 1, 20);

      // place transparent circle on the sparkline to indicate the hovered point
      ctx.beginPath();

      ctx.fillStyle =
        x > (100 / 30) * 23
          ? isNegative
            ? GradientColors.negative[1] + "66"
            : GradientColors.positive[1] + "66"
          : "#CDD8D366";
      ctx.arc(
        x,
        yCoord ? 20 - ((yCoord - dataMin) / (dataMax - dataMin)) * 20 : 0,
        3,
        0,
        2 * Math.PI,
      );
      ctx.fill();
    });

    canvas.addEventListener("mouseleave", () => {
      // setHoveredIndex(null);
      setHoverValue(null);
      ctx.clearRect(0, 0, 100, 20);
    });

    return () => {
      canvas.removeEventListener("mousemove", () => {});
      canvas.removeEventListener("mouseleave", () => {});
    };
  }, [
    hoverCanvasRef,
    data,
    dataMax,
    dataMin,
    isNegative,
    setHoverValue,
    todayUTCStart,
  ]);

  return (
    <>
      <div className="w-[100px] h-[20px] relative">
        <canvas
          ref={hoverCanvasRef}
          width={100}
          height={20}
          className="absolute inset-0"
        />
        <canvas ref={canvasRef} width={100} height={20} />
      </div>
      {/* <div className="flex justify-between">
        <span>{hoveredIndex}</span>
        <span>{data[hoveredIndex]?.[1]}</span>
      </div> */}
    </>
  );
}

type CanvasSparklineContextType = {
  data: [number, number][];
  change: number;
  value: number;
  hoverValue: number | null;
  setHoverValue: (value: number | null) => void;
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
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  return (
    <CanvasSparklineContext.Provider
      value={{ data, change, value, hoverValue, setHoverValue }}
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
