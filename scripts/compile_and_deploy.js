const solc = require("solc");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = "http://127.0.0.1:7545";
const PRIVATE_KEY = "0x5a48e2c864cec505b24290eb4ca0c0ebce4dfd439d70fe14c69ccb8f8bc01c08";

async function main() {
    console.log("🚀 Starting Robust Sequential Deployment & ABI Synchronization...");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("Using account:", await wallet.getAddress());

    // 1. Read Solidity source files
    const contractsPath = path.join(__dirname, "../contracts");
    const sources = {
        "ContentRegistry.sol": { content: fs.readFileSync(path.join(contractsPath, "ContentRegistry.sol"), "utf8") },
        "AuditLog.sol": { content: fs.readFileSync(path.join(contractsPath, "AuditLog.sol"), "utf8") },
        "VerificationContract.sol": { content: fs.readFileSync(path.join(contractsPath, "VerificationContract.sol"), "utf8") }
    };

    const input = {
        language: "Solidity",
        sources: sources,
        settings: {
            evmVersion: "london", // London for compatibility
            outputSelection: {
                "*": {
                    "*": ["abi", "evm.bytecode"]
                }
            },
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    };

    // 2. Compile
    console.log("Compiling contracts with solc...");
    const output = JSON.parse(solc.compile(JSON.stringify(input)));

    if (output.errors) {
        let hasError = false;
        output.errors.forEach((error) => {
            console.log(`${error.severity.toUpperCase()}: ${error.formattedMessage}`);
            if (error.severity === "error") hasError = true;
        });
        if (hasError) throw new Error("Compilation failed. See above errors.");
    }

    const contracts = output.contracts;

    // Helper functions for deployment
    async function deploy(name, abi, bytecode, currentNonce, ...args) {
        console.log(`Deploying ${name} (nonce: ${currentNonce})...`);
        const factory = new ethers.ContractFactory(abi, bytecode, wallet);
        const tx = await factory.deploy(...args, { 
            nonce: currentNonce,
            gasLimit: 3000000,
            gasPrice: 20000000000 // 20 Gwei
        });
        await tx.waitForDeployment();
        const address = await tx.getAddress();
        console.log(`${name} deployed to: ${address}`);
        return address;
    }

    try {
        let nonce = await provider.getTransactionCount(await wallet.getAddress(), "latest");
        console.log("Starting nonce:", nonce);

        const auditLogAddress = await deploy(
            "AuditLog",
            contracts["AuditLog.sol"].AuditLog.abi,
            contracts["AuditLog.sol"].AuditLog.evm.bytecode.object,
            nonce++
        );

        const contentRegistryAddress = await deploy(
            "ContentRegistry",
            contracts["ContentRegistry.sol"].ContentRegistry.abi,
            contracts["ContentRegistry.sol"].ContentRegistry.evm.bytecode.object,
            nonce++
        );

        const verificationContractAddress = await deploy(
            "VerificationContract",
            contracts["VerificationContract.sol"].VerificationContract.abi,
            contracts["VerificationContract.sol"].VerificationContract.evm.bytecode.object,
            nonce++,
            contentRegistryAddress,
            auditLogAddress
        );

        // SYNC ABIs and ADDRESSES to FRONTEND
        const frontendContractsDir = path.join(__dirname, "../frontend/src/contracts");
        if (!fs.existsSync(frontendContractsDir)) {
            fs.mkdirSync(frontendContractsDir, { recursive: true });
        }

        // 1. Save Addresses
        const contractAddresses = {
            AuditLog: auditLogAddress,
            ContentRegistry: contentRegistryAddress,
            VerificationContract: verificationContractAddress
        };
        fs.writeFileSync(
            path.join(frontendContractsDir, "contract-address.json"),
            JSON.stringify(contractAddresses, null, 2)
        );

        // 2. Save ABIs (to abis.js)
        const finalABIs = {
            AuditLog: contracts["AuditLog.sol"].AuditLog.abi,
            ContentRegistry: contracts["ContentRegistry.sol"].ContentRegistry.abi,
            VerificationContract: contracts["VerificationContract.sol"].VerificationContract.abi
        };
        
        const abisJSContent = `export const ABIs = ${JSON.stringify(finalABIs, null, 2)};`;
        fs.writeFileSync(path.join(frontendContractsDir, "abis.js"), abisJSContent);

        console.log("\n✅ Success! All contracts deployed and synced to frontend (Addresses + ABIs).");
        console.log("📄 addresses saved to: frontend/src/contracts/contract-address.json");
        console.log("📄 ABIs saved to: frontend/src/contracts/abis.js");

    } catch (error) {
        console.error("\n❌ Deployment/Sync failed during execution:");
        console.error(error.message);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("\n❌ Fatal Error during standalone process:");
    console.error(err);
    process.exit(1);
});
