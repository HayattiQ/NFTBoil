import { ethers } from "hardhat";
import type { BigNumber } from "ethers";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const { expect } = require("chai");

export const test_config = {
  price: 0.05,
  price_pre: 0.03,
  contract_name: "KawaiiMetaCollage",
  max_supply: 7777,
  max_mint: 10,
  presale_max_mint: 5,
  symbol: "EDO",
};

export async function assertPreMint(
  ad: any,
  cost: BigNumber,
  signer: SignerWithAddress,
  hexProof: any,
  num: number,
  alreadySupply = 0
) {
  let tokenId = await ad.totalSupply();
  expect(
    await ad.connect(signer).preMint(num, hexProof, {
      value: cost,
    })
  )
    .to.emit(ad, "Transfer")
    .withArgs(
      ethers.constants.AddressZero,
      signer.address,
      tokenId.add(num.toString())
    );
  expect(await ad.totalSupply()).to.equal(num + alreadySupply);
}

export async function assertPublicMintSuccess(
  ad: any,
  cost: number | BigNumber,
  signer: SignerWithAddress,
  num: number,
  alreadySupply = 0
) {
  let tokenId = await ad.totalSupply();

  expect(
    await ad.connect(signer).publicMint(num, {
      value: cost,
    })
  )
    .to.emit(ad, "Transfer")
    .withArgs(
      ethers.constants.AddressZero,
      signer.address,
      tokenId.add(num.toString())
    );
  expect(await ad.totalSupply()).to.equal(num + alreadySupply);
}
