import { getAssetPrice } from "../pages/api/dynamic_lp_price/getUSDPrice";
import { getADAV1PoolSupply, getADAV2PoolSupply } from "../pages/api/dynamic_lp_price/getADATotalLPTokens";
import { getSOLTRTLLPprice } from "../pages/api/dynamic_lp_price/getTRTLSOLData";

// Function to fetch asset price
export const fetchAssetPrice = async (
  assetId: string, 
  setPrice: React.Dispatch<React.SetStateAction<number | null>>
) => {
  try {
    const fetchedPrice = await getAssetPrice(assetId);
    setPrice(fetchedPrice);
  } catch (error) {
    console.error(`Failed to retrieve ${assetId} price:`, error);
  }
};

// Fetch total ADA LP tokens
export const fetchTotalADALPTokens = async (
  setV1LPTokens: React.Dispatch<React.SetStateAction<number>>,
  setV2LPTokens: React.Dispatch<React.SetStateAction<number>>
) => {
  try {
    const fetchedLPV1Tokens = await getADAV1PoolSupply();
    setV1LPTokens(fetchedLPV1Tokens);
    const fetchedLPV2Tokens = await getADAV2PoolSupply();
    setV2LPTokens(fetchedLPV2Tokens);
  } catch (error) {
    console.error("Failed to retrieve total LP tokens:", error);
  }
};

// Calculate required V1 ADA LP tokens
export const calculateRequiredADALPTokensV1 = (
  adaprice: number | null, 
  adaTvlV1: number | null, 
  adaLpTokensV1: number | null, 
  setLPTokensNeededV1: React.Dispatch<React.SetStateAction<number>>
) => {
  try {
    if (adaprice !== null && adaTvlV1 !== null && adaLpTokensV1 !== null) {
      const poolValueInUSD = adaTvlV1 * adaprice;
      const usdValuePerLPToken = poolValueInUSD / adaLpTokensV1;
      const lpTokensNeededV1 = 95.00 / usdValuePerLPToken;
      setLPTokensNeededV1(lpTokensNeededV1);
    } else {
      console.error('Not all data is available for V1 LP token calculation');
      setLPTokensNeededV1(0);
    }
  } catch (error) {
    console.error('Error calculating V1 LP tokens required:', error);
    setLPTokensNeededV1(0);
  }
};

// Calculate required V2 ADA LP tokens
export const calculateRequiredADALPTokensV2 = (
  adaprice: number | null, 
  adaTvlV2: number | null, 
  adaLpTokensV2: number | null, 
  setLPTokensNeededV2: React.Dispatch<React.SetStateAction<number>>
) => {
  try {
    if (adaprice !== null && adaTvlV2 !== null && adaLpTokensV2 !== null) {
      const poolValueInUSD = adaTvlV2 * adaprice;
      const usdValuePerLPToken = poolValueInUSD / adaLpTokensV2;
      const lpTokensNeededV2 = 95.00 / usdValuePerLPToken;
      setLPTokensNeededV2(lpTokensNeededV2);
    } else {
      console.error('Not all data is available for V2 LP token calculation');
      setLPTokensNeededV2(0);
    }
  } catch (error) {
    console.error('Error calculating V2 LP tokens required:', error);
    setLPTokensNeededV2(0);
  }
};

// Calculate required SOL LP tokens
export const calculateRequiredSOLLPTokens = async (
  setLPTokensSolNeeded: React.Dispatch<React.SetStateAction<number>>
) => {
  try {
    const solLPprice = await getSOLTRTLLPprice();
    if (solLPprice && solLPprice !== null) {
      const lpTokensSolNeeded = 95.00 / solLPprice;
      setLPTokensSolNeeded(lpTokensSolNeeded);
    } else {
      throw new Error('Failed to fetch necessary data for SOL calculations');
    }
  } catch (error) {
    console.error('Error calculating SOL/TRTL LP tokens required:', error);
    setLPTokensSolNeeded(0);
  }
};
