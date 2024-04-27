"use client";
import Subheading from "@/components/layout/Subheading";
import { useBoolean } from "usehooks-ts";

export const OctantSubheader = () => {
  const { value, setValue, setTrue, setFalse, toggle } = useBoolean(false);
  {
    /* <div>
        <span className="font-semibold inline">Octant</span> is a Golem
        Foundation project that empowers users to direct Ethereum staking
        rewards toward impactful public goods projects.{" "}
        <button onClick={toggle}>{value ? "Read Less" : "Read More"}</button>
      </div>
      <div className={value ? "block" : "hidden"}>
        Participants lock GLM tokens to engage in a reward system over 90-day
        cycles, known as epochs. During these periods, users can either claim
        their earnings or support pre-approved projects. Contributions to these
        projects are not only amplified by matched funds from the
        foundation&apos;s staking yield but also drive the community-led
        governance that decides how these rewards are distributed.
      </div> */
  }
  return (
    <Subheading className="flex flex-col relative gap-y-[10px]">
      <div>
        <span className="font-semibold inline">Octant</span> is a Golem
        Foundation project that empowers users to direct Ethereum staking
        rewards toward impactful public goods projects.{" "}
        <button onClick={toggle} className="text-sm font-semibold">
          {value ? "Read less..." : "Read more..."}
        </button>
      </div>
      <div
        className={`text-sm transition-[max-height] duration-300 ${
          value ? "max-h-[300px]" : "max-h-0"
        } overflow-hidden`}
      >
        <p>
          Participants lock GLM tokens to engage in a reward system over 90-day
          cycles, known as epochs. During these periods, users can either claim
          their earnings or support pre-approved projects.
        </p>
        <p>
          Contributions to these projects are amplified by matched funds from
          the foundation&apos;s staking yield.
        </p>
      </div>
    </Subheading>
  );
};
