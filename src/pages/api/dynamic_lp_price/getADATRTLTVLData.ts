import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { TAPTOOLS_API_KEY } from '@/constants';

const apiUrl = 'https://openapi.taptools.io/api/v1/token/pools';

// Pool On-chain IDs
const trtlonchainIDv1pool = '0be55d262b29f564998ff81efe21bdc0022621c12f15af08d0f2ddb1.ccd6ccf11c5eab6a9964bc9a080a506342a4bb037209e100f0be238da7495a9c';
const trtlonchainIDv2pool = 'f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c.98cd1a0de51bf17c8ae857f72f215c75a447e4d04fa35cb58364e85e476012c3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { poolType } = req.query;

  let onchainID = '';
  if (poolType === 'v1') {
    onchainID = trtlonchainIDv1pool;
  } else if (poolType === 'v2') {
    onchainID = trtlonchainIDv2pool;
  } else {
    return res.status(400).json({ error: 'Invalid pool type' });
  }

  try {
    const response = await axios.get(apiUrl, {
      params: { onchainID },
      headers: {
        'x-api-key': TAPTOOLS_API_KEY,
      },
    });

    const poolData = response.data[0];
    
    const tvl = poolData.tokenBLocked * 2;
    return res.status(200).json({ tvl });
  } catch (error) {
    console.error('Error fetching pool data:', error);
    return res.status(500).json({ error: 'Failed to fetch pool data' });
  }
}
