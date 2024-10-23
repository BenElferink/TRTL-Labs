import { useMemo } from 'react';
import truncateStringInMiddle from '@/functions/truncateStringInMiddle';
import Url from './Url';

const WalletUrl = ({ type, address }: { type: 'cardano' | 'solana'; address: string }) => {
  const baseUrl = useMemo(() => {
    switch (type) {
      case 'cardano': {
        return 'https://cardanoscan.io/address/';
      }

      case 'solana': {
        return 'https://solscan.io/account/';
      }

      default: {
        return 'https://www.google.com/search?q=';
      }
    }
  }, [type]);

  return <Url src={`${baseUrl}${address}`} label={truncateStringInMiddle(address, 7)} />;
};

export default WalletUrl;
