import hre from "hardhat";

async function main() {
    const signers = await hre.ethers.getSigners();
    console.log("Signer address:", signers[0].address);
}

main().catch(console.error);
