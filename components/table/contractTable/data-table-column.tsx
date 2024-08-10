import { Button } from "@/components/ui/Button";
import { TableHead, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Checked } from "@/components/types/common";

export const TableHeaderRow = (columns: any[]) => {
  return (
    <TableRow>
      {columns.map((header) => (
        <TableHead key={header.name} className={header.style}>
          {header.hasTooltip ? (
            <CheckboxDropdownMenu
              btnName={header.name}
              dropdownMenuLabel={header.name}
            />
          ) : (
            <span>{header.name}</span>
          )}
        </TableHead>
      ))}
    </TableRow>
  );
};

const CheckboxDropdownMenu = ({ btnName, dropdownMenuLabel }: any) => {
  const [showStatusBar, setShowStatusBar] = useState<Checked>(true);
  const [showPanel, setShowPanel] = useState<Checked>(false);

  return (
    <Button variant="outline" className="bg-[#374240] rounded-xl">
      {btnName}
      {/* <Icon icon="feather:plus" className="w-5 h-5" /> */}
    </Button>
    //   <DropdownMenu>
    //     <DropdownMenuTrigger asChild>
    // <Button variant="outline" className="bg-[#374240] rounded-xl">
    //   {btnName}
    //   {/* <Icon icon="feather:plus" className="w-5 h-5" /> */}
    // </Button>
    //     </DropdownMenuTrigger>
    //     <DropdownMenuContent className="w-56 bg-[black]">
    //       <DropdownMenuLabel>{dropdownMenuLabel}</DropdownMenuLabel>
    //       <DropdownMenuSeparator />
    //       <DropdownMenuCheckboxItem
    //         checked={showStatusBar}
    //         onCheckedChange={setShowStatusBar}
    //       >
    //         Status Bar
    //       </DropdownMenuCheckboxItem>
    //       <DropdownMenuCheckboxItem
    //         checked={showPanel}
    //         onCheckedChange={setShowPanel}
    //       >
    //         Panel
    //       </DropdownMenuCheckboxItem>
    //     </DropdownMenuContent>
    //   </DropdownMenu>
    // );
  );
};
