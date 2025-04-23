"use client";
import { createIcon } from "@download/blockies";
import Icon from "@/components/layout/Icon";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// const provider = new EnsPlugin("0x6659C370ADF66A7DDBc931a51256DaAAF272C412", 1).address;

type AddressProps = {
  address: string;
  shortenAddress?: boolean;
};

export default function Address({ address, shortenAddress }: AddressProps) {
  const [copied, setCopied] = useState(false);

  const copyTimeout = useRef<NodeJS.Timeout | null>(null);

  const onCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    copyTimeout.current = setTimeout(() => {
      setCopied(false);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-x-[5px] rounded-full px-[2px] pr-1 py-[1px] border border-forest-900/20 dark:border-forest-500/20 text-[10px] text-forest-900/50 dark:text-forest-500/50 hover:bg-forest-900/10 dark:hover:bg-forest-500/10 select-none">
      <div className="w-3.5 h-3.5">
        <AddressIdenticon address={address} className="rounded-full" />
      </div>
      <div className="font-medium font-mono">
        {shortenAddress
          ? `${address.slice(0, 5)}...${address.slice(-4)}`
          : address}
      </div>
      <button
        onClick={onCopy}
        className="text-xs font-semibold text-forest-900/50 dark:text-forest-500/50 hover:text-forest-900 dark:hover:text-forest-500"
      >
        <Icon
          icon={copied ? "feather:check" : "feather:copy"}
          className="w-2 h-2"
        />
      </button>
      <Link
        href={`https://etherscan.io/address/${address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-semibold text-forest-900/50 dark:text-forest-500/50 hover:text-forest-900 dark:hover:text-forest-500"
      >
        <Icon icon="feather:external-link" className="w-2 h-2" />
      </Link>
    </div>
  );
}

type AddressIconProps = {
  address: string;
  className?: string;
};
export const AddressIcon = ({ address, className }: AddressIconProps) => {
  const [icon, setIcon] = useState<HTMLCanvasElement | null>(null);
  // create a blockies icon asynchrounously
  useEffect(() => {
    const icon = createIcon({ seed: address.toLowerCase() });
    setIcon(icon);
  }, [address]);

  if (!icon) {
    return null;
  }

  return (
    <Image
      src={icon.toDataURL()}
      alt="icon"
      width={24}
      height={24}
      className={className}
    />
  );
};
