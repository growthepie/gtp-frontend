// tooltipWorker.ts
type TooltipPoint = {
    series: { name: string };
    y: number;
    percentage: number;
  };
  
  type WorkerInput = {
    points: TooltipPoint[];
    maxPoint: number;
    maxPercentage: number;
    chainsDict: any;
    theme: string;
    metric_id: string;
    prefix: string;
    suffix: string;
    decimals: number;
    selectedScale: string;
    showOthers: boolean;
  };
  
  self.onmessage = (e: MessageEvent<WorkerInput>) => {
    const {
      points,
      maxPoint,
      maxPercentage,
      chainsDict,
      theme,
      metric_id,
      prefix,
      suffix,
      decimals,
      selectedScale,
      showOthers,
    } = e.data;
  
    const firstTenPoints = points.slice(0, 10);
    const afterTenPoints = points.slice(10);
  
    const formatTooltipPoint = (point: TooltipPoint, isOther = false) => {
      const { series, y, percentage } = point;
      const backgroundColor = isOther ? '#E0E7E6' : chainsDict[series.name].colors[theme ?? "dark"][0];
      const name = isOther 
        ? `${afterTenPoints.length > 1 ? `${afterTenPoints.length} Others` : "1 Other"}`
        : chainsDict[series.name].name;
  
      if (selectedScale === "percentage") {
        return `
          <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
            <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${backgroundColor}"></div>
            <div class="tooltip-point-name text-xs">${name}</div>
            <div class="flex-1 text-right numbers-xs">${percentage.toFixed(2)}%</div>
          </div>
          <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
            <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
            style="width: ${(percentage / maxPercentage) * 100}%; background-color: ${backgroundColor}99;"></div>
          </div>`;
      }
  
      const value = isOther 
        ? afterTenPoints.reduce((acc, p) => acc + p.y, 0)
        : y;
  
      const formattedValue = metric_id === "fdv" || metric_id === "market_cap"
        ? shortenNumber(value).toString()
        : value.toLocaleString("en-GB", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
  
      return `
        <div class="flex w-full space-x-2 items-center font-medium mb-0.5">
          <div class="w-4 h-1.5 rounded-r-full" style="background-color: ${backgroundColor}"></div>
          <div class="tooltip-point-name text-xs">${name}</div>
          <div class="flex-1 text-right justify-end numbers-xs flex">
            <div class="${!prefix && "hidden"}">${prefix}</div>
            ${formattedValue}
            <div class="ml-0.5 ${!suffix && "hidden"}">${suffix}</div>
          </div>
        </div>
        <div class="flex ml-6 w-[calc(100% - 1rem)] relative mb-0.5">
          <div class="h-[2px] rounded-none absolute right-0 -top-[2px] w-full bg-white/0"></div>
          <div class="h-[2px] rounded-none absolute right-0 -top-[2px] bg-forest-900 dark:bg-forest-50" 
          style="width: ${(Math.max(0, value) / maxPoint) * 100}%; background-color: ${backgroundColor}99;"></div>
        </div>`;
    };
  
    let tooltipPoints = (showOthers ? firstTenPoints : points)
      .map(point => formatTooltipPoint(point))
      .join('');
  
    if (showOthers && afterTenPoints.length > 0) {
      tooltipPoints += formatTooltipPoint(afterTenPoints[0], true);
    }
  
    self.postMessage(tooltipPoints);
  };
  
  function shortenNumber(num: number): string {
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  }