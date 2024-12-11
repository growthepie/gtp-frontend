"use client"
import HorizontalScrollContainer from "@/components/HorizontalScrollContainer"
import { useUIContext } from "@/contexts/UIContext";

export default function DATable(){

    const { isSidebarOpen } = useUIContext();

    return (
        <>
          <HorizontalScrollContainer
            includeMargin={true}
            className="w-full flex flex-col "
          >
            <div
              className={`grid  pr-0.5 grid-cols-[auto_182px_199px_114px_240px_102px_136px] mb-[15px]  ${isSidebarOpen
                ? " 2xl:grid-cols-[auto_182px_199px_114px_240px_102px_136px] grid-cols-[auto_182px_199px_114px_240px_102px_136px] "
                : "xl:grid-cols-[auto_182px_199px_114px_240px_102px_136px] grid-cols-[auto_182px_199px_114px_240px_102px_136px] "
                } min-w-[1125px]`}
            >
                <div className="text-[14px] font-bold">DA Layer</div>
                <div className="text-[14px] font-bold">Data Posted</div>
                <div className="text-[14px] font-bold">Fees Paid</div>
                <div className="text-[14px] font-bold">Fees/MB</div>
                <div className="text-[14px] font-bold">DA Consumers(Total | Chains)</div>  
                <div className="text-[14px] font-bold">Blob Count</div> 
                <div className="text-[14px] font-bold">Fixed Parameters</div>   
            </div>
          </HorizontalScrollContainer>
        </>
    )
}