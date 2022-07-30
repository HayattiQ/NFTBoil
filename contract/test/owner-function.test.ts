import { ethers } from 'hardhat'
import type { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { testConfig, assertPublicMintSuccess } from './test-helpers'
// @ts-ignore
import type { NFTBoilMerkle } from '../typechain-types'
const { expect } = require('chai')

describe('Contract OwnerFunction test', function () {
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

  describe('OwnerFunction checks', function () {
    it('Owner can ownermint', async () => {
      await expect(ad.connect(owner).ownerMint(owner.address, 1)).to.be.ok
    })

    it('Ownership Transform', async () => {
      await ad.connect(owner).transferOwnership(bob.address)
      await expect(ad.connect(bob).ownerMint(bob.address, 1)).to.be.ok
    })

    it('Withdraw funds', async () => {
      await ad.setPresale(false)
      const cost = await ad.getCurrentCost()
      const alisInitial = await ad.provider.getBalance(alis.address)

      expect(await ad.provider.getBalance(ad.address)).to.equal(0)
      await assertPublicMintSuccess(ad, cost, bob, 1)
      expect(await ad.provider.getBalance(ad.address)).to.equal(cost)
      await ad.connect(owner).transferOwnership(alis.address)
      await ad.connect(alis).withdraw()
      expect(await ad.provider.getBalance(ad.address)).to.equal(0)
      expect(await ad.provider.getBalance(alis.address)).to.be.above(
        alisInitial
      )
    })

    it('Non-owner cant ownermint', async () => {
      await expect(ad.connect(bob).ownerMint(bob.address, 1)).to.reverted
    })
  })
})
