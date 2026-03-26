"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type WalletContextValue = {
  walletAddress: string | null;
  isConnectingWallet: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
};

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);

  const connectWallet = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("Wallet connection must run in the browser.");
    }

    if (!window.ethereum?.request) {
      throw new Error("No injected wallet found. Install a wallet extension to submit attestations.");
    }

    setIsConnectingWallet(true);
    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(accounts[0]);
      } else {
        throw new Error("No wallet account returned.");
      }
    } finally {
      setIsConnectingWallet(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletAddress(null);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ethereum = window.ethereum;
    if (!ethereum?.request) {
      return;
    }

    let mounted = true;
    ethereum
      .request({
        method: "eth_accounts",
      })
      .then((accounts) => {
        if (!mounted) return;
        if (Array.isArray(accounts) && accounts.length > 0) {
          setWalletAddress(accounts[0]);
        } else {
          setWalletAddress(null);
        }
      })
      .catch(() => {
        /* ignore */
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const ethereum = window.ethereum;
    if (!ethereum?.on) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        return;
      }
      setWalletAddress(null);
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    return () => {
      ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
    };
  }, []);

  const value = useMemo(
    () => ({
      walletAddress,
      isConnectingWallet,
      connectWallet,
      disconnectWallet,
    }),
    [connectWallet, disconnectWallet, isConnectingWallet, walletAddress],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletConnection() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletConnection must be used within WalletProvider");
  }
  return context;
}
