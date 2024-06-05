import { useEffect, useRef } from "react";

type CanvasSparklineProps = {
  chainKey: string;
  data: [number, number][];
  change: number;
};

const GradientColors = {
  negative: [
    "#FE5468",
    "#FFDF27",
  ],
  positive: [
    "#10808C",

    "#1DF7EF",
  ],
};

const GradientStops = {
  negative: [3.33 * 23, 0, 100, 20],
  positive: [3.33 * 23, 0, 100, 20],
}

export default function CanvasSparkline({ chainKey, data, change }: CanvasSparklineProps) {
  // creates a canvas element and draws the sparkline on it
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isNegative = change < 0;

  const dataMin = Math.min(...data.map(([, y]) => y));
  const dataMax = Math.max(...data.map(([, y]) => y));

  const drawSparkline = (ctx: CanvasRenderingContext2D) => {
    const [x1, y1, x2, y2] = GradientStops[isNegative ? "negative" : "positive"];
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    const [color1, color2] = GradientColors[isNegative ? "negative" : "positive"];

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);


    ctx.clearRect(0, 0, 100, 20);


    // reverse so we draw from right to left
    const reversedData = data.slice().reverse();
    Array(30).fill(undefined).forEach((_, i) => {
      const y = reversedData[i]?.[1];

      if (y === null) return;

      const xCoord = 100 - i * (100 / 30);
      const yCoord = 20 - ((y - dataMin) / (dataMax - dataMin)) * 20;

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
          ctx.strokeStyle = "#CDD8D399";
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



    // ctx.strokeStyle = gradient;

    // // ctx.lineWidth = 1;
    // // ctx.stroke();
    // // ctx.closePath();
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawSparkline(ctx);
  }, [canvasRef, data]);


  return (
    <div className="w-[100px] h-[20px] relative">
      <canvas ref={canvasRef} width={100} height={20} />
    </div>
  );
}