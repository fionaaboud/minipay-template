'use client';

import { useEffect, useState } from "react";
import { createWalletClient, custom } from "viem";
import { celo, celoAlfajores } from "viem/chains";
import ClientOnly from "./ClientOnly";

function WalletExampleContent() {
  const [address, setAddress] = useState<string | null>(null);
  const [isMainnet, setIsMainnet] = useState<boolean>(false);
  const [isMiniPay, setIsMiniPay] = useState<boolean>(false);

  // Function to create a wallet client
  const createClient = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        // Check if we're in MiniPay environment
        const isMiniPayWallet = window.ethereum.isMiniPay;
        setIsMiniPay(isMiniPayWallet);

        if (isMiniPayWallet) {
          console.log("MiniPay wallet detected in WalletExample");
        }

        const client = createWalletClient({
          chain: isMainnet ? celo : celoAlfajores,
          transport: custom(window.ethereum),
        });

        const [walletAddress] = await client.getAddresses();
        setAddress(walletAddress);
        return { client, address: walletAddress, isMiniPay: isMiniPayWallet };
      } catch (error) {
        console.error("Error getting wallet address:", error);
        return null;
      }
    }
    return null;
  };

  // Toggle between mainnet and testnet
  const toggleNetwork = () => {
    setIsMainnet(!isMainnet);
  };

  // Initialize wallet client when component mounts or network changes
  useEffect(() => {
    // Only run on client-side
    if (typeof window !== "undefined") {
      createClient();
    }
  }, [isMainnet]);

  return (
    <div className="p-4 border rounded-lg bg-gray-50 my-4">
      <h2 className="text-xl font-bold mb-2">Direct Wallet Client Example</h2>
      {isMiniPay && (
        <div className="bg-green-100 text-green-800 p-2 rounded mb-2">
          ✅ Running inside MiniPay wallet
        </div>
      )}
      <p className="mb-2">
        This component demonstrates how to use the wallet client code directly.
      </p>
      <div className="mb-4">
        <button
          onClick={toggleNetwork}
          className={`px-4 py-2 rounded-md font-medium ${isMainnet ? 'bg-green-600 text-white' : 'bg-yellow-500 text-black'}`}
        >
          {isMainnet ? 'Mainnet' : 'Testnet'} (Click to toggle)
        </button>
      </div>
      {address ? (
        <div className="mt-2">
          <p>Connected Address: <span className="font-mono">{address}</span></p>
        </div>
      ) : (
        <p>Wallet not connected</p>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <p>This example uses the following code:</p>
        <pre className="bg-gray-100 p-2 rounded overflow-x-auto mt-2">
          {`const client = createWalletClient({
  chain: ${isMainnet ? 'celo' : 'celoAlfajores'},
  transport: custom(window.ethereum),
});

const [address] = await client.getAddresses();`}
        </pre>
      </div>
    </div>
  );
}

export default function WalletExample() {
  return (
    <ClientOnly>
      <WalletExampleContent />
    </ClientOnly>
  );
}
