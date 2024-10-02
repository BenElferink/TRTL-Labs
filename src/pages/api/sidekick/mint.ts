import type { NextApiRequest, NextApiResponse } from 'next'
import { BlockfrostProvider, ForgeScript, MeshWallet, Mint, Transaction } from '@meshsdk/core'
import { firebase, firestore } from '@/utils/firebase'
import blockfrost from '@/utils/blockfrost'
import formatHex from '@/functions/formatHex'
import { BLOCKFROST_API_KEY, ADA_SIDEKICK_APP_SECRET_KEY, SIDEKICK_NFT } from '@/constants'
import { DbMintPayload } from '@/@types'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const getRandomDoc = async (
  collectionQuery: firebase.firestore.QuerySnapshot<firebase.firestore.DocumentData>,
  previouslyGotDocIds: string[]
): Promise<{ id: string; data: Mint }> => {
  const idx = Math.floor(Math.random() * (collectionQuery.docs.length + 1))
  const doc = collectionQuery.docs[idx]
  const data = doc?.data() as Mint | undefined

  if (!data || !!previouslyGotDocIds.find((id) => id === doc.id)) return await getRandomDoc(collectionQuery, previouslyGotDocIds)

  try {
    const policyId = SIDEKICK_NFT['CARDANO']['POLICY_ID']
    const tokenId = `${policyId}${formatHex.toHex(data.assetName)}`
    const foundToken = await blockfrost.assetsById(tokenId)

    if (!!foundToken && Number(foundToken.quantity) > 0) {
      console.error(`Already minted this token: ${tokenId}`)
      console.error(`Must delete doc with ID: ${doc.id}`)

      return await getRandomDoc(collectionQuery, previouslyGotDocIds)
    }
  } catch (error) {
    // Token not found: THIS IS OK!
  }

  return { id: doc.id, data }
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req

  try {
    switch (method) {
      case 'POST': {
        const { docId } = body
        const { FieldValue } = firebase.firestore

        const assetCollection = firestore.collection('turtle-sidekick-assets')
        const assetDocs = await assetCollection.get()

        const swapCollection = firestore.collection('turtle-sidekick-swaps')
        const swapDoc = await swapCollection.doc(docId).get()

        if (!swapDoc.exists) return res.status(400).end('Doc ID is invalid')

        const { address: recipientAddress, amount: amountToMint, amountMinted, didSend, didMint } = swapDoc.data() as DbMintPayload
        const amountRemaining = amountToMint - (amountMinted || 0)

        if (!didSend) return res.status(400).end('User did not complete deposit TX')
        if (didMint) return res.status(400).end('Already completed mint for this record')
        if (!amountToMint || !amountRemaining) return res.status(400).end('User does not have mint amount')

        const mintItems: Mint[] = []
        const usedDocIds: string[] = []

        for (let i = 0; i < Math.min(amountRemaining, 10); i++) {
          const { id, data } = await getRandomDoc(assetDocs, usedDocIds)

          const payload: Mint = {
            ...data,
            recipient: recipientAddress,
          }

          mintItems.push(payload)
          usedDocIds.push(id)
        }

        console.log(`minting ${mintItems.length}/${amountRemaining} items`)

        const provider = new BlockfrostProvider(BLOCKFROST_API_KEY)
        const wallet = new MeshWallet({
          networkId: 1,
          fetcher: provider,
          submitter: provider,
          key: {
            type: 'mnemonic',
            words: ADA_SIDEKICK_APP_SECRET_KEY,
          },
        })

        const address = wallet.addresses.baseAddressBech32

        if (!address) throw new Error('MeshWallet does not have baseAddressBech32')

        const script = ForgeScript.withOneSignature(address)
        const tx = new Transaction({ initiator: wallet })

        mintItems.forEach((item) => tx.mintAsset(script, item))

        const unsigTx = await tx.build()
        const sigTx = await wallet.signTx(unsigTx)
        const txHash = await wallet.submitTx(sigTx)

        console.log(`updating doc in DB: ${swapDoc.id}`)

        await swapCollection.doc(swapDoc.id).update({
          amountMinted: FieldValue.increment(mintItems.length),
          didMint: (amountMinted || 0) + mintItems.length === amountToMint,
        })

        console.log(`updated doc in DB: ${swapDoc.id}`)

        if (usedDocIds.length) {
          console.log(`deleting batch (${usedDocIds.length}) from DB`)

          const batch = firestore.batch()
          usedDocIds.forEach((id) => batch.delete(assetCollection.doc(id)))
          await batch.commit()

          console.log(`deleted batch (${usedDocIds.length}) from DB`)
        }

        return res.status(200).json({ txHash })
      }

      default: {
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
