import { ethers } from 'ethers'
import { getContractAt } from '@nomiclabs/hardhat-ethers/internal/helpers'
import type { HardhatRuntimeEnvironment } from 'hardhat/types'

export function getProvider(hre: HardhatRuntimeEnvironment) {
  // @ts-ignore
  const provider = new ethers.providers.JsonRpcProvider(hre.network.config.url)
  return provider
}

// Helper method for fetching a contract instance at a given address
export function getContract(
  contractName: string,
  hre: HardhatRuntimeEnvironment,
  provider: ethers.providers.Provider
) {
  const account = getAccount(provider, hre.network.name)
  if (hre.network.name === 'localhost') {
    return getContractAt(
      hre,
      contractName,
      getEnvVariable('NFT_CONTRACT_ADDRESS_LOCALHOST'),
      account
    )
  } else {
    return getContractAt(
      hre,
      contractName,
      getEnvVariable('NFT_CONTRACT_ADDRESS'),
      account
    )
  }
}

// Helper method for fetching a wallet account using an environment variable for the PK
export function getAccount(
  provider: ethers.providers.Provider,
  network: string
): ethers.Wallet {
  if (network === 'localhost') {
    return ethers.Wallet.fromMnemonic(
      'test test test test test test test test test test test junk'
    )
  } else {
    return new ethers.Wallet(getEnvVariable('ACCOUNT_PRIVATE_KEY'), provider)
  }
}

// Helper method for fetching environment variables from .env
export function getEnvVariable(key: string, defaultValue?: string): string {
  if (process.env[key]) {
    return process.env[key] as string
  }
  if (!defaultValue) {
    throw new Error(`${key} is not defined and no default value was provided`)
  }
  return defaultValue
}
