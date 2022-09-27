// constants
import Web3EthContract from 'web3-eth-contract'
import Web3 from 'web3'
// log
import { fetchData } from '../data/dataActions'

const UNRECOGNIZED_CHAIN_ID_ERROR_CODE = 4902

const connectRequest = () => {
  return {
    type: 'CONNECTION_REQUEST',
  }
}

const connectSuccess = (payload) => {
  return {
    type: 'CONNECTION_SUCCESS',
    payload: payload,
  }
}

const connectFailed = (payload) => {
  return {
    type: 'CONNECTION_FAILED',
    payload: payload,
  }
}

const updateAccountRequest = (payload) => {
  return {
    type: 'UPDATE_ACCOUNT',
    payload: payload,
  }
}

const switchNetwork = async (ethereum, chainConfig) => {
  const networkId = await ethereum.request({
    method: 'net_version',
  })

  if (networkId != chainConfig.NETWORK.ID) {
    const chainIdHex = `0x${chainConfig.NETWORK.ID.toString(16)}`

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      })
    } catch (error) {
      if (error.code == UNRECOGNIZED_CHAIN_ID_ERROR_CODE) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainIdHex,
              chainName: chainConfig.NETWORK.NAME,
              rpcUrls: [chainConfig.NETWORK.RPC_URL],
              nativeCurrency: {
                name: chainConfig.NETWORK.NAME,
                symbol: chainConfig.NETWORK.SYMBOL,
                decimals: chainConfig.NETWORK.DECIMALS,
              },
              blockExplorerUrls: [chainConfig.NETWORK.BLOCK_EXPLORER_URL],
            },
          ],
        })
      }
    }
  }
}

export const connect = () => {
  return async (dispatch) => {
    dispatch(connectRequest())
    const abiResponse = await fetch('/config/abi.json', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    const abi = await abiResponse.json()
    const configResponse = await fetch('/config/config.json', {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })
    const CONFIG = await configResponse.json()
    const { ethereum } = window
    const metamaskIsInstalled = ethereum && ethereum.isMetaMask
    if (metamaskIsInstalled) {
      Web3EthContract.setProvider(ethereum)
      let web3 = new Web3(ethereum)
      try {
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts',
        })

        await switchNetwork(ethereum, CONFIG)

        const SmartContractObj = new Web3EthContract(
          abi,
          CONFIG.CONTRACT_ADDRESS
        )
        dispatch(
          connectSuccess({
            account: accounts[0],
            smartContract: SmartContractObj,
            web3: web3,
          })
        )
        // Add listeners start
        ethereum.on('accountsChanged', (accounts) => {
          dispatch(updateAccount(accounts[0]))
        })
        ethereum.on('chainChanged', async () => {
          const networkId = await ethereum.request({
            method: 'net_version',
          })

          if (networkId != CONFIG.NETWORK.ID) {
            window.location.reload()
          }
        })
        // Add listeners end
      } catch (err) {
        dispatch(connectFailed('Something went wrong.'))
      }
    } else {
      dispatch(connectFailed('Install Metamask.'))
    }
  }
}

export const updateAccount = (account) => {
  return async (dispatch) => {
    dispatch(updateAccountRequest({ account: account }))
    dispatch(fetchData(account))
  }
}
