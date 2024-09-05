"use client";

import React, { useState } from "react";

interface EnhancedWalletUIProps {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  activeAccount: { address: string } | null;
  startAuthFlow: () => void;
  handleDisconnect: () => void;
}

export default function EnhancedWalletUI({
  isConnected,
  isLoading,
  error,
  activeAccount,
  startAuthFlow,
  handleDisconnect,
}: EnhancedWalletUIProps) {
  const [copiedAddress, setCopiedAddress] = useState(false);

  const copyAddress = () => {
    if (activeAccount?.address) {
      navigator.clipboard.writeText(activeAccount.address);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-1">
            Wallet Dashboard
          </h2>
          <p className="text-center text-gray-600 text-sm mb-6">
            Powered by WorldID and Thirdweb
          </p>

          {!isConnected ? (
            <div className="space-y-4">
              <p className="text-center text-gray-600">
                Connect your wallet to get started
              </p>
              <button
                onClick={startAuthFlow}
                disabled={isLoading}
                className={`w-full py-2 px-4 rounded font-semibold text-white transition duration-200 ease-in-out ${
                  isLoading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  "Sign in with World ID"
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">
                  WorldID
                </span>
                <span className="px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-200 rounded-full">
                  Thirdweb
                </span>
              </div>
              <p className="text-center text-green-600 font-semibold">
                Connected Successfully
              </p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Wallet Address:
                </p>
                <p className="text-sm font-mono break-all">
                  {activeAccount?.address}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="w-full py-2 px-4 border border-gray-300 rounded font-semibold text-gray-700 transition duration-200 ease-in-out hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                {copiedAddress ? "Copied!" : "Copy Address"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {isConnected && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={handleDisconnect}
              className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 rounded font-semibold text-white transition duration-200 ease-in-out"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
