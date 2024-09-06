"use client";
import { useState, useEffect } from "react";
import { WORLDID_OIDC_CONFIG } from "@/lib/worldid-config";
import { useConnect, useDisconnect, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import EnhancedWalletUI from "@/app/components/EnhancedWalletUI";
import { useCookies } from "react-cookie";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const activeAccount = useActiveAccount() ?? null;
  const activeWallet = useActiveWallet();
  const [cookies, setCookie, removeCookie] = useCookies([
    "temp_auth_token",
    "temp_auth_error",
  ]);

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
      removeCookie("temp_auth_token", { path: "/" });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Failed to connect wallet");
      }
      localStorage.removeItem("walletConnected");
      localStorage.removeItem("jwtToken");
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
    const initializeWallet = async () => {
      setIsLoading(true);
      if (cookies.temp_auth_token) {
        await handleAuthCallback(cookies.temp_auth_token);
      } else if (cookies.temp_auth_error) {
        setError(cookies.temp_auth_error);
        removeCookie("temp_auth_error", { path: "/" });
      } else {
        const isWalletConnected =
          localStorage.getItem("walletConnected") === "true";
        const storedToken = localStorage.getItem("jwtToken");
        if (isWalletConnected && storedToken) {
          await handleAuthCallback(storedToken);
        }
      }
      setIsLoading(false);
    };

    initializeWallet();
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
