/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useWallet } from '@meshsdk/react'
import { Transaction, keepRelevant } from '@meshsdk/core'
import txConfirmation from '@/functions/txConfirmation'
import formatTokenAmount from '@/functions/formatTokenAmount'
import Button from '../Button'
import Modal from '../Modal'
import TokenAmount from '../TokenAmount'
import type { SolAppBalanceResponse } from '@/pages/api/bridge/app-balance/solana'
import { ADA_BRIDGE_APP_ADDRESS, TRTL_COIN } from '@/constants'

const gatePolicies = [
  '4c1e0a4bcdd31f9e0dcdb62c8e7ce2dc69265078f41663ed8ab66816',
  '54be6339a5b264090ac59bbbddd2e370a89978efe7b8bd575f1e27e2',
  '3b0b923ec2cb5541ffb46b5a4c659c6edee0af60b32ec6061d9ea1eb',
]

const gateErrorMessage = `Must hold 1 of ${gatePolicies.length} Policy IDs`

const BridgeToSolanaModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { wallet, connected } = useWallet()
  const [isTokenGateHolder, setIsTokenGateHolder] = useState(false)

  const [submitting, setSubmitting] = useState(false)
  const [amounts, setAmounts] = useState({
    appBalance: 0,
    balance: 0,
    selected: 0,
    toGet: 0,
  })

  useEffect(() => {
    axios.get<SolAppBalanceResponse>('/api/bridge/app-balance/solana').then(({ data }) => {
      setAmounts((prev) => ({
        ...prev,
        appBalance: Number(data.tokenAmount.amount),
      }))
    })
  }, [])

  useEffect(() => {
    if (connected) {
      wallet.getPolicyIds().then((policies) => {
        let isHolder = false

        for (let i = 0; i < policies.length; i++) {
          const p = policies[i]

          if (!!gatePolicies.includes(p)) {
            isHolder = true
            break
          }
        }

        setIsTokenGateHolder(isHolder)

        wallet.getAssets().then((values) => {
          setAmounts((prev) => ({
            ...prev,
            balance: Number(values.find((v) => v.unit === TRTL_COIN['CARDANO']['TOKEN_ID'])?.quantity || '0'),
          }))
        })
      })
    }
  }, [connected])

  const buildTx = async () => {
    if (!isTokenGateHolder) {
      return toast.error(gateErrorMessage)
    } else {
      return toast.error('Bridge is closed at the moment...')
    }

    setSubmitting(true)
    let toastId = toast.loading('Building TX...')

    try {
      const tx = new Transaction({ initiator: wallet })
      const inputs = keepRelevant(new Map([[TRTL_COIN['CARDANO']['TOKEN_ID'], amounts.selected.toString()]]), await wallet.getUtxos())

      tx.setTxInputs(inputs)
      tx.sendAssets({ address: ADA_BRIDGE_APP_ADDRESS }, [
        {
          unit: TRTL_COIN['CARDANO']['TOKEN_ID'],
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

  return (
    <Modal open={isOpen} onClose={() => onClose()}>
      <div className='flex flex-col items-center'>
        <TokenAmount
          balance={amounts.balance}
          decimals={TRTL_COIN['CARDANO']['DECIMALS']}
          selectedAmount={amounts.selected}
          setSelectedAmount={(v) => {
            setAmounts((prev) => ({
              ...prev,
              selected: v,
              toGet: formatTokenAmount.toChain(
                formatTokenAmount.fromChain(
                  v / (TRTL_COIN['CARDANO']['CIRCULATING'] / TRTL_COIN['SOLANA']['CIRCULATING']),
                  TRTL_COIN['CARDANO']['DECIMALS']
                ),
                TRTL_COIN['SOLANA']['DECIMALS']
              ),
            }))
          }}
        />

        <p className='text-center text-zinc-400'>
          You&apos;ll get:&nbsp;
          <span className='text-zinc-200'>
            {Math.floor(formatTokenAmount.fromChain(amounts.toGet, TRTL_COIN['SOLANA']['DECIMALS'])).toLocaleString('en-US')}
          </span>
          &nbsp;$TRTL on Solana
        </p>

        <p className='my-2 text-center text-xs text-zinc-400'>
          (based on ownership % from circulating supply)
          <br />
          Cardano circulating: <span className='text-zinc-200'>{TRTL_COIN['CARDANO']['CIRCULATING'].toLocaleString('en-US')}</span>
          <br />
          Solana circulating: <span className='text-zinc-200'>{TRTL_COIN['SOLANA']['CIRCULATING'].toLocaleString('en-US')}</span>
        </p>

        <div className='my-2'>
          <Button label='Build TX' disabled={!amounts.selected || amounts.toGet > amounts.appBalance || submitting} onClick={buildTx} />
        </div>

        {/* <p className='mt-4 text-center text-xs text-zinc-400'>
          My Balance on Cardano:&nbsp;
          <span className='text-zinc-200'>
            {Math.floor(formatTokenAmount.fromChain(amounts.balance, TRTL_COIN['CARDANO']['DECIMALS'])).toLocaleString('en-US')}
          </span>
          &nbsp;$TRTL
          <br />
          Balance on Solana Bridge:&nbsp;
          <span className='text-zinc-200'>
            {Math.floor(formatTokenAmount.fromChain(amounts.appBalance, TRTL_COIN['SOLANA']['DECIMALS'])).toLocaleString('en-US')}
          </span>
          &nbsp;$TRTL
        </p> */}
      </div>
    </Modal>
  )
}

export default BridgeToSolanaModal
