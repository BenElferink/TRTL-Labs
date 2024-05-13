import type { NextApiRequest, NextApiResponse } from 'next'
import { firestore } from '@/utils/firebase'
import badLabsApi from '@/utils/badLabsApi'
import formatTokenAmount from '@/functions/formatTokenAmount'
import { ADA_APP_ADDRESS, ADA_CIRCULATING, ADA_TOKEN_DECIMALS, ADA_TOKEN_ID, SOL_CIRCULATING, SOL_TOKEN_DECIMALS } from '@/constants'

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method, body } = req

  try {
    switch (method) {
      case 'POST': {
        const { txHash } = body
        const { utxos } = await badLabsApi.transaction.getData(txHash, { withUtxos: true })

        const matchedUtxos = utxos?.filter(
          ({ address, tokens }) => address.to === ADA_APP_ADDRESS && !!tokens.find(({ tokenId }) => tokenId === ADA_TOKEN_ID)
        )

        if (!matchedUtxos || !matchedUtxos.length) {
          return res.status(400).end('TX does not match Bridge conditions')
        }

        const utxosBatched: Record<string, number[]> = {}

        matchedUtxos.forEach(({ address, tokens }) => {
          const amounts = tokens.filter(({ tokenId }) => tokenId === ADA_TOKEN_ID).map(({ tokenAmount }) => tokenAmount.onChain)

          if (!utxosBatched[address.from]) {
            utxosBatched[address.from] = amounts
          } else {
            utxosBatched[address.from].push(...amounts)
          }
        })

        const objEntries = Object.entries(utxosBatched)

        if (objEntries.length > 1) {
          throw new Error('too many UTXO entries')
        }

        // remove duplicates
        objEntries.forEach(([k, v]) => {
          utxosBatched[k] = v.filter((item, pos, self) => self.indexOf(item) == pos)
        })

        let senderAddress = ''
        let sentAmount = 0

        Object.entries(utxosBatched).forEach(([k, v]) => {
          senderAddress = k
          sentAmount = v.reduce((total, num) => total + num)
        })

        const walletsCollection = firestore.collection('turtle-syndicate-wallets')
        const bridgeCollection = firestore.collection('trtl-bridge-to-sol')

        const { docs } = await walletsCollection.where('cardano', '==', senderAddress).get()

        if (!docs.length) {
          return res.status(400).end('Sender does not have a linked wallet')
        }

        if (docs.length > 1) {
          return res.status(400).end('Sender has too many linked wallets')
        }

        const { solana: solAddress } = docs[0].data()

        if (!solAddress) {
          return res.status(400).end('Sender does not have a linked wallet')
        }

        const solAmount = Math.floor(
          formatTokenAmount.toChain(
            formatTokenAmount.fromChain(sentAmount / (ADA_CIRCULATING / SOL_CIRCULATING), ADA_TOKEN_DECIMALS),
            SOL_TOKEN_DECIMALS
          )
        )

        const { id } = await bridgeCollection.add({
          adaTxHash: txHash,
          adaAddress: senderAddress,
          adaAmount: sentAmount,
          solAddress,
          solAmount,
          done: false,
        })

        return res.status(201).json({ id })
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
