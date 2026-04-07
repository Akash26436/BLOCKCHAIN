const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("🚀 Deploying contracts with account:", await wallet.getAddress());

    function getArtifact(name) {
        const base = name.replace(/\//g, '_').replace(/\.sol$/, '');
        // solcjs naming convention: contracts_Name_sol_Name.abi
        const abiPath = path.join(__dirname, `../contracts_${name}_sol_${name}.abi`);
        const binPath = path.join(__dirname, `../contracts_${name}_sol_${name}.bin`);
        
        if (!fs.existsSync(abiPath) || !fs.existsSync(binPath)) {
            throw new Error(`Artifact for ${name} not found! Run solcjs first.`);
        }
        
        return {
            abi: JSON.parse(fs.readFileSync(abiPath, "utf8")),
            bytecode: "0x" + fs.readFileSync(binPath, "utf8").trim()
        };
    }

    async function deployContract(name, ...args) {
        const art = getArtifact(name);
        const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
        console.log(`Deploying ${name}...`);
        const contract = await factory.deploy(...args);
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        console.log(`${name} deployed to:`, address);
        return address;
    }

    try {
        const auditLogAddress = await deployContract("AuditLog");
        const contentRegistryAddress = await deployContract("ContentRegistry");
        const verificationContractAddress = await deployContract("VerificationContract", 
            contentRegistryAddress, 
            auditLogAddress
        );

        const contractsDir = path.join(__dirname, "../frontend/src/contracts");
        if (!fs.existsSync(contractsDir)) fs.mkdirSync(contractsDir, { recursive: true });

        const addresses = {
            AuditLog: auditLogAddress,
            ContentRegistry: contentRegistryAddress,
            VerificationContract: verificationContractAddress,
        };

        fs.writeFileSync(
            path.join(contractsDir, "contract-address.json"),
            JSON.stringify(addresses, null, 2)
        );

        console.log("\n✅ Deployment complete!");
        console.log("📄 addresses.json updated.");

    } catch (e) {
        console.error("❌ Deployment failed:", e.message);
    }
}

main().catch(console.error);
