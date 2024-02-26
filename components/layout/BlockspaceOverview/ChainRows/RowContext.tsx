// RowContext.js
import React, { createContext, useContext } from "react";

const RowContext = createContext();

export const useRowContext = () => useContext(RowContext);

export const RowProvider = ({ children, value }) => {
  return <RowContext.Provider value={value}>{children}</RowContext.Provider>;
};

export default RowContext;

{
  /* <RowProvider
value={{
  data,
  selectedMode,
  forceSelectedChain,
  isCategoryHovered,
  selectedCategory,
  selectedChain,
  selectedTimespan,
  selectedValue,
  categories,
  allCats,
  setSelectedChain,
  setSelectedCategory,
  setAllCats,
  setIsCategoryHovered,
}}
>
<RowContainer />
</RowProvider> 

RowProvider Usage Example
*/
}
