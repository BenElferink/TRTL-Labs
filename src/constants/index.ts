export const ADA_TOKEN_ID = '52162581184a457fad70470161179c5766f00237d4b67e0f1df1b4e65452544c'
export const ADA_TOKEN_DECIMALS = 0
export const ADA_CIRCULATING = 168000000000

export const SOL_TOKEN_ID = '9TMuCmQqMBaW8JRPGJEAuetJt94JVruuKVY8r8HvtYKd'
export const SOL_TOKEN_DECIMALS = 6
export const SOL_CIRCULATING = 60000000000

export const SOL_NET = 'mainnet-beta'

export const ADA_APP_ADDRESS = 'addr1vx59g85l5wvweap5l76nnt9r429jt3yszm7x5n65aq87q5c0s8szy'
export const ADA_APP_SECRET_KEY = Array.isArray(process.env.ADA_APP_SECRET_KEY)
  ? process.env.ADA_APP_SECRET_KEY
  : process.env.ADA_APP_SECRET_KEY?.split(',') || []

export const SOL_APP_ADDRESS = 'ChCJv4P16YDBCVaM8eoLTaP7MMLE7ooMD5YbynBVtakZ'
export const SOL_APP_SECRET_KEY = (
  Array.isArray(process.env.SOL_APP_SECRET_KEY) ? process.env.SOL_APP_SECRET_KEY : process.env.SOL_APP_SECRET_KEY?.split(',') || []
).map((n) => Number(n))

export const BLOCKFROST_API_KEY = process.env.BLOCKFROST_API_KEY || ''

export const MONGODB_URI = process.env.MONGODB_URI || '';

export const TAPTOOLS_API_KEY = process.env.TAPTOOLS_API_KEY || '';

export const V1_TRTL_ADA_LP_TOKEN_POLICY = "e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86"
export const V1_TRTL_ADA_LP_TOKEN_HEXNAME = "ccd6ccf11c5eab6a9964bc9a080a506342a4bb037209e100f0be238da7495a9c"
export const V2_TRTL_ADA_LP_TOKEN_POLICY = "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c"
export const V2_TRTL_ADA_LP_TOKEN_HEXNAME = "98cd1a0de51bf17c8ae857f72f215c75a447e4d04fa35cb58364e85e476012c3"
