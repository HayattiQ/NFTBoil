/* eslint-disable no-unused-expressions */
import { ethers, waffle } from 'hardhat'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import {
  testConfig,
  assertPublicMintSuccess,
  assertPreMint,
} from './test-helpers'
import type { NFTBoilMerkle } from '../typechain-types'
import type { BigNumber } from 'ethers'
const { expect } = require('chai')
const provider = waffle.provider
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')

describe(`${testConfig.contract_name} contract`, function () {
  let owner: SignerWithAddress
  let bob: SignerWithAddress
  let alis: SignerWithAddress
  let ad: NFTBoilMerkle

  beforeEach(async function () {
    // @ts-ignore
    ;[owner, bob, alis] = await ethers.getSigners()
    const contract = await ethers.getContractFactory(testConfig.contract_name)
    ad = (await contract.deploy(
      testConfig.contract_name,
      testConfig.symbol
    )) as NFTBoilMerkle
    await ad.deployed()

    // Ensure contract is paused/disabled on deployment
    expect(await ad.presale()).to.equal(true)
  })

  describe('Basic checks', function () {
    it('check the owner', async function () {
      expect(await ad.owner()).to.equal(owner.address)
    })

    it('check default is PreSale', async function () {
      expect(await ad.presale()).to.equal(true)
    })

    it('Confirm pre price', async function () {
      const cost = ethers.utils.parseUnits(testConfig.price_pre.toString())
      expect(await ad.getCurrentCost()).to.equal(cost)
    })

    it('Confirm public price', async function () {
      const cost = ethers.utils.parseUnits(testConfig.price.toString())
      await ad.setPresale(false)
      expect(await ad.getCurrentCost()).to.equal(cost)
    })
  })

  describe('Public Minting checks', function () {
    beforeEach(async function () {
      await ad.setPresale(false)
    })

    it('PublicMint fail if presale is active', async () => {
      const degenCost = await ad.getCurrentCost()
      await ad.setPresale(true)
      await expect(
        ad.connect(bob).publicMint(1, { value: degenCost })
      ).to.revertedWith('Presale is active.')
    })

    it('Non-owner cannot mint without enough balance', async () => {
      const degenCost = await ad.getCurrentCost()
      await expect(ad.connect(bob).publicMint(1, { value: degenCost.sub(1) }))
        .to.be.reverted
    })

    it('Owner and Bob mint', async () => {
      const degenCost = await ad.getCurrentCost()
      let tokenId = await ad.totalSupply()
      expect(await ad.totalSupply()).to.equal(0)
      expect(
        await ad.publicMint(1, {
          value: degenCost,
        })
      )
        .to.emit(ad, 'Transfer')
        .withArgs(ethers.constants.AddressZero, owner.address, tokenId.add(1))

      expect(await ad.totalSupply()).to.equal(1)
      tokenId = await ad.totalSupply()
      expect(
        await ad.connect(bob).publicMint(1, {
          value: degenCost,
        })
      )
        .to.emit(ad, 'Transfer')
        .withArgs(ethers.constants.AddressZero, bob.address, tokenId.add('1'))

      expect(await ad.totalSupply()).to.equal(2)
    })

    it('Minting tokens increased contract balance', async () => {
      const degenCost = await ad.getCurrentCost()

      // Mint first token and expect a balance increase
      expect(await ad.publicMint(1, { value: degenCost })).to.be.ok
      expect(await provider.getBalance(ad.address)).to.equal(degenCost)

      // Mint two additonal tokens and expect increase again
      expect(await ad.publicMint(2, { value: degenCost.mul(2) })).to.be.ok
      expect(await provider.getBalance(ad.address)).to.equal(degenCost.mul(3))
    })

    it('Bob mints ' + testConfig.max_mint, async () => {
      const degenCost = await ad.getCurrentCost()
      const tokenId = await ad.totalSupply()

      expect(
        await ad.connect(bob).publicMint(testConfig.max_mint, {
          value: degenCost.mul(testConfig.max_mint),
        })
      )
        .to.emit(ad, 'Transfer')
        .withArgs(
          ethers.constants.AddressZero,
          bob.address,
          tokenId.add(testConfig.max_mint.toString())
        )
      expect(await ad.totalSupply()).to.equal(testConfig.max_mint)
    })

    it('Bob mints 1 plus ' + (testConfig.max_mint - 1), async () => {
      const degenCost = await ad.getCurrentCost()
      const tokenId = await ad.totalSupply()

      expect(
        await ad.connect(bob).publicMint(1, {
          value: degenCost.mul(1),
        })
      )
        .to.emit(ad, 'Transfer')
        .withArgs(ethers.constants.AddressZero, bob.address, tokenId.add('1'))
      expect(await ad.totalSupply()).to.equal(1)

      expect(
        await ad.connect(bob).publicMint(testConfig.max_mint - 1, {
          value: degenCost.mul(testConfig.max_mint - 1),
        })
      )
        .to.emit(ad, 'Transfer')
        .withArgs(
          ethers.constants.AddressZero,
          bob.address,
          tokenId.add((testConfig.max_mint - 1).toString())
        )
      expect(await ad.totalSupply()).to.equal(testConfig.max_mint)
    })

    it('Bob fails to mints ' + (testConfig.max_mint + 1), async () => {
      const degenCost = await ad.getCurrentCost()

      await expect(
        ad.connect(bob).publicMint(testConfig.max_mint + 1, {
          value: degenCost.mul(testConfig.max_mint + 1),
        })
      ).to.revertedWith('Mint amount over')
    })

    it('Bob fails to mints when paused', async () => {
      const degenCost = await ad.getCurrentCost()
      await ad.pause()

      await expect(
        ad.connect(bob).publicMint(testConfig.max_mint + 1, {
          value: degenCost.mul(testConfig.max_mint + 1),
        })
      ).to.revertedWith('Pausable: paused')
      await ad.unpause()
      await assertPublicMintSuccess(ad, degenCost, bob, 1)
    })

    it('Bob fails to mints 2 with funds for 1', async () => {
      const degenCost = await ad.getCurrentCost()

      await expect(
        ad.connect(bob).publicMint(2, { value: degenCost })
      ).to.revertedWith('Not enough funds')

      expect(await ad.totalSupply()).to.equal(0)
    })

    it('Public Sale Price Boundary Check', async () => {
      const cost = ethers.utils.parseUnits(testConfig.price.toString())
      await assertPublicMintSuccess(ad, cost, bob, 1)
      await assertPublicMintSuccess(ad, cost.add(1), bob, 1, 1)
      await expect(
        ad.connect(bob).publicMint(1, { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')

      expect(await ad.totalSupply()).to.equal(2)
    })

    it('Public Sale Price Change Check', async () => {
      const cost = ethers.utils.parseUnits('0.001')
      expect(await ad.setPublicCost(cost))
      await assertPublicMintSuccess(ad, cost, bob, 1)
      await assertPublicMintSuccess(ad, cost.add(1), bob, 1, 1)
      await expect(
        ad.connect(bob).publicMint(1, { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')

      expect(await ad.totalSupply()).to.equal(2)
    })

    it(`${testConfig.max_mint} mint Public Sale Price Boundary Check`, async () => {
      const cost = ethers.utils.parseUnits(testConfig.price.toString())
      await assertPublicMintSuccess(
        ad,
        cost.mul(testConfig.max_mint),
        bob,
        testConfig.max_mint
      )
      await assertPublicMintSuccess(
        ad,
        cost.mul(testConfig.max_mint).add(1),
        bob,
        1,
        testConfig.max_mint
      )
      await expect(
        ad.connect(bob).publicMint(testConfig.max_mint, {
          value: cost.mul(testConfig.max_mint).sub(1),
        })
      ).to.revertedWith('Not enough funds')

      expect(await ad.totalSupply()).to.equal(11)
    })

    it('Pre Sale price can not buy', async () => {
      const cost = ethers.utils.parseUnits(testConfig.price_pre.toString())
      await expect(
        ad.connect(bob).publicMint(1, { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')
    })

    it('Public sale have no wallet restriction (only TX)', async () => {
      const cost = await ad.getCurrentCost()
      await assertPublicMintSuccess(
        ad,
        cost.mul(testConfig.max_mint),
        bob,
        testConfig.max_mint
      )
      await assertPublicMintSuccess(
        ad,
        cost.mul(testConfig.max_mint),
        bob,
        testConfig.max_mint,
        testConfig.max_mint
      )
    })
  })

  describe('URI checks', function () {
    beforeEach(async function () {
      await ad.setPresale(false)
    })

    it('Token URI not available for non-minted token', async function () {
      await expect(ad.tokenURI(1)).to.be.reverted
    })

    it('URI not visible before reveal', async function () {
      const degenCost = await ad.getCurrentCost()
      await ad.setNotRevealedURI('ipfs://test/')
      expect(await ad.publicMint(1, { value: degenCost })).to.be.ok
      expect(await ad.tokenURI(1)).to.equal('ipfs://test/')
    })

    it('URI visible after reveal', async function () {
      await ad.setNotRevealedURI('ipfs://test/')
      expect(await ad.reveal()).to.be.ok

      const degenCost = await ad.getCurrentCost()
      expect(await ad.publicMint(5, { value: degenCost.mul(5) })).to.be.ok

      const baseUri = 'baseUri/'

      expect(await ad.setBaseURI(baseUri)).to.be.ok

      const index = 3
      expect(await ad.tokenURI(3)).to.equal(
        baseUri + index.toString() + '.json'
      )
    })
  })

  describe('Whitelist checks', function () {
    let rootTree
    let hexProofs: any[]
    let mintCost: BigNumber
    beforeEach(async function () {
      mintCost = await ad.getCurrentCost()
      const leaves = [alis.address].map((x) => keccak256(x))
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
      rootTree = tree.getRoot()
      await ad.setMerkleRoot(rootTree)
      hexProofs = [owner.address, bob.address, alis.address].map((x) =>
        tree.getHexProof(keccak256(x))
      )
    })
    it('Non Whitelisted user cant buy on PreSale', async function () {
      await expect(
        ad.connect(bob).preMint(1, hexProofs[1], {
          value: mintCost,
        })
      ).to.be.revertedWith('Invalid Merkle Proof')

      await expect(
        ad.connect(owner).preMint(1, hexProofs[0], {
          value: mintCost,
        })
      ).to.be.revertedWith('Invalid Merkle Proof')

      await assertPreMint(ad, mintCost, alis, hexProofs[2], 1)
    })

    it("Presale can't open on PublicSale", async function () {
      await ad.setPresale(false)
      await expect(
        ad.connect(bob).preMint(1, hexProofs[2], { value: mintCost })
      ).to.be.revertedWith('Presale is not active.')
    })

    it('Whitelisted multi user set', async function () {
      const leaves = [owner.address, bob.address, alis.address].map((x) =>
        keccak256(x)
      )
      const tree = new MerkleTree(leaves, keccak256, { sortPairs: true })
      rootTree = tree.getRoot()
      await ad.setMerkleRoot(rootTree)
      hexProofs = [owner.address, bob.address, alis.address].map((x) =>
        tree.getHexProof(keccak256(x))
      )
      await assertPreMint(ad, mintCost, owner, hexProofs[0], 1)
      await assertPreMint(ad, mintCost, bob, hexProofs[1], 1, 1)
      await assertPreMint(ad, mintCost, alis, hexProofs[2], 1, 2)
    })

    it(`Whitelisted user can only buy ${testConfig.presale_max_mint} nft`, async function () {
      mintCost = (await ad.getCurrentCost()).mul(5)

      await assertPreMint(ad, mintCost, alis, hexProofs[2], 5)
      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], { value: mintCost })
      ).to.be.revertedWith('Already claimed max')
    })

    it('Whitelisted user can buy 3 + 2', async function () {
      mintCost = (await ad.getCurrentCost()).mul(3)
      await assertPreMint(ad, mintCost, alis, hexProofs[2], 3)
      await assertPreMint(ad, mintCost, alis, hexProofs[2], 2, 3)
      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], { value: mintCost })
      ).to.be.revertedWith('Already claimed max')
    })

    it('Whitelisted user can not buy over WL', async function () {
      const amount = testConfig.presale_max_mint + 1
      const cost = (await ad.getCurrentCost()).mul(amount)
      await expect(
        ad.connect(alis).preMint(amount, hexProofs[2], { value: cost })
      ).to.be.revertedWith('Already claimed max')
    })

    it('Whitelisted fails to mints when paused', async () => {
      const cost = await ad.getCurrentCost()
      await ad.pause()

      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], {
          value: cost,
        })
      ).to.revertedWith('Pausable: paused')
      await ad.unpause()
      await assertPreMint(ad, cost, alis, hexProofs[2], 1)
    })

    it('Non WhiteList user block after Whitelisted user buy', async function () {
      const amount = testConfig.presale_max_mint
      mintCost = (await ad.getCurrentCost()).mul(testConfig.presale_max_mint)
      await assertPreMint(ad, mintCost, alis, hexProofs[2], amount)
      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], { value: mintCost })
      ).to.be.revertedWith('Already claimed max')
      await expect(
        ad.connect(bob).preMint(1, hexProofs[1], { value: mintCost })
      ).to.be.revertedWith('Invalid Merkle Proof')
    })

    it('Pre Sale Price Boundary Check', async () => {
      const cost = ethers.utils.parseUnits(testConfig.price_pre.toString())
      await assertPreMint(ad, cost, alis, hexProofs[2], 1)
      await assertPreMint(ad, cost.add(1), alis, hexProofs[2], 1, 1)
      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')

      expect(await ad.totalSupply()).to.equal(2)
    })

    it('Pre Sale setPrice Check', async () => {
      const cost = ethers.utils.parseUnits('0.001')
      expect(await ad.setPreCost(cost))
      await assertPreMint(ad, cost, alis, hexProofs[2], 1)
      await assertPreMint(ad, cost.add(1), alis, hexProofs[2], 1, 1)
      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], { value: cost.sub(1) })
      ).to.revertedWith('Not enough funds')

      expect(await ad.totalSupply()).to.equal(2)
    })

    it('Block over allocate Check', async () => {
      await assertPreMint(ad, mintCost.mul(5), alis, hexProofs[2], 5)
      expect(
        await ad
          .connect(alis)
          ['safeTransferFrom(address,address,uint256)'](
            alis.address,
            bob.address,
            1
          )
      ).to.be.ok
      expect(await ad.balanceOf(bob.address)).to.equal(1)
      expect(await ad.balanceOf(alis.address)).to.equal(4)
      await expect(
        ad.connect(alis).preMint(1, hexProofs[2], { value: mintCost })
      ).to.be.revertedWith('Already claimed max')
    })
  })
})
