import { ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
const { expect } = require("chai");
import { test_config, assertPublicMintSuccess } from "./test-helpers";
import type { KawaiiMetaCollage } from "../typechain-types";

describe("Contract OwnerFunction test", function () {
  let owner: SignerWithAddress;
  let bob: SignerWithAddress;
  let alis: SignerWithAddress;
  let ad: KawaiiMetaCollage;
  let addrs;
  const not_revealed_uri = "not_revealed_uri";

  beforeEach(async function () {
    // @ts-ignore
    [owner, bob, alis, ...addrs] = await ethers.getSigners();
    const contract = await ethers.getContractFactory(test_config.contract_name);
    ad = (await contract.deploy(
      test_config.contract_name,
      test_config.symbol,
      not_revealed_uri
    )) as KawaiiMetaCollage;
    await ad.deployed();

    // Ensure contract is paused/disabled on deployment
    expect(await ad.presale()).to.equal(true);
    expect(await ad.revealed()).to.equal(false);
  });

  describe("OwnerFunction checks", function () {
    it("Owner can ownermint", async () => {
      await expect(ad.connect(owner)["ownerMint"](1)).to.be.ok;
    });

    it("Ownership Transform", async () => {
      await ad.connect(owner)["transferOwnership"](bob.address);
      await expect(ad.connect(bob)["ownerMint"](1)).to.be.ok;
    });

    it("Withdraw funds", async () => {
      await ad["setPresale"](false);
      const cost = await ad["getCurrentCost"]();
      const alis_initial = await ad.provider.getBalance(alis.address);

      expect(await ad.provider.getBalance(ad.address)).to.equal(0);
      await assertPublicMintSuccess(ad, cost, bob, 1);
      expect(await ad.provider.getBalance(ad.address)).to.equal(cost);
      await ad.connect(owner)["transferOwnership"](alis.address);
      await ad.connect(alis)["withdraw"]();
      expect(await ad.provider.getBalance(ad.address)).to.equal(0);
      expect(await ad.provider.getBalance(alis.address)).to.be.above(
        alis_initial
      );
    });

    it("Non-owner cant ownermint", async () => {
      await expect(ad.connect(bob)["ownerMint"](1)).to.reverted;
    });
  });
});
