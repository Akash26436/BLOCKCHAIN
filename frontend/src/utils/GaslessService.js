import { ethers } from "ethers";

/**
 * Gasless Demo Service
 * Uses a hardcoded Ganache private key to sign transactions directly,
 * bypassing MetaMask's gas fee prompt for demonstration purposes.
 */
export const gaslessService = {
    // Standard Ganache / Hardhat default private key #0 (for mnemonic 'test ... junk')
    // NOTE: This is safe for local demos but NEVER for production.
    DEMO_PRIVATE_KEY: "0x58bf836090f4045feed4a25bdbb00341f70c51f95f95e37861e107fdd4586b4a",
    RPC_URL: "http://127.0.0.1:7545",

    getSigner: () => {
        const provider = new ethers.JsonRpcProvider(gaslessService.RPC_URL);
        return new ethers.Wallet(gaslessService.DEMO_PRIVATE_KEY, provider);
    }
};
