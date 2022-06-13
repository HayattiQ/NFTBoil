import hre from "hardhat";
import { getEnvVariable } from "./helpers";

async function main() {
  const deploycontract = await hre.ethers.getContractFactory(
    getEnvVariable("CONTRACT_NAME")
  );
  console.log("Deploying ERC721 token...");
  const token = await deploycontract.deploy(
    getEnvVariable("CONTRACT_NAME"),
    getEnvVariable("CONTRACT_SYMBOL")
  );

  await token.deployed();
  console.log("Contract deployed to:", token.address);
  const transactionResponse = await token["setNotRevealedURI"](getEnvVariable("IPFS_JSON"));
  console.log(`setNotRevealedURI: ${transactionResponse.hash}`);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
