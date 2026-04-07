const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // Connect directly to the user's running Ganache instance on port 7545
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    
    // Standard Ganache / Hardhat default account #0
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Deploying contracts with the account:", await wallet.getAddress());

    // Function to deploy a contract given its artifact
    async function deployContract(name, ...args) {
        const artifactPath = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        
        if (!fs.existsSync(artifactPath)) {
            throw new Error(`Artifact for ${name} not found! Please ensure contracts are compiled.`);
        }
        
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        
        console.log(`Deploying ${name}...`);
        const contract = await factory.deploy(...args);
        await contract.waitForDeployment();
        
        const address = await contract.getAddress();
        console.log(`${name} deployed to:`, address);
        return address;
    }

    try {
        // Deploy AuditLog
        const auditLogAddress = await deployContract("AuditLog");

        // Deploy ContentRegistry
        const contentRegistryAddress = await deployContract("ContentRegistry");

        // Deploy VerificationContract (requires addresses of the other two)
        const verificationContractAddress = await deployContract("VerificationContract", 
            contentRegistryAddress, 
            auditLogAddress
        );

        // Save the addresses to the frontend
        const contractsDir = path.join(__dirname, "../frontend/src/contracts");
        if (!fs.existsSync(contractsDir)) {
            fs.mkdirSync(contractsDir, { recursive: true });
        }

        const addresses = {
            AuditLog: auditLogAddress,
            ContentRegistry: contentRegistryAddress,
            VerificationContract: verificationContractAddress,
        };

        fs.writeFileSync(
            path.join(contractsDir, "contract-address.json"),
            JSON.stringify(addresses, undefined, 2)
        );

        console.log("\n✅ All contracts deployed successfully to Ganache!");
        console.log("📄 Addresses saved to: frontend/src/contracts/contract-address.json");

    } catch (error) {
        console.error("Deployment failed:", error.message);
        process.exit(1);
    }
}

main().catch(console.error);
