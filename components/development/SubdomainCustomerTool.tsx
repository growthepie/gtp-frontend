import { MasterURL } from "@/lib/urls";
import { GTPTooltipNew, TooltipBody, TooltipHeader } from "../tooltip/GTPTooltip";

export default function SubdomainCustomerTool() {
  if (!process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN) {
    return null;
  }

  return (
    <GTPTooltipNew size="md" trigger={<div>{MasterURL.split("/").pop()}</div>}>
      <TooltipBody className="group/chains pl-[15px] flex flex-col text-xxs">
        <div><span className="font-bold">Subdomain Customer:</span> {process.env.NEXT_PUBLIC_AUTH_SUBDOMAIN}</div>
        <div><span className="font-bold">Master URL:</span> {MasterURL}</div>
      </TooltipBody>
    </GTPTooltipNew>
  );
}