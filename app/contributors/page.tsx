import Heading from "@/components/layout/Heading";
import Subheading from "@/components/layout/Subheading";
import Image from "next/image";
import React from "react";

const Contributors = () => {
  return (
    <div className="container mx-auto px-4 py-8 flex flex-col">
      <Heading className="text-3xl">Contributors</Heading>
      <Subheading className="text-sm mt-3">
        Our fantastic contributors
      </Subheading>

      <div className="flex mt-8 space-x-2">
        <div className="basis-1/4 flex flex-col items-center p-3 bg-forest-50 rounded-lg">
          <div className="flex flex-col items-center aspect-square">
            <Image src="/contributors/mseidl.png" alt="mseidl" />
          </div>
          <div className="text-center mt-2">Matthais Seidl</div>
          <div className="flex justify-between">
            <div>Data</div>
          </div>
        </div>
        <div className="basis-1/4 flex flex-col items-center p-3 bg-forest-50 rounded-lg">
          <div className="flex flex-col items-center aspect-square">
            <Image src="/contributors/tobsch.png" alt="tobsch" />
          </div>
          <div className="text-center mt-2">Tobias Schreier</div>
          <div className="flex justify-between">
            <div>Data</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contributors;
