"use client";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import { ParsedDatum } from "@/types/api/LabelsResponse";
import { useRef } from "react";
import { createContext, useCallback, useContext, useState } from "react";

type LabelsPageContextType = {
  downloadData: ParsedDatum[];
  setDownloadData: (data: any[]) => void;
  downloadCSV: () => void;
  downloadJSON: () => void;
  tableRef: React.RefObject<HTMLDivElement>;
  contentWidth: number;
};

const LabelsPageContext = createContext<LabelsPageContextType | null>({
  downloadData: [],
  setDownloadData: () => { },
  downloadCSV: () => { },
  downloadJSON: () => { },
  tableRef: { current: null },
  contentWidth: 0,
});

export const LabelsPageProvider = ({ children }: { children: React.ReactNode }) => {
  const [downloadData, setDownloadData] = useState<ParsedDatum[]>([]);

  const [tableRef, { width: contentWidth }] = useElementSizeObserver<HTMLDivElement>();


  const downloadCSV = useCallback(() => {
    // compile CSV from data w/ headers
    const headers = [
      "Contract Address",
      "Chain ID",
      "Owner Project",
      "Contract Name",
      "Category",
      "Subcategory",
      "Deployment Date",
      "Transaction Count",
      "Gas Fees",
      "Active Addresses",
      // "Origin Key",

      "Deployment Tx",
      "Deployer Address",
    ];

    const rows = downloadData.map((label) => {
      return [
        label.address,
        label.chain_id,
        label.owner_project,
        label.name,
        label.category,
        label.subcategory,
        label.deployment_date,
        label.txcount,
        label.gas_fees_usd,
        label.daa,
        // label.origin_key,

        label.deployment_tx,
        label.deployer_address,
      ];
    });

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement
      ("a");
    a.href = url;
    a.download = "labels.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [downloadData]);


  const downloadJSON = useCallback(() => {
    const json = JSON.stringify(downloadData, null, 2);

    const blob = new Blob([json], { type: "application/json" });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "labels.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [downloadData]);




  return (
    <LabelsPageContext.Provider
      value={{ downloadData, setDownloadData, downloadCSV, downloadJSON, tableRef, contentWidth }}
    >
      {children}
    </LabelsPageContext.Provider>
  );
};

export const useLabelsPage = () => {
  const ctx = useContext(LabelsPageContext);

  if (!ctx) {
    throw new Error(
      "useMaster must be used within a MasterProvider",
    );
  }

  return ctx;
};

type Size = {
  width?: number
  height?: number
}