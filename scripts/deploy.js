import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    // Connect to the local Hardhat node
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const signer = await provider.getSigner(0); // Use the first account

    console.log("Deploying contracts with the account:", await signer.getAddress());

    // Function to deploy a contract given its name
    async function deployContract(name, ...args) {
        const artifactPath = path.join(__dirname, `../artifacts/contracts/${name}.sol/${name}.json`);
        const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
        
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
        const contract = await factory.deploy(...args, { gasLimit: 3000000, gasPrice: 20000000000 });
        await contract.waitForDeployment();
        
        console.log(`${name} deployed to:`, await contract.getAddress());
        return contract;
    }

    // Deploy AuditLog
    const auditLog = await deployContract("AuditLog");

    // Deploy ContentRegistry
    const contentRegistry = await deployContract("ContentRegistry");

    // Deploy VerificationContract
    const verificationContract = await deployContract("VerificationContract", 
        await contentRegistry.getAddress(), 
        await auditLog.getAddress()
    );

    // Save the addresses to a file for the frontend to use
    const contractsDir = path.join(__dirname, "../frontend/src/contracts");

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir, { recursive: true });
    }

    const addresses = {
        AuditLog: await auditLog.getAddress(),
        ContentRegistry: await contentRegistry.getAddress(),
        VerificationContract: await verificationContract.getAddress(),
    };

    fs.writeFileSync(
        path.join(contractsDir, "contract-address.json"),
        JSON.stringify(addresses, undefined, 2)
    );

    console.log("\n✅ All contracts deployed successfully!");
    console.log("📄 Contract addresses saved to frontend/src/contracts/contract-address.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Deployment failed:", error);
        process.exit(1);
    });
