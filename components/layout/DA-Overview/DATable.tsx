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
              className={`grid  pr-0.5 grid-cols-[auto_200px_200px_170px_145px_110px_110px] mb-[15px]  ${isSidebarOpen
                ? " 2xl:grid-cols-[auto_200px_200px_170px_145px_110px_110px] grid-cols-[auto_170px_180px_170px_145px_110px_110px] "
                : "xl:grid-cols-[auto_200px_200px_170px_145px_110px_110px] grid-cols-[auto_170px_180px_170px_145px_110px_110px] "
                } min-w-[1125px]`}
            >
                <div className="text-[14px] font-bold">DA Layer</div>
                <div className="text-[14px] font-bold">DA Data</div>
                <div className="text-[14px] font-bold">Fees Paid</div>
                <div className="text-[14px] font-bold">Blob Producers</div>
                <div className="text-[14px] font-bold">$ per MB</div>  
                <div className="text-[14px] font-bold">Blob Count</div> 
                <div className="text-[14px] font-bold">Bandwidth</div>   
            </div>
          </HorizontalScrollContainer>
        </>
    )
}