import { createContext, useContext, useState, useMemo } from "react";

type UIContextState = {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  clientOS: string | null;
};

const UIContext = createContext<UIContextState>({
  isSidebarOpen: true,
  toggleSidebar: () => {},
  clientOS: null,
});

export const useUIContext = () => useContext(UIContext);

export const UIContextProvider = ({ children }) => {
  const [state, setState] = useState<UIContextState>({
    isSidebarOpen: true,
    toggleSidebar: () => {},
    clientOS: getOS(),
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

function getOS() {
  if (typeof window === "undefined") return "";

  var userAgent = window.navigator.userAgent,
    platform =
      //@ts-ignore
      window.navigator?.userAgentData?.platform || window.navigator.platform,
    macosPlatforms = ["Macintosh", "MacIntel", "MacPPC", "Mac68K"],
    windowsPlatforms = ["Win32", "Win64", "Windows", "WinCE"],
    iosPlatforms = ["iPhone", "iPad", "iPod"],
    os = "";

  if (macosPlatforms.indexOf(platform) !== -1) {
    os = "Mac OS";
  } else if (iosPlatforms.indexOf(platform) !== -1) {
    os = "iOS";
  } else if (windowsPlatforms.indexOf(platform) !== -1) {
    os = "Windows";
  } else if (/Android/.test(userAgent)) {
    os = "Android";
  } else if (/Linux/.test(platform)) {
    os = "Linux";
  }

  return os;
}
