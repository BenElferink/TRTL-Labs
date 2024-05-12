import { useEffect, useState } from 'react'
import { useWallet } from '@meshsdk/react'
import formatTokenAmount from '@/functions/formatTokenAmount'
import { RedButton } from './Button'
import Modal from './Modal'
import Loader from './Loader'
import WalletUrl from './WalletUrl'
import TokenAmount from './TokenAmount'
import CardanoWalletModal from './CardanoWalletModal'
import type { SubmittedPayload } from '@/@types'
import { ADA_TOKEN_DECIMALS, ADA_TOKEN_ID } from '@/constants'

const BridgeToSolanaModal = ({ isOpen, onClose, submitted }: { isOpen: boolean; onClose: () => void; submitted: SubmittedPayload }) => {
  const { wallet, connected, disconnect } = useWallet()
  const [connectedAddress, setConnectedAddress] = useState('')
  const [balanceAmount, setBalanceAmount] = useState(0)
  const [selectedAmount, setSelectedAmount] = useState(0)

  useEffect(() => {
    if (connected) {
      wallet.getUsedAddresses().then((values) => {
        setConnectedAddress(values[0])
      })

      wallet.getAssets().then((values) => {
        const ownedTrtl = Number(values.find((v) => v.unit === ADA_TOKEN_ID)?.quantity || '0')

        setBalanceAmount(ownedTrtl)
      })
    }
  }, [connected])

  if (!connected && isOpen) {
    return <CardanoWalletModal isOpen onClose={() => {}} />
  }

  if (!connectedAddress) {
    return (
      <Modal open={isOpen} onClose={() => onClose()}>
        <Loader />
      </Modal>
    )
  }

  if (connectedAddress !== submitted.cardano) {
    return (
      <Modal open={isOpen} onClose={() => onClose()}>
        <div className='flex flex-col items-center text-center'>
          <p className='my-2 text-lg'>
            Connected Wallet does not match Linked Wallet,
            <br />
            please connect a different wallet.
          </p>

          <p className='my-2 text-sm'>
            Connected with: <WalletUrl type='cardano' address={submitted.cardano} />
            <br />
            Linked with: <WalletUrl type='cardano' address={connectedAddress} />
          </p>

          <RedButton
            label='Disconnect'
            onClick={() => {
              setConnectedAddress('')
              disconnect()
            }}
          />
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={isOpen} onClose={() => onClose()}>
      <div className='flex flex-col items-center'>
        <TokenAmount balance={balanceAmount} decimals={ADA_TOKEN_DECIMALS} selectedAmount={selectedAmount} setSelectedAmount={setSelectedAmount} />

        <p className='my-2 text-center text-zinc-400'>
          You&apos;ll get:&nbsp;
          <span className='text-zinc-200'>
            {(formatTokenAmount.fromChain(selectedAmount, ADA_TOKEN_DECIMALS) / (236 / 60)).toLocaleString('en-US')}
          </span>
          &nbsp;$TRTL on Solana
        </p>

        <p className='my-2 text-center text-xs text-zinc-400'>
          (based on circulating supply ownership %)
          <br />
          Cardano circulating: 236b
          <br />
          Solana circulating: 60b
        </p>
      </div>
    </Modal>
  )
}

export default BridgeToSolanaModal
