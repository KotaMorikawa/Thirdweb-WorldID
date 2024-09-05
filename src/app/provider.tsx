"use client";

import { ThirdwebProvider } from "thirdweb/react";

interface WalletProviderProps {
  children: React.ReactNode;
}

const WalletProvider = ({ children }: WalletProviderProps) => {
  return <ThirdwebProvider>{children}</ThirdwebProvider>;
};

export default WalletProvider;
