import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AllChainsByKeys,
  EnabledChainsByKeys,
  Get_SupportedChainKeys,
} from "@/lib/chains";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import moment from "moment";
import { useTransition } from "@react-spring/web";
import Link from "next/link";
import Icon from "../layout/Icon";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/layout/Tooltip";

/**
 * Renders a table displaying metrics for a given data set.
 *
 * @param {Object} props - The component props.
 * @param {any} props.data - The data to be displayed in the table.
 * @param {any} props.chains - The chains data.
 * @param {any} props.selectedChains - The selected chains.
 * @param {Function} props.setSelectedChains - The function to set the selected chains.
 * @param {string} props.metric - The metric to be displayed.
 * @param {any} props.master - The master data.
 * @param {boolean} props.interactable - Whether the table is interactable.
 * @return {JSX.Element} The rendered table component.
 */
const MetricTable = ({
  data,
  chains,
  selectedChains,
  setSelectedChains,
  metric,
  master,
  interactable,
}: {
  data: any;
  chains: any;
  selectedChains: any;
  setSelectedChains: any;
  metric: string;
  master: any;
  interactable: boolean;
}) => {
  const [_maxVal, setMaxVal] = useState(0);

  const { theme } = useTheme();

  // set maxVal
  useEffect(() => {
    if (!data) return;

    setMaxVal(
      Math.max(
        ...Object.keys(data.chains)
          .filter(
            (chain) =>
              Object.keys(EnabledChainsByKeys).includes(chain) &&
              EnabledChainsByKeys[chain].chainType != null &&
              EnabledChainsByKeys[chain].chainType != "L1" &&
              data.chains[chain]?.users > 0,
          )
          .map((chain) => {
            return data.chains[chain]?.users > 0
              ? data.chains[chain]?.users
              : -1;
          }),
      ),
    );
  }, [data, data.chains]);

  const lastValsByChainKey = useMemo(() => {
    if (!data) return {};
    return Object.keys(data.chains)
      .filter((chain) => {
        return Object.keys(EnabledChainsByKeys).includes(chain);
      })
      .reduce((acc, chain) => {
        acc[chain] =
          data.chains[chain]?.users > 0 ? data.chains[chain]?.users : -1;
        return acc;
      }, {});
  }, [data]);

  const rows = useCallback(() => {
    if (!data) return [];

    return Object.keys(data.chains)
      .filter((chain) => {
        return (
          Object.keys(EnabledChainsByKeys).includes(chain) &&
          data.chains[chain]?.users > 0
        );
      })
      .map((chain: any) => {
        return {
          data: data[chain],
          chain: EnabledChainsByKeys[chain],
          lastVal: data.chains[chain]?.users,
        };
      })
      .filter(
        (row) => row.chain.chainType != null && row.chain.chainType != "L1",
      )
      .sort((a, b) => {
        // sort by last value in daily data array and keep unselected chains at the bottom in descending order
        if (selectedChains.includes(a.chain.key)) {
          if (selectedChains.includes(b.chain.key)) {
            return b.lastVal - a.lastVal;
          } else {
            return -1;
          }
        } else {
          if (selectedChains.includes(b.chain.key)) {
            return 1;
          } else {
            return b.lastVal - a.lastVal;
          }
        }
      });
  }, [data, selectedChains]);

  let height = 0;
  const transitions = useTransition(
    rows()
      .filter((row) => {
        const name = row.chain.key;
        const supportedChainKeys = Get_SupportedChainKeys(master);
        return supportedChainKeys.includes(name);
      })
      .map((data) => ({
        ...data,
        y: (height += 39) - 39,
        height: 39,
      })),
    {
      key: (d) => d.chain.key,
      from: { opacity: 0, height: 0 },
      leave: { opacity: 0, height: 0 },
      enter: ({ y, height }) => ({ opacity: 1, y, height }),
      update: ({ y, height }) => ({ y, height }),
      config: { mass: 5, tension: 500, friction: 100 },
      trail: 25,
    },
  );

  const monthsSinceLaunch = useMemo(() => {
    let result = {};
    for (const chain of Object.keys(master.chains)) {
      const diff = moment.duration(
        moment().diff(moment(master.chains[chain].launch_date)),
      );
      result[chain] = [diff.years(), diff.months()];
    }
    return result;
  }, [master]);

  return (
    <Table>
      {/* <TableCaption>A list of your recent invoices.</TableCaption> */}
      <TableHeader>{<HeaderRowsTable />}</TableHeader>
      <TableBody>
        {transitions((_style, item, _t, index) => {
          return (
            <TableRow key={item.chain.key}>
              {Object.keys(data.chains).length ? (
                RowItem({
                  item,
                  selectedChains,
                  theme,
                  data,
                  monthsSinceLaunch,
                  lastValsByChainKey,
                  index,
                })
              ) : (
                <TableCell>Sin datos</TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

/**
 * Renders a table header row with column names and corresponding styles.
 *
 * @return {JSX.Element} The rendered table header row.
 */
const HeaderRowsTable = (): JSX.Element => {
  const headerNames = [
    {
      style: "w-[25%]",
      name: "Chain",
      hasTooltip: false,
    },
    {
      style: "w-[12%]",
      name: "Stage",
      hasTooltip: false,
    },
    {
      style: "w-[38%]",
      name: "Risk",
      hasTooltip: false,
    },
    {
      style: "w-[12%]  text-right capitalize relative pr-[60px] lg:pr-8",
      name: "TVL",
      hasTooltip: true,
    },
    {
      style: "w-[13%] text-right capitalize pr-14 lg:pr-8 text-right relative",
      name: "Re-stakers",
      hasTooltip: true,
    },
  ];
  return (
    <TableRow>
      {headerNames.map((header) => {
        return (
          <TableHead key={header.name} className={header.style}>
            {header.name}
            {header.hasTooltip && (
              <Tooltip placement="left">
                <TooltipTrigger className="absolute right-[26px] lg:-right-[2px] top-0 bottom-0">
                  <Icon icon="feather:info" className="w-6 h-6" />
                </TooltipTrigger>
                <TooltipContent className="z-[110]">
                  <div className="p-3 text-sm bg-forest-100 dark:bg-[#4B5553] text-forest-900 dark:text-forest-100 rounded-xl shadow-lg flex flex-col">
                    <div>
                      Number of distinct active addresses in last 7 days and
                      share of total L2 addresses.
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </TableHead>
        );
      })}
    </TableRow>
  );
};

/**
 * Renders a row item component with various data fields.
 *
 * @param {Object} rowData - An object containing the following properties:
 *   - item: The item data.
 *   - selectedChains: An array of selected chain keys.
 *   - theme: The theme.
 *   - data: The data object.
 *   - monthsSinceLaunch: An object containing the months since launch for each chain.
 *   - lastValsByChainKey: An object containing the last values for each chain.
 * @return {JSX.Element} The rendered row item component.
 */
const RowItem = (rowData: any): JSX.Element => {
  const {
    item,
    selectedChains,
    theme,
    data,
    monthsSinceLaunch,
    lastValsByChainKey,
    index,
  } = rowData;
  const chains = getDataChain();
  return (
    <>
      {/* Name */}
      <TableCell className="font-medium">
        <Link
          key={item?.chain.key}
          href={`/chains/${AllChainsByKeys[item.chain.key].urlKey}`}
          className="flex gap-2 items-center"
        >
          {/* <Icon
            icon={`gtp:${item.chain.urlKey}-logo-monochrome`}
            className="h-[24px] w-[24px]"
            style={{
              color: selectedChains.includes(item.chain.key)
                ? item.chain.colors[theme ?? "dark"][1]
                : "#5A6462",
            }}
          /> */}
          {/* {data.chains[item.chain.key].chain_name} */}
          <img src={chains[index].icon} alt={`${chains[index].name}`} />
          {chains[index].name}
        </Link>
      </TableCell>
      {/* Stage */}
      <TableCell className="inline-flex text-right">
        <span>Soon</span>
        {/* <div className="ml-auto">
          {monthsSinceLaunch[item.chain.key][0] || ""}
        </div>
        <div className="text-xs font-[350] flex items-end">
          {monthsSinceLaunch[item.chain.key][0] === 0 && ""}
          {monthsSinceLaunch[item.chain.key][0] === 1 && (
            <div className="pr-2">Year</div>
          )}
          {monthsSinceLaunch[item.chain.key][0] > 1 && "Years"}
        </div>
        <div>{monthsSinceLaunch[item.chain.key][1] || ""}</div>
        <div className="text-xs font-[350]">
          {monthsSinceLaunch[item.chain.key][1] ? "mo." : ""}
        </div> */}
      </TableCell>
      {/* Risk */}
      <TableCell>
        <span>Soon</span>
        {/* {data.chains[item.chain.key].purpose && (
          <>{data.chains[item.chain.key].purpose}</>
        )} */}
      </TableCell>
      {/* TVL */}
      <TableCell className="text-right">
        <div className="flex w-full justify-end items-center pr-[60px] lg:pr-8 ">
          <div className="flex items-center text-right">
            {Intl.NumberFormat("en-GB", {
              notation: "compact",
              maximumFractionDigits: 2,
              minimumFractionDigits: 0,
            }).format(lastValsByChainKey[item.chain.key])}
          </div>
          <div className="absolute flex justify-start w-20">
            <div className="pl-[90px] leading-[1.8] text-forest-400 text-xs">
              {" "}
              {(data.chains[item.chain.key].user_share * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </TableCell>
      {/* Re-staking */}
      <TableCell>
        <div className="flex w-full justify-end items-center pr-[60px] lg:pr-8 ">
          <div className="flex items-center text-right">
            {Intl.NumberFormat("en-GB", {
              notation: "compact",
              maximumFractionDigits: 2,
              minimumFractionDigits: 0,
            }).format(lastValsByChainKey[item.chain.key])}
          </div>
          <div className="absolute flex justify-start w-20">
            <div className="pl-[90px] leading-[1.8] text-forest-400 text-xs">
              {" "}
              {(data.chains[item.chain.key].user_share * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </TableCell>
    </>
  );
};

const getDataChain = () => {
  return [
    {
      icon: "/icons/exchange/eigen-layer-icon.png",
      name: "Eigen Layer",
    },
    { icon: "/icons/exchange/symbiotic.svg", name: "Symbiotic" },
    { icon: "/icons/exchange/karak.svg", name: "Karak" },
  ];
};

export { MetricTable };
