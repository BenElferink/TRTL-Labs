export interface SubmittedPayload {
  id: any
  cardano: any
  solana: any
}

export interface DBWalletPayload {
  cardano: string
  solana: string
}

export interface DBBridgePayload {
  adaTxHash: string
  adaAddress: string
  adaAmount: number
  solTxHash: string
  solAddress: string
  solAmount: number
  done: boolean
}

export interface DbMintPayload {
  timestamp: number
  address: string
  amount: number
  amountMinted?: number
  didSend: boolean
  didMint: boolean
}
