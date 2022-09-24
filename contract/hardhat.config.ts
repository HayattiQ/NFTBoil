/* eslint-disable dot-notation */
import 'dotenv/config'
import '@nomiclabs/hardhat-waffle'
import type { HardhatUserConfig } from 'hardhat/config'
import { getEnvVariable } from './scripts/helpers'
import '@typechain/hardhat'
import '@nomiclabs/hardhat-etherscan'
import 'hardhat-gas-reporter'
import './scripts/tasks'

const config: HardhatUserConfig = {
  defaultNetwork: 'localhost',
  solidity: {
    version: '0.8.16',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  etherscan: {
    apiKey: {
      bsc: process.env['BSCSCAN_API'] || '',
      bscTestnet: process.env['BSCSCAN_API'] || '',
      polygon: process.env['POLYGON_API'] || '',
      polygonMumbai: process.env['POLYGON_API'] || '',
      mainnet: process.env['ETH_API'] || '',
      rinkeby: process.env['ETH_API'] || '',
    },
  },
  gasReporter: {
    enabled: !!process.env['REPORT_GAS'],
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337,
      accounts: {
        mnemonic: 'test test test test test test test test test test test junk',
      },
    },
    kovan: {
      url: 'https://kovan.optimism.io/',
      chainId: 69,
      accounts: [getEnvVariable('ACCOUNT_PRIVATE_KEY')],
    },
    ethereum: {
      url: process.env['MAINNET_RPC'] || '',
      chainId: 1,
      accounts: [getEnvVariable('ACCOUNT_PRIVATE_KEY')],
    },
    rinkeby: {
      url: process.env['RINKEBY_RPC'] || '',
      chainId: 4,
      accounts: [getEnvVariable('ACCOUNT_PRIVATE_KEY')],
    },
    astar: {
      url: 'https://rpc.astar.network:8545',
      chainId: 592,
      accounts: [getEnvVariable('ACCOUNT_PRIVATE_KEY')],
    },
    shibuya: {
      url: 'https://rpc.shibuya.astar.network:8545',
      chainId: 81,
      accounts: [getEnvVariable('ACCOUNT_PRIVATE_KEY')],
    },
  },
}

export default config
