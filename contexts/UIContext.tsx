import { createContext, useContext, useState, useMemo } from "react";

type UIContextState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
};

const UIContext = createContext<UIContextState>({
  isSidebarOpen: true,
  toggleSidebar: () => {},
});

export const useUIContext = () => useContext(UIContext);

export const UIContextProvider = ({ children }) => {
  const [state, setState] = useState<UIContextState>({
    isSidebarOpen: true,
    toggleSidebar: () => {},
  });

  const value = useMemo<UIContextState>(() => {
    const toggleSidebar = () =>
      setState({
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      });
    return {
      ...state,
      toggleSidebar,
    };
  }, [state]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
