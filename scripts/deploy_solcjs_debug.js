const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
    // Standard Ganache port
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545");
    const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const wallet = new ethers.Wallet(privateKey, provider);

    console.log("Connect to provider...");
    const network = await provider.getNetwork();
    console.log("Chain ID:", network.chainId.toString());

    function getArtifact(name) {
        const abiPath = path.join(__dirname, `../contracts_${name}_sol_${name}.abi`);
        const binPath = path.join(__dirname, `../contracts_${name}_sol_${name}.bin`);
        console.log(`Reading artifact: ${name}`);
        const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
        const bytecode = "0x" + fs.readFileSync(binPath, "utf8").trim();
        return { abi, bytecode };
    }

    async function deploy(name, ...args) {
        const art = getArtifact(name);
        const factory = new ethers.ContractFactory(art.abi, art.bytecode, wallet);
        console.log(`Sending deploy tx for ${name}...`);
        const contract = await factory.deploy(...args);
        console.log(`Waiting for ${name} deployment...`);
        await contract.waitForDeployment();
        const addr = await contract.getAddress();
        console.log(`✅ ${name} at: ${addr}`);
        return addr;
    }

    try {
        const auditLogAddress = await deploy("AuditLog");
        const contentRegistryAddress = await deploy("ContentRegistry");
        const verificationContractAddress = await deploy("VerificationContract", contentRegistryAddress, auditLogAddress);

        const addresses = { AuditLog: auditLogAddress, ContentRegistry: contentRegistryAddress, VerificationContract: verificationContractAddress };
        fs.writeFileSync(path.join(__dirname, "../frontend/src/contracts/contract-address.json"), JSON.stringify(addresses, null, 2));
        console.log("🚀 ALL DONE!");
    } catch (err) {
        console.error("DEBUG ERROR DETAILS:");
        console.error(err);
    }
}
main();
