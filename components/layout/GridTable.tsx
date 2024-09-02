import { useMaster } from "@/contexts/MasterContext";
import { Icon } from "@iconify/react";

export type GridTableProps = {
  gridDefinitionColumns: string;
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bar?: {
    origin_key: string;
    width: number;
  };
};

// grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// class="select-none grid gap-x-[15px] px-[6px] pt-[30px] text-[11px] items-center font-bold"
export const GridTableHeader = ({
  children,
  gridDefinitionColumns,
  className,
  style,
}: GridTableProps) => {
  return (
    <div
      className={`select-none gap-x-[10px] pl-[10px] pr-[32px] pt-[30px] text-[11px] items-center font-semibold grid ${gridDefinitionColumns} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

// grid grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px] lg:grid-cols-[32px,minmax(240px,800px),130px,120px,110px,105px,120px]
// class="gap-x-[15px] rounded-full border border-forest-900/20 dark:border-forest-500/20 px-[6px] py-[5px] text-xs items-center"
export const GridTableRow = ({
  children,
  gridDefinitionColumns,
  className,
  style,
  bar,
}: GridTableProps) => {
  const { AllChainsByKeys } = useMaster();

  if (bar)

    return (
      <div
        className={`select-text gap-x-[10px] pl-[10px] pr-[32px] py-[5px] text-xs items-center rounded-full border border-forest-900/20 dark:border-forest-500/20 grid ${gridDefinitionColumns} ${className}`}
        style={style}
      >
        {children}
        <div
          className={`absolute left-[1px] right-[1px] bottom-[0px] h-[2px] rounded-none font-semibold transition-width duration-300 z-20`}
          style={{
            background:
              AllChainsByKeys[
                bar.origin_key
              ].colors["dark"][1],
            width: bar.width * 100 + "%",
          }}
        ></div>
      </div >
    );

  return (
    <div
      className={`select-text gap-x-[10px] pl-[10px] pr-[32px] py-[5px] text-xs items-center rounded-full border border-forest-900/20 dark:border-forest-500/20 grid ${gridDefinitionColumns} ${className}`}
      style={style}
    >
      {children}

    </div>
  );
};

export const GridTableChainIcon = ({ origin_key }: { origin_key: string }) => {
  const { AllChainsByKeys } = useMaster();

  return (
    <div className="flex h-full items-center">
      {AllChainsByKeys[origin_key] && (
        <Icon
          icon={`gtp:${AllChainsByKeys[
            origin_key
          ].urlKey
            }-logo-monochrome`}
          className="w-[15px] h-[15px]"
          style={{
            color:
              AllChainsByKeys[
                origin_key
              ].colors["dark"][0],
          }}
        />
      )}
    </div>
  );
};

type GridTableHeaderCellProps = {
  children: React.ReactNode;
  metric: string;
  sort: {
    metric: string;
    sortOrder: string;
  };
  setSort: (sort: { metric: string; sortOrder: string }) => void;
  justify?: string;
  className?: string;
};

export const GridTableHeaderCell = ({ children, className, justify, metric, sort, setSort }: GridTableHeaderCellProps) => {
  let alignClass = "justify-start";
  if (justify === "end") alignClass = "justify-end -mr-[12px]";
  if (justify === "center") alignClass = "justify-center";
  return (
    <div
      className={`flex items-center ${alignClass || "justify-start"} cursor-pointer ${className}`}
      onClick={() => {
        setSort({
          metric: metric,
          sortOrder:
            sort.metric === metric
              ? sort.sortOrder === "asc"
                ? "desc"
                : "asc"
              : "desc",
        });
      }}
    >
      {children}
      <Icon
        icon={
          sort.metric === metric && sort.sortOrder === "asc"
            ? "feather:arrow-up"
            : "feather:arrow-down"
        }
        className="w-[12px] h-[12px]"
        style={{
          opacity: sort.metric === metric ? 1 : 0.2,
        }}
      />
    </div>
  );
}