import { createContext, useContext, useState, useMemo } from "react";

type UIContextState = {
  isSidebarOpen: boolean;
  isMobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  toggleMobileSidebar: () => void;
  isSafariBrowser: boolean;
};

const UIContext = createContext<UIContextState>({
  isSidebarOpen: true,
  isMobileSidebarOpen: false,
  toggleSidebar: () => { },
  toggleMobileSidebar: () => { },
  isSafariBrowser: false,
});

export const useUIContext = () => useContext(UIContext);

export const UIContextProvider = ({ children }) => {
  const [state, setState] = useState<UIContextState>({
    isSidebarOpen: true,
    isMobileSidebarOpen: false,
    toggleSidebar: () => { },
    toggleMobileSidebar: () => { },
    isSafariBrowser: false,
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

    const isSafariBrowser = /^((?!chrome|android).)*safari/i.test(
      navigator.userAgent,
    );

    return {
      ...state,
      toggleSidebar,
      toggleMobileSidebar,
      isSafariBrowser,
    };
  }, [state]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};
