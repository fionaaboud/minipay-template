'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import StableTokenABI from "./cusd-abi.json";
import {
  createPublicClient,
  createWalletClient,
  custom,
  getContract,
  http,
  parseEther,
  stringToHex,
  WalletClient,
  PublicClient,
  Address, // Import Address type
  Abi, // Import Abi type
} from "viem";
import { celo, celoAlfajores } from "viem/chains";

// Wallet types
export enum WalletType {
  MINIPAY = 'minipay',
  METAMASK = 'metamask',
  WALLETCONNECT = 'walletconnect',
  NONE = 'none'
}

// For testnet (Alfajores)
const publicClientTestnet = createPublicClient({
  chain: celoAlfajores,
  transport: http(),
});

// For mainnet
const publicClientMainnet = createPublicClient({
  chain: celo,
  transport: http(),
});

// Testnet addresses
const cUSDTokenAddressTestnet = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"; // Testnet

// Mainnet addresses
const cUSDTokenAddressMainnet = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as Address; // Mainnet cUSD (Cast to Address)

interface Web3ContextType {
  address: Address | null; // Use Address type
  isMainnet: boolean;
  walletType: WalletType;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: (walletType?: WalletType) => Promise<boolean>;
  disconnectWallet: () => void;
  sendCUSD: (to: Address, amount: string) => Promise<any>; // Use Address type for 'to'
  sendStablecoin: (to: Address, amount: string, currency?: string) => Promise<any>; // Use Address type for 'to'
  getStablecoinAddress: (currency?: string) => Address; // Use Address type for return
  toggleNetwork: () => void;
  supportedCurrencies: string[];
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<Address | null>(null); // Use Address type
  const [isMainnet, setIsMainnet] = useState<boolean>(false);
  const [walletType, setWalletType] = useState<WalletType>(WalletType.NONE);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  // Get the appropriate chain and client based on network selection
  const getChain = () => isMainnet ? celo : celoAlfajores;
  const getPublicClient = () => isMainnet ? publicClientMainnet : publicClientTestnet;
  // Testnet address needs casting as well if used directly with viem functions expecting Address
  const cUSDTokenAddressTestnetTyped = cUSDTokenAddressTestnet as Address;
  const getCUSDAddress = (): Address => isMainnet ? cUSDTokenAddressMainnet : cUSDTokenAddressTestnetTyped; // Ensure return type is Address

  // Check for MiniPay on initial load
  useEffect(() => {
    const checkForMiniPay = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        // Check if user is using MiniPay wallet
        const isMiniPay = window.ethereum.isMiniPay;

        if (isMiniPay) {
          console.log("MiniPay wallet detected, auto-connecting...");
          connectWallet(WalletType.MINIPAY);
        }
      }
    };

    checkForMiniPay();
  }, []);

  // Toggle between mainnet and testnet
  const toggleNetwork = () => {
    setIsMainnet(!isMainnet);
  };

  // Connect to wallet
  const connectWallet = async (type: WalletType = WalletType.MINIPAY): Promise<boolean> => {
    if (isConnecting) return false;

    setIsConnecting(true);
    console.log("Connecting to wallet:", type);

    try {
      if (typeof window === "undefined") {
        throw new Error("Window is not defined");
      }

      let client: WalletClient | null = null;
      let userAddress: Address | undefined; // Use Address type

      switch (type) {
        case WalletType.MINIPAY:
          if (!window.ethereum || !window.ethereum.isMiniPay) {
            console.log("MiniPay not detected, falling back to MetaMask");
            return await connectWallet(WalletType.METAMASK);
          }

          console.log("Creating MiniPay wallet client");
          client = createWalletClient({
            transport: custom(window.ethereum),
            chain: getChain(),
          });
          break;

        case WalletType.METAMASK:
          if (!window.ethereum) {
            throw new Error("MetaMask not detected");
          }

          console.log("Creating MetaMask wallet client");
          client = createWalletClient({
            transport: custom(window.ethereum),
            chain: getChain(),
          });
          break;

        case WalletType.WALLETCONNECT:
          // WalletConnect implementation would go here
          throw new Error("WalletConnect not implemented yet");

        default:
          throw new Error("Unsupported wallet type");
      }

      if (!client) {
        throw new Error("Failed to create wallet client");
      }

      // Request accounts - this will trigger the wallet popup
      console.log("Requesting wallet addresses...");
      const accounts = await client.requestAddresses();
      console.log("Received accounts:", accounts);
      userAddress = accounts[0];

      if (!userAddress) {
        throw new Error("No accounts found");
      }

      setAddress(userAddress);
      setWalletClient(client);
      setWalletType(type);
      setIsConnected(true);
      console.log("Wallet connected successfully:", userAddress);

      return true;
    } catch (error) {
      console.error("Error connecting wallet:", error);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress(null);
    setWalletClient(null);
    setWalletType(WalletType.NONE);
    setIsConnected(false);
  };

  // Stablecoin addresses on Celo mainnet (Cast to Address)
  const STABLECOIN_ADDRESSES: { [key: string]: Address } = {
    cUSD: '0x765DE816845861e75A25fCA122bb6898B8B1282a' as Address,
    cEUR: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73' as Address,
    cREAL: '0xe8537a3d056DA446677B9E9d6c5dB704EaAb4787' as Address
  };

  // Get stablecoin address
  const getStablecoinAddress = (currency: string = 'cUSD'): Address => { // Return Address type
    return STABLECOIN_ADDRESSES[currency.toUpperCase()] || STABLECOIN_ADDRESSES.cUSD;
  };

  // Send any stablecoin
  const sendStablecoin = async (to: Address, amount: string, currency: string = 'cUSD') => { // Use Address type for 'to'
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    console.log(`Sending ${amount} ${currency} to ${to}`);
    const amountInWei = parseEther(amount);
    console.log(`Amount in wei: ${amountInWei}`);

    try {
      // Get the appropriate token address
      const tokenAddress = getStablecoinAddress(currency);
      if (!tokenAddress) {
        throw new Error(`Unsupported currency: ${currency}`);
      }

      console.log("Initiating transfer transaction...");
      const tx = await walletClient.writeContract({
        address: tokenAddress, // Already Address type from getStablecoinAddress
        abi: StableTokenABI.abi as Abi, // Cast ABI
        functionName: "transfer",
        account: address as Address, // Cast non-null address state to Address
        args: [to, amountInWei], // 'to' is already Address type
      });

      console.log("Transaction submitted:", tx);
      console.log("Waiting for transaction receipt...");

      let receipt = await getPublicClient().waitForTransactionReceipt({
        hash: tx,
      });

      console.log("Transaction confirmed:", receipt);
      return receipt;
    } catch (error) {
      console.error(`Error sending ${currency}:`, error);
      throw error;
    }
  };

  // For backward compatibility
  const sendCUSD = async (to: Address, amount: string) => { // Use Address type for 'to'
    return sendStablecoin(to, amount, 'cUSD');
  };

  const value = {
    address,
    isMainnet,
    walletType,
    isConnected,
    isConnecting,
    connectWallet,
    disconnectWallet,
    sendCUSD,
    sendStablecoin,
    getStablecoinAddress,
    toggleNetwork,
    supportedCurrencies: Object.keys(STABLECOIN_ADDRESSES),
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3Context = (): Web3ContextType => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3Context must be used within a Web3Provider');
  }
  return context;
};
