import { GTPChartSeries } from "@/components/GTPButton/GTPChart";
import { EventExample } from "./types";

const L2_ACTIVITY_SERIES: GTPChartSeries[] = [
  {
    name: "L2 Txs per month (M)",
    color: "#FFC300",
    seriesType: "line",
    data: [
      [1704067200000, 95],
      [1706745600000, 105],
      [1709251200000, 120],
      [1711929600000, 155],
      [1714521600000, 162],
      [1717200000000, 170],
      [1719792000000, 185],
      [1722470400000, 192],
      [1725148800000, 198],
      [1727740800000, 210],
      [1730419200000, 225],
      [1733011200000, 240],
    ],
  },
  {
    name: "Active addresses (M)",
    color: "#19D9D6",
    seriesType: "line",
    data: [
      [1704067200000, 8.2],
      [1706745600000, 8.8],
      [1709251200000, 10.1],
      [1711929600000, 12.5],
      [1714521600000, 13.2],
      [1717200000000, 14.1],
      [1719792000000, 15.3],
      [1722470400000, 16.0],
      [1725148800000, 16.8],
      [1727740800000, 18.2],
      [1730419200000, 19.5],
      [1733011200000, 21.3],
    ],
  },
];

const l2ActivityEvent: EventExample = {
  title: "L2 Activity Growth",
  description: "Monthly L2 transaction count and active addresses across major rollups in 2024.",
  question: "Dummy: How fast is Layer 2 adoption growing?",
  image: "gtp-metrics-transaction-count",
  link: "/fundamentals/transaction-count",
  series: L2_ACTIVITY_SERIES,
};

export default l2ActivityEvent;
