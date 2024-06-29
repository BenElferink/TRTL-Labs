import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useWallet } from '@meshsdk/react'
import { Transaction, keepRelevant } from '@meshsdk/core'
import badLabsApi from '@/utils/badLabsApi'
import txConfirmation from '@/functions/txConfirmation'
import formatTokenAmount from '@/functions/formatTokenAmount'
import Button, { RedButton } from './Button'
import Modal from './Modal'
import Loader from './Loader'
import WalletUrl from './WalletUrl'
import TokenAmount from './TokenAmount'
import CardanoWalletModal from './CardanoWalletModal'
import type { SubmittedPayload } from '@/@types'
import type { SolAppBalanceResponse } from '@/pages/api/app-balance/solana'
import { ADA_APP_ADDRESS, ADA_CIRCULATING, ADA_TOKEN_DECIMALS, ADA_TOKEN_ID, SOL_CIRCULATING, SOL_TOKEN_DECIMALS } from '@/constants'

const gatePolicies = [
  '4c1e0a4bcdd31f9e0dcdb62c8e7ce2dc69265078f41663ed8ab66816',
  '54be6339a5b264090ac59bbbddd2e370a89978efe7b8bd575f1e27e2',
  '3b0b923ec2cb5541ffb46b5a4c659c6edee0af60b32ec6061d9ea1eb',
]

const gateErrorMessage = `Must hold 1 of ${gatePolicies.length} Policy IDs`

const BridgeToSolanaModal = ({ isOpen, onClose, submitted }: { isOpen: boolean; onClose: () => void; submitted: SubmittedPayload }) => {
  const { wallet, connected, disconnect } = useWallet()
  const [connectedAddress, setConnectedAddress] = useState('')
  const [isTokenGateHolder, setIsTokenGateHolder] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [amounts, setAmounts] = useState({
    appBalance: 0,
    balance: 0,
    selected: 0,
    toGet: 0,
  })

  useEffect(() => {
    axios.get<SolAppBalanceResponse>('/api/app-balance/solana').then(({ data }) => {
      setAmounts((prev) => ({
        ...prev,
        appBalance: Number(data.tokenAmount.amount),
      }))
    })
  }, [])

  useEffect(() => {
    if (connected) {
      wallet.getUsedAddresses().then((values) => {
        const a = values[0]
        setConnectedAddress(a)

        badLabsApi.wallet.getData(a, { withTokens: true }).then(({ tokens }) => {
          let isHolder = false

          tokens?.forEach(({ tokenId }) => {
            if (!!gatePolicies.find((pId) => tokenId.indexOf(pId) === 0)) {
              isHolder = true
            }
          })

          setIsTokenGateHolder(isHolder)
        })
      })
    }
  }, [connected])

  useEffect(() => {
    if (!!connectedAddress && connectedAddress === submitted.cardano) {
      wallet.getAssets().then((values) => {
        setAmounts((prev) => ({
          ...prev,
          balance: Number(values.find((v) => v.unit === ADA_TOKEN_ID)?.quantity || '0'),
        }))
      })
    }
  }, [connectedAddress])

  const buildTx = async () => {
    if (!isTokenGateHolder) {
      return toast.error(gateErrorMessage)
    }

    setSubmitting(true)
    let toastId = toast.loading('Building TX...')

    try {
      const tx = new Transaction({ initiator: wallet })
      const inputs = keepRelevant(new Map([[ADA_TOKEN_ID, amounts.selected.toString()]]), await wallet.getUtxos())

      tx.setTxInputs(inputs)
      tx.sendAssets({ address: ADA_APP_ADDRESS }, [
        {
          unit: ADA_TOKEN_ID,
          quantity: amounts.selected.toString(),
        },
      ])

      console.log('Building TX...')
      const unsignedTx = await tx.build()

      console.log('Awaiting Signature...', unsignedTx)
      const signedTx = await wallet.signTx(unsignedTx)

      console.log('Submitting TX...', signedTx)
      const txHash = await wallet.submitTx(signedTx)

      toast.dismiss(toastId)
      toastId = toast.loading('Awaiting Network Confirmation...')
      console.log('Awaiting Network Confirmation...', txHash)
      await txConfirmation(txHash)

      await axios.post('/api/bridge/cardano-to-solana/tx', { txHash })

      toast.dismiss(toastId)
      toast.success('TX Confirmed!')
      console.log('TX Confirmed!', txHash)
    } catch (error: any) {
      toast.dismiss(toastId)
      toast.error(error?.message || 'Unknown Error')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

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
        <TokenAmount
          balance={amounts.balance}
          decimals={ADA_TOKEN_DECIMALS}
          selectedAmount={amounts.selected}
          setSelectedAmount={(v) => {
            setAmounts((prev) => ({
              ...prev,
              selected: v,
              toGet: formatTokenAmount.toChain(
                formatTokenAmount.fromChain(v / (ADA_CIRCULATING / SOL_CIRCULATING), ADA_TOKEN_DECIMALS),
                SOL_TOKEN_DECIMALS
              ),
            }))
          }}
        />

        <p className='text-center text-zinc-400'>
          You&apos;ll get:&nbsp;
          <span className='text-zinc-200'>{Math.floor(formatTokenAmount.fromChain(amounts.toGet, SOL_TOKEN_DECIMALS)).toLocaleString('en-US')}</span>
          &nbsp;$TRTL on Solana
        </p>

        <p className='my-2 text-center text-xs text-zinc-400'>
          (based on ownership % from circulating supply)
          <br />
          Cardano circulating: <span className='text-zinc-200'>{ADA_CIRCULATING.toLocaleString('en-US')}</span>
          <br />
          Solana circulating: <span className='text-zinc-200'>{SOL_CIRCULATING.toLocaleString('en-US')}</span>
        </p>

        <div className='my-2'>
          <Button label='Build TX' disabled={!amounts.selected || amounts.toGet > amounts.appBalance || submitting} onClick={buildTx} />
        </div>

        {/* <p className='mt-4 text-center text-xs text-zinc-400'>
          My Balance on Cardano:&nbsp;
          <span className='text-zinc-200'>
            {Math.floor(formatTokenAmount.fromChain(amounts.balance, ADA_TOKEN_DECIMALS)).toLocaleString('en-US')}
          </span>
          &nbsp;$TRTL
          <br />
          Balance on Solana Bridge:&nbsp;
          <span className='text-zinc-200'>
            {Math.floor(formatTokenAmount.fromChain(amounts.appBalance, SOL_TOKEN_DECIMALS)).toLocaleString('en-US')}
          </span>
          &nbsp;$TRTL
        </p> */}
      </div>
    </Modal>
  )
}

export default BridgeToSolanaModal
