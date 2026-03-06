// Modular ECharts setup — imports only the chart types and components we use.
// Using "echarts/core" instead of "echarts" reduces the echarts bundle by ~80%
// and dramatically improves Next.js HMR performance (fixes incomplete loads / tab freezes).

import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  CanvasRenderer,
]);

export { echarts };
