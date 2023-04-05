"use client";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { useEffect, useMemo, useState } from "react";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const [metricTitle, setMetricTitle] = useState("");
  const [value, setValue] = useState("");
  /*Create some kind of map for metric cards*/

  const { chain } = params;

  return (
    <div className="pl-8 pr-16">
      {/*Header */}
      <div className="flex justify-between pt-20">
        <div className="flex gap-x-6 items-center">
          <Heading className="">{chain}</Heading>
        </div>
        <div className="flex gap-x-10 h-10">
          <button className="font-semibold text-white dark:bg-pie-500 bg-blue-600 px-10 py-0 rounded-full w-168px">
            Block Explorer
          </button>
          <button className="font-semibold text-white dark:bg-pie-500 bg-blue-600 px-10 rounded-full w-120px">
            Website
          </button>
        </div>
      </div>

      <Subheading className="text-lg font-medium mt-10 w-2/5">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry&apos;s standard dummy text
        ever since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book.
      </Subheading>

      {/*Time selection */}

      <div className="flex justify-center items-center gap-x-6 pt-8">
        <button>30 days</button>
        <button>90 days</button>
        <button>180 days</button>
        <button>1 year</button>
        <button>Maximum</button>
      </div>

      {/*Metric Title Grid*/}
      <div className="flex-col gap-y-4 pt-8">
        <div className="flex gap-x-6 justify-center items-center">
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <p>test</p>
          </div>
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <p>test</p>
          </div>
        </div>
        <div className="flex gap-x-6 justify-center items-center pt-8">
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <p>test</p>
          </div>
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <p>test</p>
          </div>
          {/*Generate cards in here in future*/}
        </div>
      </div>
    </div>
  );
};

export default Chain;
