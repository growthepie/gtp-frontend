import { createContext, useContext, useState, useMemo } from "react";

type UIContextState = {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
};

const UIContext = createContext<UIContextState>({
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  toggleSidebar: () => {},
  toggleMobileSidebar: () => {},
});

export const useUIContext = () => useContext(UIContext);

export const UIContextProvider = ({ children }) => {
  const [state, setState] = useState<UIContextState>({
    isSidebarOpen: true,
    isMobileSidebarOpen: false,
    toggleSidebar: () => {},
    toggleMobileSidebar: () => {},
  });

  const value = useMemo<UIContextState>(() => {
    const toggleSidebar = () =>
      setState({
        ...state,
        isSidebarOpen: !state.isSidebarOpen,
      });

    const toggleMobileSidebar = () =>
      setState({
        ...state,
        isMobileSidebarOpen: !state.isMobileSidebarOpen,
      });

    return {
      ...state,
      toggleSidebar,
      toggleMobileSidebar,
    };
  }, [state]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
