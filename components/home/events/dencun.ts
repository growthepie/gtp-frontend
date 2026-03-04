import { GTPChartSeries } from "@/components/GTPButton/GTPChart";
import { EventExample } from "./types";

const DENCUN_SERIES: GTPChartSeries[] = [
  {
    name: "L1 Base Fee (gwei)",
    color: "#FFC300",
    seriesType: "line",
    data: [
      [1705276800000, 35],
      [1705881600000, 42],
      [1706486400000, 38],
      [1707091200000, 45],
      [1707696000000, 55],
      [1708300800000, 48],
      [1708905600000, 62],
      [1709510400000, 58],
      [1710115200000, 72],
      [1710720000000, 18],
      [1711324800000, 14],
      [1711929600000, 11],
      [1712534400000, 20],
      [1713139200000, 16],
      [1713744000000, 13],
    ],
  },
  {
    name: "Avg blobs per block",
    color: "#19D9D6",
    seriesType: "line",
    data: [
      [1710720000000, 1.2],
      [1711324800000, 2.1],
      [1711929600000, 2.8],
      [1712534400000, 3.5],
      [1713139200000, 3.8],
      [1713744000000, 4.2],
    ],
  },
];

const dencunEvent: EventExample = {
  title: "Dencun Upgrade",
  description: "L1 base fees (gwei) and average blobs per block before and after EIP-4844.",
  question: "How did Dencun reshape the Ethereum fee market?",
  image: "gtp-blobs-ethereum",
  link: "/quick-bites/dencun",
  series: DENCUN_SERIES,
};

export default dencunEvent;
