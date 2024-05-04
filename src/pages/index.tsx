import { useEffect, useState } from 'react'
import { useWallet as useCardanoWallet } from '@meshsdk/react'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import ConnectWallets from '@/components/ConnectWallets'
import Url from '@/components/Url'

const Page = () => {
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

      <ConnectWallets ready={ready} />

      <footer className='p-4 text-center'>
        <h6 className='text-sm'>
          Developed by <Url src='https://badfoxmc.com' label='BadFoxMC' />
        </h6>
      </footer>
    </div>
  )
}

export default Page
