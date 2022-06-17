import { Handler } from '@netlify/functions'
import keccak256 from 'keccak256'
import { MerkleTree } from 'merkletreejs'

export const handler: Handler = async (event, context) => {
  const address = event.queryStringParameters?.address
  if (!address) {
    return { statusCode: 400, body: 'Set address on API' }
  }
  const addressesLower = addresses.map((x) => x.toLowerCase())
  const addressLower = address.toLowerCase()

  const leafNodes = addressesLower.map((x) => keccak256(x))
  const tree = new MerkleTree(leafNodes, keccak256, { sortPairs: true })
  const nodeIndex: number = addressesLower.indexOf(addressLower)
  const rootHash = tree.getRoot()
  console.log('rootHash:', tree.getHexRoot())

  console.log('address:', addressLower, 'nodeindex:', nodeIndex)

  if (nodeIndex === -1) {
    return { statusCode: 400, body: "Your Address don't eligible whitelist" }
  }
  const hashedAddress = keccak256(addressLower)
  const hexProof = tree.getHexProof(hashedAddress)
  const verify = tree.verify(hexProof, hashedAddress, rootHash)

  if (!verify) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        address,
        message: 'your address can not verify',
      }),
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      hexProof,
    }),
  }
}
const addresses = [
  '0x813c6726e40cbcdff33d27324b9ae77a4e4d43fd',
  '0xb13dAc27BEbF08778ac5aEC9387E56413773B875',
]
