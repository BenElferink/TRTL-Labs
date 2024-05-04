'use client'

import { Fragment, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useWallet as useCardanoWallet } from '@meshsdk/react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton as SolanaWalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { ArrowsRightLeftIcon, ArrowsUpDownIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import truncateStringInMiddle from '@/functions/truncateStringInMiddle'
import Url from '@/components/Url'
import Button from '@/components/Button'
import Loader from '@/components/Loader'
import CardanoWalletModal from '@/components/CardanoWalletModal'

const ConnectWallets = (props: { ready: boolean }) => {
  const { ready } = props

  const cardano = useCardanoWallet()
  const solana = useSolanaWallet()

  const [openCardanoModal, setOpenCardanoModal] = useState(false)
  const [done, setDone] = useState(false)
  const [submitted, setSubmitted] = useState({ cardano: '', solana: '' })

  const saveWallets = async (c: typeof cardano, s: typeof solana) => {
    const toastId = toast.loading('Linking wallets...', { duration: 1000 * 300 })

    const cUsedAddresses = await c.wallet.getUsedAddresses()
    let cAddy = ''

    if (cUsedAddresses.length) {
      cAddy = cUsedAddresses[0]
    } else {
      cAddy = await c.wallet.getChangeAddress()
    }

    let sAddy = s.publicKey?.toBase58()

    if (!sAddy) {
      sAddy = s.wallet?.adapter.publicKey?.toBase58() || 'ERROR: s.wallet?.adapter.publicKey?.toBase58()'
    }

    const payload = {
      cardano: cAddy,
      solana: sAddy,
    }

    try {
      await axios.post('/api/wallets', payload)

      setDone(true)
      setSubmitted(payload)

      toast.dismiss(toastId)
      toast.success('Successfully linked wallets', { duration: 1000 * 7 })

      await cardano.disconnect()
      await solana.disconnect()
    } catch (error: any) {
      console.error(error?.message || error)

      toast.dismiss(toastId)
      toast.error('Failed to link wallets', { duration: 1000 * 7 })
    }
  }

  useEffect(() => {
    if (ready && cardano.connected && solana.connected) saveWallets(cardano, solana)
  }, [ready, cardano.connected, solana.connected])

  if (ready && cardano.connected && solana.connected) {
    return <Loader />
  }

  if (done) {
    return (
      <div className='flex flex-col items-center justify-center'>
        <CheckBadgeIcon className='w-24 h-24 text-green-400' />
        <span>Successfully Linked!</span>

        <p className='mt-2 text-sm text-center'>
          <u className='mr-2'>Cardano:</u>
          <Url src={`https://cardanoscan.io/address/${submitted.cardano}`} label={truncateStringInMiddle(submitted.cardano, 7)} />
          <br />
          <u className='mr-2'>Solana:</u>
          <Url src={`https://explorer.solana.com/address/${submitted.solana}`} label={truncateStringInMiddle(submitted.solana, 7)} />
        </p>
      </div>
    )
  }

  return (
    <div className='flex flex-col sm:flex-row items-center justify-center'>
      <div className='m-2'>
        {!ready || cardano.connecting ? (
          <Loader />
        ) : cardano.connected ? (
          <div className='flex flex-col items-center justify-center'>
            <CheckBadgeIcon className='w-24 h-24 text-green-400' />
            <span>Cardano</span>
          </div>
        ) : (
          <Fragment>
            <Button label='Cardano' onClick={() => setOpenCardanoModal(true)} />
            <CardanoWalletModal isOpen={openCardanoModal} onClose={() => setOpenCardanoModal(false)} />
          </Fragment>
        )}
      </div>

      <div className='m-2'>
        <ArrowsRightLeftIcon className='w-12 h-12 hidden sm:block' />
        <ArrowsUpDownIcon className='w-12 h-12 block sm:hidden' />
      </div>

      <div className='m-2'>
        {!ready || solana.connecting ? (
          <Loader />
        ) : solana.connected ? (
          <div className='flex flex-col items-center justify-center'>
            <CheckBadgeIcon className='w-24 h-24 text-green-400' />
            <span>Solana</span>
          </div>
        ) : (
          <Button>
            <div className='relative'>
              <span className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0'>Solana</span>
              <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[42%] z-10 flex items-center justify-center'>
                <SolanaWalletMultiButton style={{ width: '165px', height: '75px', opacity: 0 }} />
              </div>
            </div>
          </Button>
        )}
      </div>
    </div>
  )
}

export default ConnectWallets
