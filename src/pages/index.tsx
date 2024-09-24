import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useEffect, useState } from 'react'
import { firestore } from '@/utils/firebase'
import Button from '@/components/Button'
import ConnectWallets from '@/components/ConnectWallets'
import BridgeToSolanaModal from '@/components/BridgeToSolanaModal'
//import MintModal from '@/components/MintModal'
import SoonModal from '@/components/SoonModal'
import type { DBWalletPayload } from '@/@types'
import Image from 'next/image'
import Link from 'next/link'
// import { getAssetPrice } from "./api/dynamic_lp_price/getUSDPrice";
// import { getADAV1PoolSupply, getADAV2PoolSupply } from "./api/dynamic_lp_price/getADATotalLPTokens";
// import { fetchTrtlV1PoolData, fetchTrtlV2PoolData } from "./api/dynamic_lp_price/getADATRTLTVLData";
// import { getSOLTRTLLPprice } from "./api/dynamic_lp_price/getTRTLSOLData";

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
  const [openSoonModal, setOpenScrollingModal] = useState(false);

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
            <Button
              label='Mint Sidekick'
              colors="bg-green-500 border-green-400 [box-shadow:0_10px_0_0_#276749,0_15px_0_0_#27674941] active:[box-shadow:0_0px_0_0_#276749,0_0px_0_0_#27674941]"
              onClick={() => setOpenScrollingModal(true)} // Open MintModal on button click
            />
            <Button label='Bridge to Cardano' disabled onClick={() => setOpenCardanoBridge(true)} />

            <BridgeToSolanaModal isOpen={openSolanaBridge} onClose={() => setOpenSolanaBridge(false)} submitted={submitted} />
            
            <SoonModal isOpen={openSoonModal} onClose={() => setOpenScrollingModal(false)} /> {/* ScrollingModal controlled by state */}
          </div>
        ) : null}
      </main>

      <footer className='p-4 flex items-center justify-center'>
  <Link href='https://labs.badfoxmc.com' target='_blank' rel='noopener noreferrer' className='mb-4 mr-6 flex items-center'>
    <Image src='https://labs.badfoxmc.com/media/logo/badlabs.png' alt='logo' width={50} height={50} />
    <h5 className='ml-2 text-sm text-start whitespace-nowrap'>
      <span className='text-xs'>Powered by:</span>
      <br />
      Bad Labs
    </h5>
  </Link>

  <Link href='https://x.com/itzdannyADA' target='_blank' rel='noopener noreferrer' className='mb-4 ml-6 flex items-center'>
    <Image src='/media/itzdanny.jpeg' alt='itzdanny' width={50} height={50} className="rounded-full" />
    <h5 className='ml-2 text-sm text-start whitespace-nowrap'>
      <span className='text-xs'>Contributions from:</span>
      <br />
      $itzdanny
    </h5>
  </Link>
</footer>

    </div>
  )
}

export default Page
