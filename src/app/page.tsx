"use client";
import { useState, useEffect } from "react";
import { WORLDID_OIDC_CONFIG } from "@/lib/worldid-config";
import { useConnect, useDisconnect, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import EnhancedWalletUI from "@/app/components/EnhancedWalletUI";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const activeAccount = useActiveAccount() ?? null;
  const activeWallet = useActiveWallet();

  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
  });

  const startAuthFlow = async () => {
    setIsLoading(true);
    setError(null);

    const WORLDID_CLIENT_ID = process.env.NEXT_PUBLIC_WORLDID_CLIENT_ID || "";
    const WORLDID_REDIRECT_URL = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/worldid`
      : "";

    const authUrl =
      `${WORLDID_OIDC_CONFIG.authorizationEndpoint}?` +
      `client_id=${WORLDID_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(WORLDID_REDIRECT_URL)}&` +
      `scope=${WORLDID_OIDC_CONFIG.scope}`;

    window.location.href = authUrl;
  };

  const handleAuthCallback = async (token: string) => {
    try {
      await connect(async () => {
        const wallet = inAppWallet();
        await wallet.connect({
          client,
          strategy: "jwt",
          jwt: token,
          encryptionKey: process.env.NEXT_PUBLIC_WALLET_ENCRYPTION_KEY || "",
        });
        return wallet;
      });

      setIsConnected(true);
      localStorage.setItem("walletConnected", "true");
      localStorage.setItem("jwtToken", token);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to connect wallet");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (activeWallet) {
        await disconnect(activeWallet);
        setIsConnected(false);
        localStorage.removeItem("walletConnected");
        localStorage.removeItem("jwtToken");
      } else {
        setError("No active wallet to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to disconnect wallet");
      }
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const error = urlParams.get("error");

    if (token) {
      handleAuthCallback(token);
    } else if (error) {
      setError(
        error === "no_code"
          ? "No authentication code received"
          : "Authentication failed"
      );
    } else {
      const isWalletConnected =
        localStorage.getItem("walletConnected") === "true";
      if (isWalletConnected) {
        const storedToken = localStorage.getItem("jwtToken");
        if (storedToken) {
          handleAuthCallback(storedToken);
        }
      }
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  return (
    <EnhancedWalletUI
      isConnected={isConnected}
      isLoading={isLoading}
      error={error}
      activeAccount={activeAccount}
      startAuthFlow={startAuthFlow}
      handleDisconnect={handleDisconnect}
    />
  );
}
