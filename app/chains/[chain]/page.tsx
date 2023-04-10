"use client";
import { useEffect, useMemo, useState } from "react";
import {
  BanknotesIcon
} from "@heroicons/react/24/solid";
import {
  ArrowTopRightOnSquareIcon,
  LinkIcon
} from '@heroicons/react/24/outline'
import { dataTool } from "echarts";
import { Time } from "highcharts";


const Chain = ({ params }: { params: any }) => {
  // const params = useSearchParams();
  // const chain = params.get("chain");
  const [metricTitle, setMetricTitle] = useState("");
  const [value, setValue] = useState("");
  const [buttons, setButtons] = useState()
  /*Create some kind of map for metric cards*/
  const { chain } = params;


  return (
    <div className="mx-auto pt-10 w-[88rem]">
        {/*Header */}
      <div className="ml-12 mr-16">
        <div className="flex justify-between items-center">
            <div className="flex gap-x-6 items-center">
              <h1 className="h-14 text-5xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282] dark:text-forest-100">{String(chain).charAt(0).toUpperCase() + String(chain).slice(1)}</h1>
              
              {/*Uppercase first letter */}
            </div>
            <div className="flex gap-x-10 h-10">
              <div className="flex justify-between text-white dark:bg-pie-500 bg-blue-600 w-44 py-0 rounded-full w-168px pl-4 pr-6">
                <LinkIcon className="h-4 w-4 self-center" />
                <p className="self-center font-semibold">Block Explorer</p>
              </div>
              <div className="flex justify-between text-white dark:bg-pie-500 bg-blue-600 w-32 py-0 rounded-full w-168px pl-4 pr-6">
                <ArrowTopRightOnSquareIcon className="h-4 w-4 self-center" />
                <p className="self-center font-semibold">Website</p>
              </div>
            </div>
        </div>
      
      <h1 className="text-lg text-gray-500 pt-4 font-[600] w-2/5">
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industrys standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book.
      </h1>
      </div>
      {/*Time selection */}

      <div className="flex justify-center items-center gap-x-6 pt-8">
        

        {/*{Timestamps.map((selection) => (
          <button key={selection.key}   onClick={() => {
            updateButton(selection.key);
            console.log(selection.value)
          }}
            className={`${selection.value ? 'bg-blue-500 text-white py-1.5 px-4 font-[600]' : 'bg-none'} rounded-full self-center`} >
              {selection.name}
          </button>
        ))}*/}
      </div>

      {/*Metric Title Grid*/}
      <div className="flex-col pt-8">
        <div className="flex gap-x-6 justify-center items-center">
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282]">Metric Title</h1>
            <BanknotesIcon className="relative h-[75px] w-[94px] text-blue-500 bottom-[1.7rem] left-[32rem] mr-4"/>
            <div className="flex pt-24 pl-6 pr-6 justify-between">
              <h1 className="text-white text-4xl font-[700]">10,000,000</h1>
              <h1 className="text-white text-xl font-[700] self-center">5 April 2023</h1>
            </div>
          </div>
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282]">Metric Title</h1>
            </div>
          </div>
        </div>
        <div className="flex gap-x-6 justify-center items-center pt-8">
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282]">Metric Title</h1>
            </div>
          </div>
          <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
            <div className="dark:bg-pie-500 bg-blue-600 rounded-xl w-[40rem] h-[20rem]">
              <h1 className="pt-[1rem] pl-6 text-3xl font-[700] text-transparent bg-gradient-to-r bg-clip-text  from-[#9DECF9] to-[#2C5282]">Metric Title</h1>
            </div>
          </div>
          {/*Generate cards in here in future*/}
        </div>
      </div>
    </div>
  );
};

export default Chain;
