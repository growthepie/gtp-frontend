import React, { createContext, useContext } from "react";

const ContractContext = createContext();

export const useContractContext = () => useContext(ContractContext);

export const ContractProvider = ({ children, value }) => {
  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};

export default ContractContext;
