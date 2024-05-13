import type { NextApiRequest, NextApiResponse } from 'next'
import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { SOL_APP_ADDRESS, SOL_NET, SOL_TOKEN_ID } from '@/constants'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

export interface SolAppBalanceResponse {
  tokenAmount: {
    amount: string
    decimals: number
    uiAmount: number
    uiAmountString: string
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse<SolAppBalanceResponse>) => {
  const { method } = req

  try {
    switch (method) {
      case 'GET': {
        const connection = new Connection(clusterApiUrl(SOL_NET), 'confirmed')

        const appPublicKey = new PublicKey(SOL_APP_ADDRESS)
        const tokenPublicKey = new PublicKey(SOL_TOKEN_ID)

        const { value } = await connection.getParsedTokenAccountsByOwner(appPublicKey, { mint: tokenPublicKey })
        const tokenAmount = value[0]?.account?.data?.parsed?.info?.tokenAmount

        return res.status(200).json({ tokenAmount })
      }

      default: {
        res.setHeader('Allow', 'GET')
        return res.status(405).end()
      }
    }
  } catch (error) {
    console.error(error)

    return res.status(500).end()
  }
}

export default handler
