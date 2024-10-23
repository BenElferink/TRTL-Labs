import { getAssetPrice } from '@/pages/api/dynamic_lp_price/getUSDPrice';
import { getADAV1PoolSupply, getADAV2PoolSupply } from '@/pages/api/dynamic_lp_price/getADATotalLPTokens';
import { getSOLTRTLLPprice } from '@/pages/api/dynamic_lp_price/getTRTLSOLData';
import axios from 'axios';

// Function to fetch asset price
export const fetchAssetPrice = async (assetId: string) => {
  try {
    const price = await getAssetPrice(assetId);

    return price;
  } catch (error) {
    console.error(`Failed to retrieve ${assetId} price:`, error);
  }
};

// Fetch TRTL V1 and V2 Pool Data
export const fetchTrtlPoolData = async (poolType: 'v1' | 'v2') => {
  try {
    const { data } = await axios.get('/api/dynamic_lp_price/getADATRTLTVLData', {
      params: { poolType },
    });

    return data.tvl;
  } catch (error) {
    console.error(`Error fetching TRTL ${poolType.toUpperCase()} pool data:`, error);
  }
};

// Fetch total ADA LP tokens
export const fetchTotalADALPTokens = async () => {
  try {
    const v1 = await getADAV1PoolSupply();
    const v2 = await getADAV2PoolSupply();

    return { v1, v2 };
  } catch (error) {
    console.error('Failed to retrieve total LP tokens:', error);
  }
};

// Calculate required V1 ADA LP tokens
export const calculateRequiredADALPTokensV1 = (adaprice: number | null, adaTvlV1: number | null, adaLpTokensV1: number | null) => {
  try {
    if (adaprice !== null && adaTvlV1 !== null && adaLpTokensV1 !== null) {
      const poolValueInUSD = adaTvlV1 * adaprice;
      const usdValuePerLPToken = poolValueInUSD / adaLpTokensV1;
      const lpTokensNeededV1 = 43.0 / usdValuePerLPToken;

      return lpTokensNeededV1;
    } else {
      console.error('Not all data is available for V1 LP token calculation');
    }
  } catch (error) {
    console.error('Error calculating V1 LP tokens required:', error);
  }

  return 0;
};

// Calculate required V2 ADA LP tokens
export const calculateRequiredADALPTokensV2 = (adaprice: number | null, adaTvlV2: number | null, adaLpTokensV2: number | null) => {
  try {
    if (adaprice !== null && adaTvlV2 !== null && adaLpTokensV2 !== null) {
      const poolValueInUSD = adaTvlV2 * adaprice;
      const usdValuePerLPToken = poolValueInUSD / adaLpTokensV2;
      const lpTokensNeededV2 = 43.0 / usdValuePerLPToken;

      return lpTokensNeededV2;
    } else {
      console.error('Not all data is available for V2 LP token calculation');
    }
  } catch (error) {
    console.error('Error calculating V2 LP tokens required:', error);
  }

  return 0;
};

// Calculate required SOL LP tokens
export const calculateRequiredSOLLPTokens = async () => {
  try {
    const solLPprice = await getSOLTRTLLPprice();
    if (solLPprice && solLPprice !== null) {
      const lpTokensSolNeeded = 43.0 / solLPprice;

      return lpTokensSolNeeded;
    } else {
      throw new Error('Failed to fetch necessary data for SOL calculations');
    }
  } catch (error) {
    console.error('Error calculating SOL/TRTL LP tokens required:', error);
  }

  return 0;
};
