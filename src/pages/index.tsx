import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useEffect, useState } from 'react'
import { firestore } from '@/utils/firebase'
import Url from '@/components/Url'
import Button from '@/components/Button'
import ConnectWallets from '@/components/ConnectWallets'
import BridgeToSolanaModal from '@/components/BridgeToSolanaModal'
import type { DBWalletPayload } from '@/@types'
import Image from 'next/image'
import Link from 'next/link'

export const getServerSideProps = (async ({ query }) => {
  const id = (query.id || '') as string

  if (!!id) {
    const collection = firestore.collection('turtle-syndicate-wallets')
    const doc = await collection.doc(id).get()

    if (doc.exists) {
      return { props: { ...(doc.data() as DBWalletPayload), docId: id } }
    }
  }

  return { props: { docId: id, cardano: '', solana: '' } }
}) satisfies GetServerSideProps<DBWalletPayload & { docId: string }>

export type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const Page = ({ docId, cardano: cardanoAddress, solana: solanaAddress }: PageProps) => {
  const [submitted, setSubmitted] = useState({ id: docId, cardano: cardanoAddress, solana: solanaAddress })

  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(!!cardanoAddress && !!solanaAddress)

  useEffect(() => setReady(true), [])

  const [openSolanaBridge, setOpenSolanaBridge] = useState(false)
  const [openCardanoBridge, setOpenCardanoBridge] = useState(false)

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-between'>
      <header className='p-4 text-center'>
        <h1 className='text-3xl'>Tortol Token</h1>
        <p>Connect your wallets and go cross-chain!</p>
      </header>

      <main>
        <ConnectWallets ready={ready} done={done} setDone={setDone} submitted={submitted} setSubmitted={setSubmitted} />

        {done ? (
          <div className='flex'>
            <Button label='Bridge to Solana' onClick={() => setOpenSolanaBridge(true)} />
            <Button label='Bridge to Cardano' disabled onClick={() => setOpenCardanoBridge(true)} />

            <BridgeToSolanaModal isOpen={openSolanaBridge} onClose={() => setOpenSolanaBridge(false)} submitted={submitted} />
          </div>
        ) : null}
      </main>

      <footer className='p-4 text-center'>
        <Link href='https://labs.badfoxmc.com' target='_blank' rel='noopener noreferrer' className='mb-4 flex items-center justify-center'>
          <Image src='https://labs.badfoxmc.com/media/logo/badlabs.png' alt='logo' width={50} height={50} />
          <h5 className='ml-2 text-sm text-start whitespace-nowrap'>
            <span className='text-xs'>Powered by:</span>
            <br />
            Bad Labs
          </h5>
        </Link>
      </footer>
    </div>
  )
}

export default Page
