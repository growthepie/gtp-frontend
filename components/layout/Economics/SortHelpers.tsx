import { ChainBreakdownResponse } from "@/types/api/EconomicsResponse";
import { MasterResponse } from "@/types/api/MasterResponse";

interface DAvailability {
  icon: string;
  label: string;
}

function dataAvailToObject(x: string): DAvailability {
  let retObject: DAvailability = {
    icon: "", // Default value for icon
    label: "", // Default value for label
  };
  if (typeof x === "string") {
    // Ensure x is a string
    if (x.includes("calldata")) {
      retObject = {
        icon: "calldata",
        label: "Calldata",
      };
    }

    if (x.includes("blobs")) {
      retObject = {
        icon: "blobs",
        label: "Blobs",
      };
    }

    if (x.includes("MantleDA")) {
      retObject = {
        icon: "customoffchain",
        label: "MantleDA",
      };
    }

    if (x.includes("DAC")) {
      retObject = {
        icon: "committee",
        label: "DAC (committee)",
      };
    }

    if (x.includes("Celestia")) {
      retObject = {
        icon: "celestiafp",
        label: "Celestia",
      };
    }

    if (x.includes("EigenDA")) {
      retObject = {
        icon: "da-eigenda-logo-monochrome",
        label: "EigenDA",
      };
    }


    if (x.includes("memo")) {
      retObject = {
        icon: "memofp",
        label: "Memo",
      };
    }
  }
  return retObject;
}

export function sortByDataAvailability(
  data: ChainBreakdownResponse,
  master: MasterResponse,
  availType: string,
  sortedKeys: string[], // Pass the already sorted keys as an argument
) {
  // console.log(availType);
  // Sort the already sorted keys based on availability
  const sortedKeysWithAvailability = sortedKeys.sort((a, b) => {
    const aContainsAvail =
      dataAvailToObject(master.chains[a].da_layer).label === availType;
    const bContainsAvail =
      dataAvailToObject(master.chains[b].da_layer).label === availType;

    // Prioritize availability over existing sort order
    if (aContainsAvail && !bContainsAvail) return -1;
    if (!aContainsAvail && bContainsAvail) return 1;

    // If both have the same availability status, maintain the existing sort order
    return 0;
  });

  // console.log(sortedKeysWithAvailability);

  return sortedKeysWithAvailability;
}
