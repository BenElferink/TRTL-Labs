import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { firestore } from '@/utils/firebase'
import sleep from '@/functions/sleep'
import { DbMintPayload } from '@/@types'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req

  try {
    switch (method) {
      case 'GET': {
        const now = new Date().getTime()

        const collection = firestore.collection('turtle-sidekick-swaps')
        const { docs } = await collection.get()

        const swaps = docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as (DbMintPayload & { id: string })[]

        const swapsThatNeedToMint = swaps.filter((doc) => !doc.didMint && doc.didSend && now - doc.timestamp >= 300000) // 5 minutes
        const swapsThatNeedToDelete = swaps.filter((doc) => !doc.didMint && !doc.didSend && now - doc.timestamp >= 900000) // 15 minutes

        if (swapsThatNeedToMint.length) {
          console.warn(`found ${swapsThatNeedToMint.length} swaps that need to mint`)

          for await (const { id } of swapsThatNeedToMint) {
            await axios.post('https://turtle-solana-bridge.vercel.app/api/sidekick/mint', { docId: id })
            await sleep(2000)
          }
        }

        // if (swapsThatNeedToDelete.length) {
        //   const b = firestore.batch()

        //   swapsThatNeedToDelete.forEach(({ id }) => {
        //     b.delete(collection.doc(id))
        //   })

        //   await b.commit()
        // }

        return res.status(200).json({ swapsThatNeedToMint, swapsThatNeedToDelete })
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
