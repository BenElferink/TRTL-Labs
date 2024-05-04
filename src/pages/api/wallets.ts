import type { NextApiRequest, NextApiResponse } from 'next'
import { firestore } from '@/utils/firebase'
import badLabsApi from '@/utils/badLabsApi'
import { TRTL_TOKEN_ID } from '@/constants'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, query, body } = req

  const collection = firestore.collection('turtle-syndicate-wallets')

  try {
    switch (method) {
      case 'GET': {
        const { with_amount: withAmount } = query

        const { docs } = await collection.get()
        const mapped = docs.map((d) => ({ ...d.data(), id: d.id }))

        if (withAmount) {
          // @ts-ignore
          for await (const [idx, { cardano }] of mapped.entries()) {
            const { tokens } = await badLabsApi.wallet.getData(cardano, { withTokens: true })

            const trtl = tokens?.find((t) => t.tokenId === TRTL_TOKEN_ID)

            // @ts-ignore
            mapped[idx].tokenAmount = trtl?.tokenAmount?.onChain || 0
          }
        }

        return res.status(200).json({
          count: mapped.length,
          items: mapped,
        })
      }

      case 'POST': {
        const { cardano, solana } = body

        const { docs } = await collection.where('cardano', '==', cardano).where('solana', '==', solana).get()

        if (docs.length) {
          return res.status(201).json({
            count: docs.length,
            items: docs.map((d) => d.id),
          })
        }

        const doc = await collection.add({
          cardano,
          solana,
        })

        return res.status(201).json({
          count: 1,
          items: [doc.id],
        })
      }

      default: {
        res.setHeader('Allow', 'GET')
        res.setHeader('Allow', 'POST')
        return res.status(405).end()
      }
    }
  } catch (error) {
    console.error(error)

    return res.status(500).end()
  }
}

export default handler
