import axios from 'axios';

const apiUrl = "https://api-v3.raydium.io/pools/info/ids";
const idsParam = "8X6JvHBDTjB3hPQfNcHs5qvtZGwFVdwzj54SArvnw4NT"; // The ID parameter for the API call

export async function getSOLTRTLLPprice(): Promise<number> {
  try {
    const response = await axios.get(apiUrl, {
      params: {
        ids: idsParam,
      },
    });

    // Extract the relevant data from the response
    const poolData = response.data.data[0]; // Access the first item in the 'data' array
    const lpPrice = poolData.lpPrice; // LP price in USD
    return lpPrice;
  } catch (error) {
    console.error("Error fetching TRTL/SOL pool data:", error);
    throw new Error('Failed to fetch TRTL/SOL pool data');
  }
}