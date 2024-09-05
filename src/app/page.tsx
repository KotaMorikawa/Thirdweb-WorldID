"use client";

import { useState, useEffect } from "react";
import { WORLDID_OIDC_CONFIG } from "@/lib/worldid-config";
import { useConnect, useDisconnect, useActiveWallet } from "thirdweb/react";
import { inAppWallet } from "thirdweb/wallets";
import { createThirdwebClient } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const activeAccount = useActiveAccount();
  const activeWallet = useActiveWallet();

  const client = createThirdwebClient({
    clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || "",
  });

  const startAuthFlow = async () => {
    setIsLoading(true);
    setError(null);

    const authUrl =
      `${WORLDID_OIDC_CONFIG.authorizationEndpoint}?` +
      `client_id=${WORLDID_OIDC_CONFIG.clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(WORLDID_OIDC_CONFIG.redirectUri)}&` +
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
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      setError(
        error instanceof Error ? error.message : "Failed to connect wallet"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const reconnectWallet = async () => {
    const token = localStorage.getItem("jwtToken");
    if (token) {
      await handleAuthCallback(token);
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
        console.error("No active wallet to disconnect");
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
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
        reconnectWallet();
      }
    }

    // クリーンアップ: URLからパラメータを削除
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <h1 className="text-4xl font-bold mb-8">Welcome to Our App</h1>
        {!isConnected ? (
          <button
            onClick={startAuthFlow}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {isLoading ? "Connecting..." : "Sign in with World ID"}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-green-500">
              Connected with WorldID and Thirdweb
            </p>
            <p>Active account: {activeAccount?.address}</p>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Disconnect
            </button>
          </div>
        )}
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </div>
    </main>
  );
}
