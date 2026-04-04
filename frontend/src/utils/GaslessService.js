import { ethers } from "ethers";

/**
 * Gasless Demo Service
 * Uses a hardcoded Ganache private key to sign transactions directly,
 * bypassing MetaMask's gas fee prompt for demonstration purposes.
 */
export const gaslessService = {
    // Standard Ganache / Hardhat default private key #0 (for mnemonic 'test ... junk')
    // NOTE: This is safe for local demos but NEVER for production.
    DEMO_PRIVATE_KEY: "0x5a48e2c864cec505b24290eb4ca0c0ebce4dfd439d70fe14c69ccb8f8bc01c08",
    RPC_URL: "http://127.0.0.1:7545",

    getSigner: () => {
        const provider = new ethers.JsonRpcProvider(gaslessService.RPC_URL);
        return new ethers.Wallet(gaslessService.DEMO_PRIVATE_KEY, provider);
    }
};
