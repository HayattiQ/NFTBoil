import { task, types } from "hardhat/config";
import { ethers } from "ethers";
import { getContract, getEnvVariable, getProvider } from "./helpers";
import fs from "fs";
import { addresses } from "./whitelist_import";
// @ts-ignore
import type { KawaiiMetaCollage } from "../typechain-types";
import MerkleTree from "merkletreejs";
import keccak256 from "keccak256";

task("checksum", "Change address to checksum address")
  .addParam("address", "wallet address")
  .setAction(async (taskArgs, hre) => {
    console.log(ethers.utils.getAddress(taskArgs.address));
  });

task("setMerkleRoot", "set Merkle Root on WhiteList").setAction(
  async (taskArgs, hre) => {
    for await (const line of addresses) {
      if (!ethers.utils.isAddress(line)) throw Error(line + "is not valid.");
    }

    const contract: KawaiiMetaCollage = (await getContract(
      getEnvVariable("CONTRACT_NAME"),
      hre,
      getProvider(hre)
    )) as KawaiiMetaCollage;

    const leafTree = addresses.map((x) => keccak256(x));
    const tree = new MerkleTree(leafTree, keccak256, { sortPairs: true });
    const rootTree = tree.getRoot();

    const transactionResponse = await contract.setMerkleRoot(rootTree);
    console.log(`Transaction Hash: ${transactionResponse.hash}`);
  }
);

task("ownerMint", "Mints from the NFT contract. (only Owner)")
  .addParam("number", "Ownermint Number")
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract(
      getEnvVariable("CONTRACT_NAME"),
      hre,
      getProvider(hre)
    );
    const transactionResponse = await contract["ownerMint"](
      taskArguments.number
    );
    console.log(`Transaction Hash: ${transactionResponse.hash}`);
  });

task("snapshot", "Take Snapshot NFT")
  .addOptionalParam(
    "filename",
    "White txt file name",
    "./scripts/snapshot.csv",
    types.string
  )
  .addOptionalParam("start", "Start ID", 1, types.int)
  .setAction(async function (taskArguments, hre) {
    const contract = await getContract(
      getEnvVariable("CONTRACT_NAME"),
      hre,
      getProvider(hre)
    );
    const totalSupply: number = Number(await contract["totalSupply"]());
    console.log(`totalSupply: ${totalSupply}`);
    if (fs.existsSync(taskArguments.filename))
      fs.truncateSync(taskArguments.filename);
    for (let i = taskArguments.start; i <= totalSupply; i++) {
      const ownerOf = await contract["ownerOf"](i);
      console.log(`ID:${i} owner:${ownerOf}`);
      fs.appendFileSync(taskArguments.filename, [i, ownerOf].join(",") + "\n");
    }

    console.log("done");
  });
