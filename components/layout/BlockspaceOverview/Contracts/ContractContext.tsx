import React, { createContext, useContext } from "react";

const defaultValue = {}; // Define your default context value here

const ContractContext = createContext(defaultValue);

export const useContractContext = () => useContext(ContractContext);

export const ContractProvider = ({ children, value }) => {
  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export default ContractContext;
