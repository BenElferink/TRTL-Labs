import axios from 'axios';

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/coins';

export const getAssetPrice = async (asset: string) => {
  try {
    const { data } = await axios.get(`${COINGECKO_API_URL}/${asset}`);
    const priceInUSD = data?.market_data?.current_price?.usd;

    if (!priceInUSD) {
      throw new Error('Price information is not available');
    }

    return priceInUSD;
  } catch (error) {
    console.error(`Error fetching price for ${asset}:`, error);
    throw new Error(`Failed to fetch price for ${asset}`);
  }
};
