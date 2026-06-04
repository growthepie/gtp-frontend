// Modular ECharts setup — imports only the chart types and components we use.
// Using "echarts/core" instead of "echarts" reduces the echarts bundle by ~80%
// and dramatically improves Next.js HMR performance (fixes incomplete loads / tab freezes).

import * as echarts from "echarts/core";
import { LineChart, BarChart, ScatterChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  LegendComponent,
  CanvasRenderer,
]);

export { echarts };
