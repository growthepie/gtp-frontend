import React, { createContext, useContext } from "react";
import { ContractContainerInterface } from "./ContextInterface";
import { MasterResponse } from "@/types/api/MasterResponse";

// same order as above
const defaultValue: ContractContainerInterface = {
  data: {},
  master: {} as MasterResponse,
  categories: {},
  timespans: {},
  standardChainKey: "",

  selectedMode: "txcount_absolute",
  selectedValue: "absolute",
  selectedTimespan: "max",

  selectedCategory: "",
  setSelectedCategory: () => {},

  selectedChain: null,
  setSelectedChain: () => {},

  selectedChains: [],
  selectedSubcategories: [],

  allCats: false,
  setAllCats: () => {},

  forceSelectedChain: "",
  formatSubcategories: (str) => str, 
}; // Define your default context value here

const ContractContext = createContext(defaultValue);

export const useContractContext = () => useContext(ContractContext);

export const ContractProvider = ({ children, value }) => {
  return (
    <ContractContext.Provider
      // merge the default value with the value passed in
      value={{
        ...defaultValue,
        ...value,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export default ContractContext;
