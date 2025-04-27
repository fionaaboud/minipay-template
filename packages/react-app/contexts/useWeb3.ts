import { useState } from "react";
import StableTokenABI from "./cusd-abi.json";
import MinipayNFTABI from "./minipay-nft.json";
import {
    createPublicClient,
    createWalletClient,
    custom,
    getContract,
    http,
    parseEther,
    stringToHex,
    Address, // Import the Address type
} from "viem";
import { celo, celoAlfajores } from "viem/chains";

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
const MINIPAY_NFT_CONTRACT_TESTNET = "0xE8F4699baba6C86DA9729b1B0a1DA1Bd4136eFeF"; // Testnet

// Mainnet addresses - Replace these with actual mainnet addresses when available
const cUSDTokenAddressMainnet = "0x765DE816845861e75A25fCA122bb6898B8B1282a"; // Mainnet cUSD

export const useWeb3 = () => {
    const [address, setAddress] = useState<Address | null>(null); // Use Address type
    const [isMainnet, setIsMainnet] = useState<boolean>(false);

    // Get the appropriate chain and client based on network selection
    const getChain = () => isMainnet ? celo : celoAlfajores;
    const getPublicClient = () => isMainnet ? publicClientMainnet : publicClientTestnet;
    const getCUSDAddress = () => isMainnet ? cUSDTokenAddressMainnet : cUSDTokenAddressTestnet;
    const getNFTContractAddress = () => isMainnet ? MINIPAY_NFT_CONTRACT_TESTNET : MINIPAY_NFT_CONTRACT_TESTNET; // Using testnet for both until mainnet is available

    // Toggle between mainnet and testnet
    const toggleNetwork = () => {
        setIsMainnet(!isMainnet);
    };

    const getUserAddress = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            // Check if user is using MiniPay wallet
            const isMiniPay = window.ethereum.isMiniPay;

            if (isMiniPay) {
                console.log("MiniPay wallet detected");
            }

            let walletClient = createWalletClient({
                transport: custom(window.ethereum),
                chain: getChain(),
            });

            let [address] = await walletClient.getAddresses();
            setAddress(address);
        }
    };

    const sendCUSD = async (to: string, amount: string) => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: getChain(),
        });

        let [address] = await walletClient.getAddresses();

        const amountInWei = parseEther(amount);

        const tx = await walletClient.writeContract({
            address: getCUSDAddress(),
            abi: StableTokenABI.abi,
            functionName: "transfer",
            account: address,
            args: [to, amountInWei],
        });

        let receipt = await getPublicClient().waitForTransactionReceipt({
            hash: tx,
        });

        return receipt;
    };

    const mintMinipayNFT = async () => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: getChain(),
        });

        let [currentAddress] = await walletClient.getAddresses(); // Use a different name to avoid conflict if needed, though shadowing is fine here.

        // Ensure address is available before proceeding
        if (!currentAddress) {
            throw new Error("User address not found. Cannot mint NFT.");
        }

        const tx = await walletClient.writeContract({
            address: getNFTContractAddress(),
            abi: MinipayNFTABI.abi as Abi, // Cast ABI to Abi type
            functionName: "safeMint",
            account: currentAddress, // Use the non-null address
            args: [
                address,
                "https://cdn-production-opera-website.operacdn.com/staticfiles/assets/images/sections/2023/hero-top/products/minipay/minipay__desktop@2x.a17626ddb042.webp",
            ],
        });

        const receipt = await getPublicClient().waitForTransactionReceipt({
            hash: tx,
        });

        return receipt;
    };

    const getNFTs = async () => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: getChain(),
        });

        const minipayNFTContract = getContract({
            abi: MinipayNFTABI.abi,
            address: getNFTContractAddress(),
            client: getPublicClient(),
        });

        const [address] = await walletClient.getAddresses();
        const nfts: any = await minipayNFTContract.read.getNFTsByAddress([
            address,
        ]);

        let tokenURIs: string[] = [];

        for (let i = 0; i < nfts.length; i++) {
            const tokenURI: string = (await minipayNFTContract.read.tokenURI([
                nfts[i],
            ])) as string;
            tokenURIs.push(tokenURI);
        }
        return tokenURIs;
    };

    const signTransaction = async () => {
        let walletClient = createWalletClient({
            transport: custom(window.ethereum),
            chain: getChain(),
        });

        let [address] = await walletClient.getAddresses();

        const res = await walletClient.signMessage({
            account: address,
            message: stringToHex("Hello from Celo Composer MiniPay Template!"),
        });

        return res;
    };

    // Create a wallet client directly (similar to your provided code)
    const createClient = async () => {
        if (typeof window !== "undefined" && window.ethereum) {
            try {
                // Check if user is using MiniPay wallet
                const isMiniPay = window.ethereum.isMiniPay;

                if (isMiniPay) {
                    console.log("MiniPay wallet detected in createClient");
                }

                const client = createWalletClient({
                    chain: getChain(),
                    transport: custom(window.ethereum),
                });

                const [userAddress] = await client.getAddresses(); // Use different variable name to avoid shadowing
                setAddress(userAddress); // Set state with Address type
                return { client, address: userAddress, isMiniPay }; // Return the correct Address type
            } catch (error) {
                console.error("Error creating wallet client:", error);
                return null;
            }
        }
        return null;
    };

    return {
        address,
        isMainnet,
        getUserAddress,
        sendCUSD,
        mintMinipayNFT,
        getNFTs,
        signTransaction,
        toggleNetwork,
        createClient,
    };
};
