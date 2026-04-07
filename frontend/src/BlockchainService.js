import { ethers } from "ethers";
import { ABIs } from "./contracts/abis";
import contractAddresses from "./contracts/contract-address.json";
import { gaslessService } from "./utils/GaslessService";

class BlockchainService {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contracts = {};
        this.isGasless = false;
    }

    async init(gasless = false) {
        this.isGasless = gasless;
        
        if (gasless) {
            this.signer = gaslessService.getSigner();
            this.provider = this.signer.provider;
        } else {
            if (!window.ethereum) {
                throw new Error("MetaMask is not installed!");
            }
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
        }

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
        // Check if already exists to provide better feedback
        const existing = await this.contracts.ContentRegistry.getContent(contentHash);
        if (existing.timestamp !== 0n) {
            throw new Error("This content is already registered on the blockchain!");
        }

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
        const [vLogs, rLogs] = await Promise.all([
            this.contracts.AuditLog.getLogs(),
            this.contracts.AuditLog.getAllReports()
        ]);

        const formattedVLogs = vLogs.map(log => ({
            type: 'verify',
            verifier: log.verifier,
            contentHash: log.contentHash,
            result: log.result,
            timestamp: log.timestamp
        }));

        const formattedRLogs = rLogs.map(log => ({
            type: 'report',
            verifier: log.reporter, // in UI we call it reporter
            contentHash: log.contentHash,
            reason: log.reason,
            result: false, // For easier sorting/styling
            timestamp: log.timestamp
        }));

        return [...formattedVLogs, ...formattedRLogs].sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
    }

    async reportForgery(contentHash, reason = "Reported Manipulation") {
        const tx = await this.contracts.AuditLog.reportForgery(contentHash, reason);
        return await tx.wait();
    }

    async getContent(contentHash) {
        return await this.contracts.ContentRegistry.getContent(contentHash);
    }

    /**
     * Returns the full content record for a given SHA-256 hash.
     * Includes creator address, registration timestamp, IPFS CID, and hashes.
     * Returns null if the content is not registered.
     */
    async getContentInfo(contentHash) {
        const content = await this.contracts.ContentRegistry.getContent(contentHash);
        if (content.timestamp === 0n) return null;
        return {
            contentHash: content.contentHash,
            perceptualHash: content.perceptualHash,
            ipfsCID: content.ipfsCID,
            creator: content.creator,
            timestamp: Number(content.timestamp),
        };
    }

    /**
     * Like getContentInfo but looks up by perceptual hash.
     * Returns the full content record if a similar image is registered.
     */
    async getContentInfoByPHash(pHash) {
        const contentHash = await this.contracts.ContentRegistry.pHashToContentHash(pHash);
        if (!contentHash || contentHash.length === 0) return null;
        return await this.getContentInfo(contentHash);
    }
}

export const blockchainService = new BlockchainService();
