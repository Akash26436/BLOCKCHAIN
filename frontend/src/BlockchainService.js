import { ethers } from "ethers";
import { ABIs } from "./contracts/abis";
import contractAddresses from "./contracts/contract-address.json";

class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
    }

    async init() {
        if (!window.ethereum) {
            throw new Error("MetaMask is not installed!");
        }

        this.provider = new ethers.BrowserProvider(window.ethereum);
        this.signer = await this.provider.getSigner();

        this.contracts.AuditLog = new ethers.Contract(
            contractAddresses.AuditLog,
            ABIs.AuditLog,
            this.signer
        );

        this.contracts.ContentRegistry = new ethers.Contract(
            contractAddresses.ContentRegistry,
            ABIs.ContentRegistry,
            this.signer
        );

        this.contracts.VerificationContract = new ethers.Contract(
            contractAddresses.VerificationContract,
            ABIs.VerificationContract,
            this.signer
        );

        return await this.signer.getAddress();
    }

    async registerContent(contentHash, perceptualHash, ipfsCID) {
        const tx = await this.contracts.ContentRegistry.registerContent(
            contentHash,
            perceptualHash,
            ipfsCID
        );
        return await tx.wait();
    }

    async verifyContent(contentHash) {
        const tx = await this.contracts.VerificationContract.verifyContent(contentHash);
        const receipt = await tx.wait();
        
        // Find the VerificationResult event
        const event = receipt.logs
            .map(log => {
                try {
                    return this.contracts.VerificationContract.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            return event ? event.args.isAuthentic : false;
    }

    async verifyByPHash(pHash) {
        const tx = await this.contracts.VerificationContract.verifyByPHash(pHash);
        const receipt = await tx.wait();
        
        const event = receipt.logs
            .map(log => {
                try {
                    return this.contracts.VerificationContract.interface.parseLog(log);
                } catch (e) {
                    return null;
                }
            })
            .find(e => e?.name === "VerificationResult");

        return event ? event.args.isAuthentic : false;
    }

    async getLogs() {
        return await this.contracts.AuditLog.getLogs();
    }

    async getContent(contentHash) {
        return await this.contracts.ContentRegistry.getContent(contentHash);
    }
}

export const blockchainService = new BlockchainService();
