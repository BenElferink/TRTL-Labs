import { useEffect, useState } from 'react'
import { useWallet } from '@meshsdk/react'
import Modal from './Modal'
import Loader from './Loader'
import WalletUrl from './WalletUrl'
import { RedButton } from './Button'
import CardanoWalletModal from './CardanoWalletModal'
import type { SubmittedPayload } from '@/@types'

const BridgeToSolanaModal = ({ isOpen, onClose, submitted }: { isOpen: boolean; onClose: () => void; submitted: SubmittedPayload }) => {
  const { wallet, connected, disconnect } = useWallet()
  const [connectedAddress, setConnectedAddress] = useState('')

  useEffect(() => {
    if (connected) {
      wallet.getUsedAddresses().then((values) => {
        setConnectedAddress(values[0])
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
      <div className='flex flex-col items-center text-center'>In Development...</div>
    </Modal>
  )
}

export default BridgeToSolanaModal
