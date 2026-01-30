import React from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

export interface LiveMetricDisplay {
  label: string;
  value: React.ReactNode;
  hoverLabel?: string;
  align?: "left" | "right";
  minWidthClassName?: string;
}

export interface LiveMetricHighlight extends LiveMetricDisplay {
  accentColor?: string;
  liveIcon?: GTPIconName;
}

interface LiveMetricsCardProps {
  title: string;
  icon?: GTPIconName;
  chart?: React.ReactNode;
  leftMetrics?: LiveMetricDisplay[];
  rightMetrics?: LiveMetricDisplay[];
  liveMetric?: LiveMetricHighlight;
  layout?: "stacked" | "chart-right";
  chartHeightClassName?: string;
  className?: string;
}

const MetricItem = ({ label, value, hoverLabel, align = "left", minWidthClassName }: LiveMetricDisplay) => {
  const labelClassName = hoverLabel ? "group-hover:opacity-0 transition-opacity duration-200" : "";
  const hoverClassName = hoverLabel ? "opacity-0 group-hover:opacity-100 transition-opacity duration-200" : "hidden";
  const alignClasses = align === "right" ? "items-end md:items-start" : "";
  const hoverAlignClasses = align === "right" ? "right-0 md:right-auto md:left-0" : "left-0";
  const minWidth = minWidthClassName || "min-w-[80px]";

  return (
    <div className={`flex flex-col gap-y-[2px] group ${alignClasses}`}>
      <div className="heading-small-xs numbers-sm">{value}</div>
      <div className={`relative ${minWidth}`}>
        <div className={`heading-small-xxxs text-[#5A6462] ${labelClassName}`}>{label}</div>
        {hoverLabel && (
          <div className={`heading-small-xxxs text-[#5A6462] absolute top-0 ${hoverAlignClasses} ${hoverClassName} whitespace-nowrap`}>
            {hoverLabel}
          </div>
        )}
      </div>
    </div>
  );
};

const LiveMetricsCard: React.FC<LiveMetricsCardProps> = ({
  title,
  icon,
  chart,
  leftMetrics = [],
  rightMetrics = [],
  liveMetric,
  layout = "stacked",
  chartHeightClassName,
  className = "",
}) => {
  const hasLeftMetrics = leftMetrics.length > 0;
  const hasRightMetrics = rightMetrics.length > 0;
  const hasLiveMetric = Boolean(liveMetric);
  const liveIcon = liveMetric?.liveIcon ?? "gtp-realtime";
  const isChartRight = layout === "chart-right";
  const chartHeight = chartHeightClassName || (isChartRight ? "h-[46px]" : "h-[54px]");

  const minHeightClassName = isChartRight ? "" : "min-h-[146px]";

  return (
    <div className={`bg-color-bg-default mt-[15px] xs:p-[10px] p-[15px] rounded-[15px] w-full flex flex-col gap-y-[10px] ${minHeightClassName} ${className}`.trim()}>
      <div className="flex gap-x-[10px] h-[28px] items-center relative">
        {icon && (
          <GTPIcon icon={icon} size="sm" containerClassName="!size-[28px] relative flex items-center justify-center" />
        )}
        <div className="heading-large-xs">{title}</div>
      </div>

      {chart && !isChartRight && (
        <div className={`relative transition-height pb-[15px] duration-500 w-full ${chartHeight} overflow-visible`}>
          <div className="w-full h-full xs:ml-0 -ml-[5px]">
            {chart}
          </div>
        </div>
      )}

      {chart && isChartRight && (
        <div className="flex items-center pb-[15px] gap-x-[30px] xs:pl-[0px]  pl-[5px]">
          <div className={`relative transition-height duration-500 w-full ${chartHeight} overflow-visible flex-1`}>
            <div className="w-full h-full xs:ml-0 -ml-[5px]">
              {chart}
            </div>
          </div>
          {hasLiveMetric && liveMetric && (
            <div className="flex flex-col items-end min-w-[90px]">
              <div className="numbers-2xl text-nowrap" style={{ color: liveMetric.accentColor }}>
                {liveMetric.value}
              </div>
              {liveMetric.label && (
                <div className="heading-small-xxxs text-nowrap text-[#5A6462] whitespace-nowrap">
                  {liveMetric.label}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!isChartRight && (hasLeftMetrics || hasRightMetrics || hasLiveMetric) && (
        <div className="flex justify-between pb-[15px] xs:pl-[45px] pl-[5px] items-center">
          {hasLeftMetrics && (
            <div className="flex flex-col gap-y-[10px] md:flex-row md:w-full">
              {leftMetrics.map((metric, index) => (
                <MetricItem key={`${metric.label}-${index}`} {...metric} />
              ))}
            </div>
          )}

          {(hasRightMetrics || hasLiveMetric) && (
            <div className="flex flex-col-reverse gap-y-[10px] md:flex-row md:w-full md:justify-between">
              {hasRightMetrics && rightMetrics.map((metric, index) => (
                <MetricItem key={`${metric.label}-${index}`} {...metric} align={metric.align ?? "right"} />
              ))}
              {hasLiveMetric && liveMetric && (
                <div className="flex items-center gap-x-[8px] heading-small-xs group">
                  <div className="flex flex-col gap-y-[2px] items-end">
                    <div className="numbers-2xl group-hover:numbers-md transition-all duration-200" style={{ color: liveMetric.accentColor }}>
                      {liveMetric.value}
                    </div>
                    {liveMetric.label && (
                      <div className="heading-small-xxxs text-[#5A6462] group-hover:h-[10px] h-[0px] overflow-hidden transition-height duration-200">
                        {liveMetric.label}
                      </div>
                    )}
                  </div>
                  <GTPIcon icon={liveIcon} size="sm" className="mb-0.5 animate-pulse" />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMetricsCard;
