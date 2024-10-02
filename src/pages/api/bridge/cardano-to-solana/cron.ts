import type { NextApiRequest, NextApiResponse } from 'next'
import { Connection, Keypair, PublicKey, clusterApiUrl } from '@solana/web3.js'
import { Account, getOrCreateAssociatedTokenAccount, transfer } from '@solana/spl-token'
import type { DBBridgePayload } from '@/@types'
import { SOL_BRIDGE_APP_SECRET_KEY, SOL_NET, TRTL_COIN } from '@/constants'
import clientPromise from '@/utils/mongo'

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
        const client = await clientPromise
        const db = client.db('TRTL')
        const collection = db.collection('trtl-bridge-to-sol')
        const docs = await collection.find({ done: false }).toArray()

        if (!!docs.length) {
          const connection = new Connection(clusterApiUrl(SOL_NET), 'confirmed')

          const appKeypair = Keypair.fromSecretKey(new Uint8Array(SOL_BRIDGE_APP_SECRET_KEY))
          const tokenPublicKey = new PublicKey(TRTL_COIN['SOLANA']['TOKEN_ID'])

          const getATA = async (publicKey: PublicKey): Promise<Account> => {
            try {
              const toATA = await getOrCreateAssociatedTokenAccount(connection, appKeypair, tokenPublicKey, new PublicKey(publicKey))

              return toATA
            } catch (error) {
              // @ts-ignore
              console.log(error?.message || error)

              return await getATA(publicKey)
            }
          }

          const sendTo = async (toATA: Account, amount: number): Promise<string> => {
            try {
              const txHash = await transfer(connection, appKeypair, appATA.address, toATA.address, appKeypair.publicKey, amount)

              return txHash
            } catch (error) {
              // @ts-ignore
              console.log(error?.message || error)

              return await sendTo(toATA, amount)
            }
          }

          const appATA = await getATA(appKeypair.publicKey)

          console.log('appATA', appATA.address)
          console.log('docs count:', docs.length)

          for await (const doc of docs) {
            const { solAddress, solAmount } = doc.data() as DBBridgePayload

            const toATA = await getATA(new PublicKey(solAddress))

            console.log('toATA', toATA.address)

            const txHash = await sendTo(toATA, solAmount)

            console.log('transfer done', txHash)

            await collection.updateOne(
              { _id: new Object(doc.id) }, // Filter to find the document with the specific ID
              {
                $set: {
                  solTxHash: txHash,
                  done: true,
                },
              }
            )
          }
        }

        console.log('process done')

        return res.status(204).end()
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
