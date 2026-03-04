import { GTPChartSeries } from "@/components/GTPButton/GTPChart";
import { EventExample } from "./types";

const PECTRA_SERIES: GTPChartSeries[] = [
  {
    name: "Active Validators (k)",
    color: "#FE5468",
    seriesType: "line",
    data: [
      [1740787200000, 1052],
      [1741392000000, 1051],
      [1741996800000, 1050],
      [1742601600000, 1048],
      [1743206400000, 1047],
      [1743811200000, 1045],
      [1744416000000, 1043],
      [1745020800000, 1040],
      [1745625600000, 870],
      [1746230400000, 810],
      [1746835200000, 770],
      [1747440000000, 748],
      [1748044800000, 735],
      [1748649600000, 725],
    ],
  },
  {
    name: "Staking APR (%)",
    color: "#FFC300",
    seriesType: "line",
    data: [
      [1740787200000, 3.6],
      [1741392000000, 3.6],
      [1741996800000, 3.7],
      [1742601600000, 3.6],
      [1743206400000, 3.7],
      [1743811200000, 3.7],
      [1744416000000, 3.7],
      [1745020800000, 3.8],
      [1745625600000, 4.2],
      [1746230400000, 4.5],
      [1746835200000, 4.7],
      [1747440000000, 4.8],
      [1748044800000, 4.9],
      [1748649600000, 5.0],
    ],
  },
];

const pectraEvent: EventExample = {
  title: "Pectra Upgrade",
  description: "Active validator count and staking APR following EIP-7251 validator consolidation.",
  question: "How did Pectra change Ethereum staking?",
  image: "gtp-metrics-total-value-secured",
  link: "/quick-bites/pectra",
  series: PECTRA_SERIES,
};

export default pectraEvent;
