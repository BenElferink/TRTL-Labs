import type { NextApiRequest, NextApiResponse } from 'next';
import blockfrost from '@/utils/blockfrost';
import type { components } from '@blockfrost/openapi';

export const config = {
  maxDuration: 300,
  api: {
    responseLimit: false,
  },
};

export type TransactionResponse = components['schemas']['tx_content']

const handler = async (req: NextApiRequest, res: NextApiResponse<TransactionResponse>) => {
  const { method, query } = req;

  console.log('query', query);

  const transactionId = query.transaction_id?.toString();

  if (!transactionId) {
    return res.status(400).end();
  }

  try {
    switch (method) {
      case 'GET': {
        console.log('Fetching TX:', transactionId);

        const tx = await blockfrost.txs(transactionId);

        console.log('Fetched TX');

        return res.status(200).json(tx);
      }

      default: {
        res.setHeader('Allow', 'GET');
        return res.status(405).end();
      }
    }
  } catch (error: any) {
    console.error(error);

    if (['The requested component has not been found.'].includes(error?.message)) {
      return res.status(404).end(`${error.message} ${transactionId}`);
    }

    return res.status(500).end();
  }
};

export default handler;
