export const ADA_TOKEN_ID = '52162581184a457fad70470161179c5766f00237d4b67e0f1df1b4e65452544c'
export const ADA_TOKEN_DECIMALS = 0

export const SOL_TOKEN_ID = '9TMuCmQqMBaW8JRPGJEAuetJt94JVruuKVY8r8HvtYKd'
export const SOL_TOKEN_DECIMALS = 6

export const SOL_NET = 'mainnet-beta'

// app wallet: ChCJv4P16YDBCVaM8eoLTaP7MMLE7ooMD5YbynBVtakZ
export const SOL_APP_SECRET_KEY = (
  Array.isArray(process.env.SOL_APP_SECRET_KEY) ? process.env.SOL_APP_SECRET_KEY : process.env.SOL_APP_SECRET_KEY?.split(',') || []
).map((n) => Number(n))

export const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || ''
export const FIREBASE_APP_ID = process.env.FIREBASE_APP_ID || ''
export const FIREBASE_AUTH_DOMAIN = process.env.FIREBASE_AUTH_DOMAIN || ''
export const FIREBASE_MESSAGING_SENDER_ID = process.env.FIREBASE_MESSAGING_SENDER_ID || ''
export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || ''
export const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || ''
