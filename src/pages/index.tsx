'use client'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useEffect, useState } from 'react'
import axios from 'axios'
import Button from '@/components/Button'
import ConnectWallets from '@/components/ConnectWallets'
import BridgeToSolanaModal from '@/components/BridgeToSolanaModal'
import MintModal from '@/components/MintModal'
import type { DBWalletPayload } from '@/@types'
import Image from 'next/image'
import Link from 'next/link'
import {
  fetchAssetPrice,
  calculateRequiredADALPTokensV1,
  calculateRequiredADALPTokensV2,
  calculateRequiredSOLLPTokens,
  fetchTotalADALPTokens
} from '../functions/dynamicPricingLP';
import clientPromise from '@/utils/mongo'

export const getServerSideProps: GetServerSideProps<DBWalletPayload & { docId: string }> = async ({ query }) => {
  const id = (query.id || '') as string;

  if (!!id) {
    try {
      const client = await clientPromise;
      const db = client.db('TRTL'); 
      const collection = db.collection('turtle-syndicate-wallets'); 
      const doc = await collection.findOne({ _Id: id });
      
      if (doc) {
        const transformedDoc: DBWalletPayload = {
          cardano: doc.cardano || '',
          solana: doc.solana || '',
        };

        return { props: { ...transformedDoc, docId: id } };
      }
    } catch (error) {
      console.error('Failed to fetch document:', error);
    }
  }

  return { props: { docId: id, cardano: '', solana: '' } };
};

export type PageProps = InferGetServerSidePropsType<typeof getServerSideProps>;

const Page = ({ docId, cardano: cardanoAddress, solana: solanaAddress }: PageProps) => {
  const [submitted, setSubmitted] = useState({ id: docId, cardano: cardanoAddress, solana: solanaAddress })
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(!!cardanoAddress && !!solanaAddress)
  const [adaprice, setAdaPrice] = useState<number | null>(null);
  const [adaTvlV1, setAdaTvlV1] = useState<number | null>(null);
  const [adaTvlV2, setAdaTvlV2] = useState<number | null>(null);
  const [adaLpTokensV1, setV1LPTokens] = useState<number>(0);
  const [adaLpTokensV2, setV2LPTokens] = useState<number>(0);
  const [lpTokensNeededV1, setLPTokensNeededV1] = useState<number>(0);
  const [lpTokensNeededV2, setLPTokensNeededV2] = useState<number>(0);
  const [lpTokensSolNeeded, setLPTokensSolNeeded] = useState<number>(0);

  useEffect(() => setReady(true), [])

  const [openModals, setOpenModals] = useState({
    solanaBridge: false,
    cardanoBridge: false,
    mintSidekick: false,
  })

  const toggleModal = (name: keyof typeof openModals) => {
    setOpenModals((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  // Fetch TRTL V1 and V2 Pool Data
  const fetchTrtlPoolData = async (poolType: 'v1' | 'v2') => {
    try {
      const response = await axios.get('/api/dynamic_lp_price/getADATRTLTVLData', {
        params: { poolType },
      });
      return response.data.tvl;
    } catch (error) {
      console.error(`Error fetching TRTL ${poolType.toUpperCase()} pool data:`, error);
      return null;
    }
  }

  useEffect(() => {
    fetchAssetPrice('cardano', setAdaPrice);

    fetchTrtlPoolData('v1').then(setAdaTvlV1);
    fetchTrtlPoolData('v2').then(setAdaTvlV2);

    fetchTotalADALPTokens(setV1LPTokens, setV2LPTokens);

    if (adaprice !== null && adaTvlV1 !== null && adaTvlV2 !== null && adaLpTokensV1 !== null && adaLpTokensV2 !== null) {
      calculateRequiredADALPTokensV1(adaprice, adaTvlV1, adaLpTokensV1, setLPTokensNeededV1);
      calculateRequiredADALPTokensV2(adaprice, adaTvlV2, adaLpTokensV2, setLPTokensNeededV2);
      calculateRequiredSOLLPTokens(setLPTokensSolNeeded);
    }
  }, [adaprice, adaTvlV1, adaTvlV2, adaLpTokensV1, adaLpTokensV2, lpTokensSolNeeded]);

  return (
    <div className='w-screen h-screen flex flex-col items-center justify-between'>
      <header className='p-4 text-center'>
        <h1 className='text-3xl'>Tortol Token</h1>
        <p>Connect your wallets and go cross-chain!</p>
      </header>

      <main>
        <ConnectWallets ready={ready} done={done} setDone={setDone} submitted={submitted} setSubmitted={setSubmitted} />

        {done ? (
          <div>
            <div className='my-2 flex'>
              <Button
                label='Mint Turtle'
                colors='bg-green-500 border-green-400 [box-shadow:0_10px_0_0_#276749,0_15px_0_0_#27674941] active:[box-shadow:0_0px_0_0_#276749,0_0px_0_0_#27674941]'
                onClick={() => window.open('https://trtl-nft-swap.vercel.app', '_blank', 'noopener noreferrer')}
              />
              <Button
                label='Mint Sidekick'
                colors='bg-green-500 border-green-400 [box-shadow:0_10px_0_0_#276749,0_15px_0_0_#27674941] active:[box-shadow:0_0px_0_0_#276749,0_0px_0_0_#27674941]'
                onClick={() => toggleModal('mintSidekick')} // Open MintModal on button click
              />
            </div>
            <div className='my-2 flex'>
              <Button label='Bridge to Solana' onClick={() => toggleModal('solanaBridge')} />
              <Button label='Bridge to Cardano' disabled onClick={() => toggleModal('cardanoBridge')} />
            </div>

            <MintModal 
            isOpen={openModals['mintSidekick']} 
            lpTokensNeededADAV1={lpTokensNeededV1} 
            lpTokensNeededADAV2={lpTokensNeededV2} 
            lpTokensNeededSOL={lpTokensSolNeeded} 
            onClose={() => toggleModal('mintSidekick')}
            cardanoAddress = {submitted.cardano}
            solanaAddress = {submitted.solana}/>

            <BridgeToSolanaModal isOpen={openModals['solanaBridge']} onClose={() => toggleModal('solanaBridge')} submitted={submitted} />
          </div>
        ) : null}
      </main>

      <footer className='p-4 text-center'>
        <h5 className='mb-4 text-xs'>Contributions from:</h5>

        <div className='flex items-center justify-center'>
          <Link
            href='https://x.com/intent/follow?screen_name=BenElferink'
            target='_blank'
            rel='noopener noreferrer'
            className='m-2 mx-4 flex flex-col items-center justify-center'
          >
            <Image src='https://avatars.githubusercontent.com/u/69640911' alt='benelferink' width={50} height={50} className='rounded-full' />
            <h6 className='mt-2 text-sm text-start whitespace-nowrap'>$benelferink</h6>
          </Link>

          <Link
            href='https://x.com/intent/follow?screen_name=itzdannyADA'
            target='_blank'
            rel='noopener noreferrer'
            className='m-2 mx-4 flex flex-col items-center justify-center'
          >
            <Image src='/media/itzdanny.jpeg' alt='itzdanny' width={50} height={50} className='rounded-full' />
            <h6 className='mt-2 text-sm text-start whitespace-nowrap'>$itzdanny</h6>
          </Link>
        </div>
      </footer>
    </div>
  )
}

export default Page
