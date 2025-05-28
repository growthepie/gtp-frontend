"use client";
import FeesContainer from "@/components/layout/FeesContainer";
import Icon from "@/components/layout/Icon";
import Link from "next/link";
import { track } from "@vercel/analytics";
import Container from "@/components/layout/Container";
import { useMediaQuery } from "usehooks-ts";
import Share from "@/components/Share";
import { MasterResponse } from "@/types/api/MasterResponse";

export default function Footer({
  showCents,
  setShowCents,
  hoverSettings,
  setHoverSettings,
  selectedQuantitative,
  setSelectedQuantitative,
  metrics,
  setMetrics,
  enabledMetricsCount,
  metricCategories,
  master,
}: {
  showCents: boolean;
  setShowCents: React.Dispatch<React.SetStateAction<boolean>>;
  hoverSettings: boolean;
  setHoverSettings: React.Dispatch<React.SetStateAction<boolean>>;
  selectedQuantitative: string;
  setSelectedQuantitative: React.Dispatch<React.SetStateAction<string>>;
  metrics: {
    [key: string]: {
      width: number;
      enabled: boolean;
    };
  };
  setMetrics: React.Dispatch<
    React.SetStateAction<{
      [key: string]: {
        width: number;
        enabled: boolean;
      };
    }>
  >;
  enabledMetricsCount: number;
  metricCategories: string[];
  master: MasterResponse | undefined;
}) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  return (
    <div
      className={
        "fixed bottom-[20px] md:bottom-0 left-0 right-0 flex flex-col-reverse md:flex-col justify-center px-[20px] z-20"
      }
    >
      <div className="relative pointer-events-none">
        <div
          className="bg-[#151a19] z-10 md:hidden fixed inset-0 pointer-events-none"
          style={{
            backgroundPosition: "bottom",
            maskImage: `linear-gradient(to top, white 0, white 80px, transparent 120px`,
          }}
        >
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      <FeesContainer className="max-w-[650px] md:min-w-[650px] md:max-w-[750px] flex justify-center md:justify-start z-20">
        <div className="w-full flex flex-col md:flex-row justify-center items-center md:justify-start gap-y-[10px] md:gap-x-[15px] px-[15px] pb-[2px] md:pb-[20px]">
          <div
            className={`flex items-center md:h-[50px] text-[12px] text-[#CDD8D3] dark:text-[#CDD8D3] gap-x-[5px] md:gap-x-[15px]`}
          >
            <Link
              href="/privacy-policy"
              className="underline"
              passHref
              target="_blank"
              rel="noopener"
              aria-label="Privacy Policy"
              onClick={() =>
                track("click", { location: "footer", link: "privacy-policy" })
              }
            >
              Privacy Policy
            </Link>
            <Link
              href="/imprint"
              className="underline"
              passHref
              target="_blank"
              rel="noopener"
              aria-label="Imprint"
              onClick={() =>
                track("click", { location: "footer", link: "imprint" })
              }
            >
              Imprint
            </Link>
            <Link
              href="https://discord.com/channels/1070991734139531294/1095735245678067753"
              className="underline"
              passHref
              target="_blank"
              rel="noopener"
              aria-label="Feedback"
              onClick={() =>
                track("click", { location: "footer", link: "feedback" })
              }
            >
              Feedback
            </Link>
          </div>
          <div className="text-[12px]">
            © {new Date().getFullYear()} growthepie 🥧📏
          </div>
        </div>
      </FeesContainer>
      {isMobile && (
        <div className={`w-[100%] mb-2 z-10`}>
          <div className="relative flex p-[5px] items-center justify-between rounded-full mt-[16px] bg-[#344240]  shadow-[0px_0px_50px_0px_#000000]">
            <Link
              className="flex items-center w-[44px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full p-[10px] gap"
              href="https://www.growthepie.xyz/"
              target="_blank"
            >
              <div className="w-6 h-6 z-[49]">
                <Icon icon="gtp:house" className="h-6 w-6" />
              </div>
            </Link>
            <div className="flex items-center gap-x-[10px]">
              <div
                className={`flex items-center relative w-[44px] h-[44px] bg-[#1F2726] gap-x-[10px] rounded-full px-[10px] py-[10px] gap transition-all z-20 duration-300 cursor-pointer ${
                  hoverSettings
                    ? "w-[308px] justify-start"
                    : "w-[128px] justify-start"
                }`}
                onClick={() => {
                  setHoverSettings(!hoverSettings);
                }}
              >
                <Icon
                  icon="gtp:gtp-settings"
                  className={`h-6 w-6 ${hoverSettings ? "text-sm" : ""}`}
                />
              </div>

              <Share />
            </div>
          </div>
        </div>
      )}
      {isMobile && (
        <div
          className={`absolute bottom-10 bg-[#151A19] rounded-2xl z-0  left-0 right-0 mx-auto transition-all duration-[290ms] overflow-hidden px-2 ${
            hoverSettings
              ? "w-[90vw] shadow-[0px_4px_46.2px_0px_#000000] opacity-100"
              : "w-[0px] shadow-transparent opacity-0"
          }`}
          style={{
            height: hoverSettings
              ? `calc(160px + 28px + 28px * (1 + ${
                  Object.keys(metrics).length
                }))`
              : "10px",
          }}
          onMouseEnter={() => {
            setHoverSettings(true);
          }}
          onMouseLeave={() => {
            setHoverSettings(false);
          }}
        >
          <div
            className={`pt-[5px] flex flex-col w-full`}
          >
            <div className="flex flex-col w-full">
              <div className="flex items-center w-full">
                <div className="flex flex-col gap-y-2 text-[12px] pt-[10px] w-full pl-[15px] pr-[15px]">
                  <div className="font-normal text-forest-500/50 text-right">
                    Units
                  </div>
                  <div className="grid grid-cols-[130px,6px,auto] gap-x-[10px] items-center w-full place-items-center whitespace-nowrap">
                    <div className="flex flex-1 items-center place-self-end">
                      <Icon
                        icon="gtp:gtp-dollar"
                        className={`h-[15px] w-[15px] font-[900] text-[#CDD8D3] relative ${
                          hoverSettings ? "text-sm" : ""
                        }`}
                      />
                      <div className="font-semibold text-right pl-[8px]">
                        USD Display
                      </div>
                    </div>
                    {/* <div className="flex gap-x-[10px] items-center"> */}
                    <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                    <div
                      className="relative w-full h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                      onClick={() => {
                        setShowCents(!showCents);
                      }}
                    >
                      <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px]">
                        <div className="w-full flex items-start justify-center">
                          Full Dollar
                        </div>
                        <div
                          className={`w-full text-center ${
                            !showCents && "opacity-50"
                          }`}
                        >
                          US Cents
                        </div>
                      </div>
                      <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                        <div
                          className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                          style={{
                            transform: !showCents
                              ? "translateX(0%)"
                              : "translateX(100%)",
                          }}
                        >
                          {!showCents ? "Full Dollar" : "US cents"}
                        </div>
                      </div>
                    </div>
                    {/* </div> */}
                  </div>
                  {master &&
                    metricCategories.map((categoryKey) => {
                      return (
                        <div
                          className="flex flex-col gap-y-2 text-[12px] pt-[10px] w-full pl-[8px]"
                          key={categoryKey + "_category"}
                        >
                          <div className="font-normal text-forest-500/50 text-right">
                            {categoryKey + " Metrics"}
                          </div>
                          {master &&
                            Object.keys(master.fee_metrics)
                              .filter(
                                (metricKey) =>
                                  metrics[metricKey] &&
                                  master.fee_metrics[metricKey].category ==
                                    categoryKey,
                              )
                              .sort(
                                (a, b) =>
                                  master.fee_metrics[a].priority -
                                  master.fee_metrics[b].priority,
                              )
                              .map((metric) => {
                                const enabledMetricKeysByPriority = Object.keys(
                                  metrics,
                                )
                                  .filter(
                                    (metricKey) => metrics[metricKey].enabled,
                                  )
                                  .sort(
                                    (a, b) =>
                                      master.fee_metrics[b].priority -
                                      master.fee_metrics[a].priority,
                                  );

                                return (
                                  <div
                                    className="grid grid-cols-[130px,6px,auto] gap-x-[10px] items-center w-full place-items-center whitespace-nowrap"
                                    key={metric + "_settings"}
                                  >
                                    <div className="flex flex-1 items-center place-self-end">
                                      <Icon
                                        icon=""
                                        className={`h-[15px] w-[15px] font-[900] text-[#CDD8D3] relative self-center justify-self-center ${
                                          hoverSettings ? "text-sm" : ""
                                        }`}
                                      />
                                      <div className="flex-1 font-semibold">
                                        {master.fee_metrics[metric].name}
                                      </div>
                                    </div>
                                    {/* <div className="flex gap-x-[10px] items-center"> */}
                                    <div className="rounded-full w-[6px] h-[6px] bg-[#344240]" />
                                    <div
                                      className="relative w-full h-[19px] rounded-full bg-[#CDD8D3] p-0.5 cursor-pointer text-[12px]"
                                      onClick={() => {
                                        if (
                                          enabledMetricsCount > 1 ||
                                          !metrics[metric].enabled
                                        ) {
                                          if (
                                            metrics[metric].enabled &&
                                            selectedQuantitative === metric
                                          ) {
                                            for (const metricKey of Object.keys(
                                              metrics,
                                            )) {
                                              if (
                                                metrics[metricKey].enabled &&
                                                metricKey !== metric
                                              ) {
                                                setSelectedQuantitative(
                                                  metricKey,
                                                );
                                                break; // Exit loop once the first enabled metric is found
                                              }
                                            }
                                          }
                                          if (!metrics[metric].enabled) {
                                            setSelectedQuantitative(metric);
                                          }

                                          const prevMetrics = { ...metrics };

                                          const isEnabling =
                                            !prevMetrics[metric].enabled;

                                          // if enabling another metric will exceed the limit of 4 enabled metrics, disable the previously enabled metric with the lowest priority
                                          if (
                                            isEnabling &&
                                            enabledMetricsCount === 6
                                          ) {
                                            const lowestPriorityMetricKey =
                                              enabledMetricKeysByPriority[0];

                                            prevMetrics[
                                              lowestPriorityMetricKey
                                            ].enabled = false;
                                          }

                                          // toggle the enabled state of the metric
                                          prevMetrics[metric].enabled =
                                            !prevMetrics[metric].enabled;

                                          // set the updated metrics state
                                          setMetrics(prevMetrics);

                                          // setMetrics((prevMetrics) => ({
                                          //   ...prevMetrics,
                                          //   [metric]: {
                                          //     ...prevMetrics[metric],
                                          //     enabled: !prevMetrics[metric].enabled,
                                          //   },
                                          // }));
                                        }
                                      }}
                                    >
                                      <div className="w-full flex justify-between text-[#2D3748] relative bottom-[1px] ">
                                        <div className="w-full flex items-start justify-center">
                                          Enabled
                                        </div>
                                        <div
                                          className={`w-full text-center ${
                                            metrics[metric].enabled &&
                                            "opacity-50"
                                          }`}
                                        >
                                          Disabled
                                        </div>
                                      </div>
                                      <div className="absolute inset-0 w-full p-[1.36px] rounded-full text-center">
                                        <div
                                          className="w-1/2 h-full bg-forest-50 dark:bg-forest-900 rounded-full flex items-center justify-center transition-transform duration-300"
                                          style={{
                                            transform: metrics[metric].enabled
                                              ? "translateX(0%)"
                                              : "translateX(100%)",
                                          }}
                                        >
                                          {metrics[metric].enabled
                                            ? "Enabled"
                                            : "Disabled"}
                                        </div>
                                      </div>
                                    </div>
                                    {/* </div> */}
                                  </div>
                                );
                              })}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
