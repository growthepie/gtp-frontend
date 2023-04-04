"use client";
import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import { useMetricsData } from "@/context/MetricsProvider";
import { useEffect, useMemo, useState } from "react";
import { MasterResponse } from "@/types/api/MasterResponse";

const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const [metricTitle, setMetricTitle] = useState("");
  const [value, setValue] = useState("");
  /*Create some kind of map for metric cards*/

  return (
    <div className="pl-8 pr-16">
      {/*Header */}
      <div className="flex justify-between pt-20">
        <div className="flex gap-x-6 items-center">
          <Heading className="">Chain Ex</Heading> 
        </div>
        <div className="flex gap-x-10">
          <button className="">Block Explorer</button>
          <button className="">Website</button>
        </div>
      </div>

      
      <Subheading className="text-lg font-medium mt-10 w-2/5">
        Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
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
      <div className="w-3/4 grid grid-cols-2 gap-x-6 gap-y-8 pt-8 px-14 mx-auto justify-evenly justify-center content-evenly items-center">
          <div className="bg-white rounded-md h-60">
              <h1>{metricTitle}</h1>
          </div>
          <div className="bg-white rounded-md h-60">
              <p>test</p>
          </div>
          <div className="bg-white rounded-md h-60">
              <p>test</p>
          </div>
          <div className="bg-white rounded-md h-60">
              <p>test</p>            
          </div>
          {/*Generate cards in here in future*/}
      </div>

    </div>
  );
};

export default Chain;
