import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useEffect, useState } from 'react'
import { useWallet as useCardanoWallet } from '@meshsdk/react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { firestore } from '@/utils/firebase'
import Url from '@/components/Url'
import ConnectWallets from '@/components/ConnectWallets'
import { DBPayload } from '@/@types'

export const getServerSideProps = (async ({ query }) => {
  const id = (query.id || '') as string

  if (!!id) {
    const collection = firestore.collection('turtle-syndicate-wallets')
    const doc = await collection.doc(id).get()

    if (doc.exists) {
      return { props: { ...(doc.data() as DBPayload), docId: id } }
    }
  }

  return { props: { docId: id, cardano: '', solana: '' } }
}) satisfies GetServerSideProps<DBPayload & { docId: string }>

export type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const Page = ({ docId, cardano: cardanoAddress, solana: solanaAddress }: PageProps) => {
  const cardano = useCardanoWallet()
  const solana = useSolanaWallet()

  const [ready, setReady] = useState(false)

  useEffect(() => {
    cardano.disconnect()
    solana.disconnect().then(() => {
      setReady(true)
    })
  }, [])

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-between'>
      <header className='p-4 text-center'>
        <h1 className='text-3xl'>Tortol Token</h1>
        <p>Connect your wallets for cross-chain airdrops!</p>
      </header>

      <ConnectWallets ready={ready} docId={docId} cardanoAddress={cardanoAddress} solanaAddress={solanaAddress} />

      <footer className='p-4 text-center'>
        <h6 className='text-sm'>
          Developed by <Url src='https://badfoxmc.com' label='BadFoxMC' />
        </h6>
      </footer>
    </div>
  )
}

export default Page
