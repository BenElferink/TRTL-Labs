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
  txHash: string
  adaAddress: string
  adaAmount: number
  solAddress: string
  solAmount: number
  done: boolean
}
