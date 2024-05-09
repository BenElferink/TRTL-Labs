import type { NextApiRequest, NextApiResponse } from 'next'
import { firebase, firestore } from '@/utils/firebase'
import badLabsApi from '@/utils/badLabsApi'
import { ADA_TOKEN_ID } from '@/constants'

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

            const trtl = tokens?.find((t) => t.tokenId === ADA_TOKEN_ID)

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
        const { id } = query
        const { cardano, solana } = body

        if (!!cardano && !!solana) {
          const { docs } = await collection.where('cardano', '==', cardano).where('solana', '==', solana).get()

          if (docs.length) {
            return res.status(200).json({
              count: docs.length,
              items: docs.map((d) => ({ ...d.data(), id: d.id })),
            })
          }
        } else if (!!cardano) {
          const { docs } = await collection.where('cardano', '==', cardano).get()

          if (docs.length) {
            return res.status(200).json({
              count: docs.length,
              items: docs.map((d) => ({ ...d.data(), id: d.id })),
            })
          }
        } else if (!!solana) {
          const { docs } = await collection.where('solana', '==', solana).get()

          if (docs.length) {
            return res.status(200).json({
              count: docs.length,
              items: docs.map((d) => ({ ...d.data(), id: d.id })),
            })
          }
        }

        // for mobile wallets
        if (!!id) {
          const docId = id as string
          const doc = await collection.doc(docId).get()

          if (!doc.exists) return res.status(400).end('Bad ID')

          const updateParams: firebase.firestore.UpdateData = {}

          if (cardano) updateParams['cardano'] = cardano
          if (solana) updateParams['solana'] = solana

          await collection.doc(docId).update(updateParams)

          return res.status(201).json({
            count: 1,
            items: [{ id: doc.id, cardano, solana }],
          })
        }

        const doc = await collection.add({ cardano, solana })

        return res.status(201).json({
          count: 1,
          items: [{ id: doc.id, cardano, solana }],
        })
      }

      case 'DELETE': {
        const { id } = query

        if (!!id && typeof id === 'string') {
          await collection.doc(id).delete()
        }

        return res.status(204).end()
      }

      default: {
        res.setHeader('Allow', 'GET')
        res.setHeader('Allow', 'POST')
        res.setHeader('Allow', 'DELETE')
        return res.status(405).end()
      }
    }
  } catch (error) {
    console.error(error)

    return res.status(500).end()
  }
}

export default handler
