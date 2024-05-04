import type { NextApiRequest, NextApiResponse } from 'next'
import { firestore } from '@/utils/firebase'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req

  const collection = firestore.collection('turtle-syndicate-wallets')

  try {
    switch (method) {
      case 'GET': {
        const { docs } = await collection.get()

        return res.status(200).json({
          items: docs.map((d) => ({ ...d.data(), id: d.id })),
        })
      }

      case 'POST': {
        const { cardano, solana } = body

        const { docs } = await collection.where('cardano', '==', cardano).where('solana', '==', solana).get()

        if (docs.length) {
          return res.status(201).json({
            items: docs.map((d) => d.id),
          })
        }

        const doc = await collection.add({
          cardano,
          solana,
        })

        return res.status(201).json({
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
