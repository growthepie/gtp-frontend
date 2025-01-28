"use client"
import { useEffect, useState, useMemo } from "react";
import { TopRowContainer, TopRowParent, TopRowChild } from "@/components/layout/TopRow";
import DAHeadCharts from "@/components/layout/DA-Overview/DAHeadCharts";
import DATable from "@/components/layout/DA-Overview/DATable";
import useSWR from "swr";
import { DAOverviewURL } from "@/lib/urls";
import { DAOverviewResponse } from "@/types/api/DAOverviewResponse";
import Container from "@/components/layout/Container";
import Heading from "@/components/layout/Heading";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import QuestionAnswer from "@/components/layout/QuestionAnswer";
import Link from "next/link";
import ShowLoading from "@/components/layout/ShowLoading";

export default function DAOverviewPage() {
    const [selectedTimespan, setSelectedTimespan] = useState("365d");
    const [isMonthly, setIsMonthly] = useState(false);

    const {data, error, isLoading, isValidating} = useSWR<DAOverviewResponse>(DAOverviewURL);
   
    const timespans = useMemo(() => {
        let xMax = Date.now();
    
        if (!isMonthly) {
          return {
            "1d": {
              shortLabel: "1d",
              label: "1 day",
              value: 1,
            },
            "7d": {
              shortLabel: "7d",
              label: "7 days",
              value: 7,
              xMin: xMax - 7 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "30d": {
              shortLabel: "30d",
              label: "30 days",
              value: 30,
              xMin: xMax - 30 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "90d": {
              shortLabel: "90d",
              label: "90 days",
              value: 90,
              xMin: xMax - 90 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "365d": {
              shortLabel: "1y",
              label: "1 year",
              value: 365,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
    
            max: {
              shortLabel: "Max",
              label: "Max",
              value: 0,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
          };
        } else {
          return {

            "180d": {
              shortLabel: "6m",
              label: "6 months",
              value: 180,
              xMin: xMax - 180 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
            "365d": {
              shortLabel: "1y",
              label: "1 year",
              value: 365,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },

    
            max: {
              shortLabel: "Max",
              label: "Max",
              value: 0,
              xMin: xMax - 365 * 24 * 60 * 60 * 1000,
              xMax: xMax,
            },
          };
        }
      }, [isMonthly]);

    return (
      <>
      <ShowLoading
        dataLoading={[isLoading]}
        dataValidating={[isValidating]}
      />
      <Container className={`flex flex-col w-full pt-[45px] md:pt-[30px] gap-y-[15px] `} isPageRoot >
        <div className="flex items-center h-[43px] gap-x-[8px] ">
          <Icon icon="gtp:gtp-data-availability" className="w-[24px] h-[24px]"/>
          <Heading className="text-[36px] leading-snug " as="h1">
            Data Availability Overview
          </Heading>
        </div>
        <div className="text-[14px] mb-[30px]">
          This page shows an overview of common Data Availability (DA) solutions that are used by Layer 2s. DA is becoming more and more important for the modular Layer 2 architecture. Different solutions have different trade-offs with regards to scalability, costs, and security assumptions.
        </div>
      </Container>
      <div className={`flex flex-col transition-[gap] duration-300 gap-y-[30px]`}>
        {data && (
          <>
          <div className={`flex flex-col gap-y-[15px]`}>
            <Container>
                <TopRowContainer className="-py-[3px]">
                    <TopRowParent className="-py-[10px]">
                    <TopRowChild
                        isSelected={!isMonthly}
                        onClick={() => {
                        const isTransferrableTimespan =
                            selectedTimespan === "max" || selectedTimespan === "365d";
                        if (!isTransferrableTimespan) {
                            setSelectedTimespan("max");
                        }
                        setIsMonthly(false);
                        }}
                        style={{
                        paddingTop: "10.5px",
                        paddingBottom: "10.5px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        }}
                    >
                        {"Daily"}
                    </TopRowChild>
                    <TopRowChild
                        isSelected={isMonthly}
                        onClick={() => {
                        const isTransferrableTimespan =
                            selectedTimespan === "max" || selectedTimespan === "365d";
                        if (!isTransferrableTimespan) {
                            setSelectedTimespan("max");
                        }
                        setIsMonthly(true);
                        }}
                        style={{
                        paddingTop: "10.5px",
                        paddingBottom: "10.5px",
                        paddingLeft: "16px",
                        paddingRight: "16px",
                        }}
                    >
                        {"Monthly"}
                    </TopRowChild>
                    </TopRowParent>
                    <div className="block 2xl:hidden w-[80%] mx-auto my-[10px]">
                      <hr className="border-dashed border-top-[1px] h-[0.5px] border-forest-400" />
                    </div>
                    <TopRowParent className="-py-[10px]">
                    {Object.keys(timespans).map((key) => {
                        {
                        return (
                            <TopRowChild
                            className={`px-[10px]`}
                            onClick={() => {
                                setSelectedTimespan(key);
                            }}
                            key={key}
                            style={{
                                paddingTop: "10.5px",
                                paddingBottom: "10.5px",
                                paddingLeft: "16px",
                                paddingRight: "16px",
                            }}
                            isSelected={selectedTimespan === key}
                            >
                            {selectedTimespan === key
                                ? timespans[key].label
                                : timespans[key].shortLabel}
                            </TopRowChild>
                        );
                        }
                    })}
                    </TopRowParent>
                </TopRowContainer>
              </Container>
              <DAHeadCharts selectedTimespan={selectedTimespan} isMonthly={isMonthly} data={data.data.all_da} />
              </div>
              <DATable breakdown_data={data.data.da_breakdown} selectedTimespan={selectedTimespan} isMonthly={isMonthly} />
          </>
        )}
      </div>

        <Container className="pt-[15px]">
            <QuestionAnswer
            startOpen={true}
            question="Details"
            answer={
                <>
                <div className="pb-[10px]">
                    <div>
                    Our Data Availability Overview page breaks down important metrics around DA:
                    </div>
                    <ul className="list-disc list-inside pt-[5px] text-[14px] space-y-[5px]">
                    <li>
                        <span className="font-bold">Data Posted:</span> The amount of data that was submitted to the DA layer. Different DA layers can handle different amounts of data based on their scaling capabilities.
                    </li>
                    <li>
                        <span className="font-bold">DA Fees Paid:</span> The fees collected by the DA layer for processing and storing data. This is influenced by the amount of data that was processed but also by the fee market structure and demand that a DA layer experiences.
                    </li>
                    <li>
                        <span className="font-bold">Fees/MB:</span> The average cost that a Layer 2 pays per Megabyte of data submitted. This value is important for Layer 2s since it directly influences their costs and with that potentially also the transaction costs that they pass on to their users.
                    </li>
                    <li>
                        <span className="font-bold">DA Consumers:</span> The Layer 2 networks that have submitted at least 100MB worth of data to the DA layer. Usually, a Layer 2 uses only a single DA layer. But it is also possible that Layer 2s switch between DA layers if this allows them to save costs.
                    </li>
                    </ul>
                </div>
                </>
            }
            note={
                <>
                <div>Important Notes:</div>
                <ul className="list-disc list-inside pt-[5px] text-[14px]">
                    <li>
                    In order to provide this type of analysis, we have to map Layer 2s / DA consumers to their respective onchain identifiers. This effort can easily be accessed in our{' '}
                    <Link className="underline" href="https://github.com/growthepie/gtp-dna/tree/main/economics_da" target="_blank">
                        GitHub mapping file
                    </Link>.
                    </li>
                    <li>
                    If you identify missing Layer 2s on this page, please head over to our{' '}
                    <Link className="underline" href="https://github.com/growthepie/gtp-dna/tree/main/economics_da" target="_blank">
                        GitHub
                    </Link>{' '}
                    and create a PR. This will help us to keep this page up-to-date.
                    </li>
                </ul>
                </>
            }
            />
        </Container>
      </>        
    )
}