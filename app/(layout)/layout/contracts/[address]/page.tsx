"use client";
import { ContractsURL } from "@/lib/urls";
import { Contract } from "@/types/api/ContractsResponse";
import { ContractsResponse } from "@/types/api/ContractsResponse";
import useSWR from "swr";

// async function getContracts() {
//   const res = await fetch(ContractsURL);
//   const json = await res.json();
//   return json.slice(0, 10);
// }

export default function ContractsPage({ params }: { params: any }) {
  const {
    data: contracts,
    error: contractsError,
    isLoading: contractsLoading,
    isValidating: contractsValidating,
  } = useSWR<ContractsResponse>(ContractsURL);

  return (
    <div>
      <div>search: {params.address}</div>
      <pre>
        {contracts &&
          JSON.stringify(
            contracts.filter((c) => {
              return c.address
                .toLowerCase()
                .includes(params.address.toLowerCase());
            }),
            null,
            2,
          )}
      </pre>
    </div>
  );
}
