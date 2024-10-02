import axios from 'axios'
import { KOIOS_API_KEY, TRTL_LP } from '@/constants'

const KOIOS_API_URL1 = 'https://api.koios.rest/api/v1/asset_info'
const KOIOS_API_URL2 = 'https://api.koios.rest/api/v1/asset_addresses'

// Minswap V1 Pool
const assetListv1 = [[TRTL_LP['CARDANO']['MINSWAP_V1_POLICY_ID'], TRTL_LP['CARDANO']['MINSWAP_V1_TOKEN_NAME']]]
// Minswap V2 Pool
const assetListv2 = [[TRTL_LP['CARDANO']['MINSWAP_V2_POLICY_ID'], TRTL_LP['CARDANO']['MINSWAP_V2_TOKEN_NAME']]]

// Payment address to filter for - the amount of LP token shown for TRTL/ADA V2 pool is not the total supply for the LP token. the below address matches the amount shown by min. From this address we get total number of V2 pool LP tokens
const TARGET_ADDRESS = 'addr1wxc45xspppp73takl93mq029905ptdfnmtgv6g7cr8pdyqgvks3s8'

export const getADAV1PoolSupply = async (): Promise<number> => {
  try {
    const { data } = await axios.post(
      KOIOS_API_URL1,
      { _asset_list: assetListv1 },
      {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${KOIOS_API_KEY}`,
          'content-type': 'application/json',
        },
      }
    )

    const totalSupplyV1 = parseInt(data[0]?.total_supply, 10)

    return totalSupplyV1
  } catch (error) {
    console.error('Error fetching ADA V1 pool asset info:', error)
    throw new Error('Failed to fetch ADA V1 pool asset information')
  }
}

export const getADAV2PoolSupply = async (): Promise<number> => {
  try {
    const [policyId, assetName] = assetListv2[0] // Extract policyID and asset name from assetListv2

    const { data } = await axios.post(
      KOIOS_API_URL2,
      {
        _asset_policy: policyId, // First parameter: Policy ID
        _asset_name: assetName, // Second parameter: Encoded asset name
      },
      {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${KOIOS_API_KEY}`,
          'content-type': 'application/json',
        },
      }
    )
    ;``

    const assetData = data.find((entry: { payment_address: string }) => entry.payment_address === TARGET_ADDRESS)

    if (assetData) {
      const totalSupplyV2 = parseInt(assetData.quantity, 10)

      return totalSupplyV2
    } else {
      throw new Error('Target payment address not found in the response')
    }
  } catch (error) {
    console.error('Error fetching ADA V2 pool asset info:', error)
    throw new Error('Failed to fetch ADA V2 pool asset information')
  }
}
