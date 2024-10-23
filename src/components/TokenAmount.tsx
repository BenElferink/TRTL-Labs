import Image from 'next/image';
import { useState } from 'react';
import formatTokenAmount from '@/functions/formatTokenAmount';

interface TokenAmountProps {
  balance: number
  decimals: number
  selectedAmount: number
  setSelectedAmount: (selectedAmount: number) => void
}

const TokenAmount = (props: TokenAmountProps) => {
  const { balance, decimals, selectedAmount, setSelectedAmount } = props;

  const [amountType, setAmountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [amountValue, setAmountValue] = useState(0);

  const handleAmountChange = (val: string) => {
    let v = Number(val);

    if (!isNaN(v)) {
      if (amountType === 'FIXED') {
        v = formatTokenAmount.toChain(v, decimals);
      }
      v = Math.floor(v);

      // verify the amount is between the min and max ranges (with the help of available balance)
      if (amountType === 'FIXED') {
        const min = 0;
        const max = balance;

        v = v < min ? min : v > max ? max : v;

        setAmountValue(v);
      } else if (amountType === 'PERCENT') {
        const min = 0;
        const max = 100;

        v = v < min ? min : v > max ? max : v;

        setAmountValue(v);

        v = formatTokenAmount.toChain(Math.floor(formatTokenAmount.fromChain(balance * (v / 100), decimals)), decimals);
      }

      setSelectedAmount(v);
    }
  };

  return (
    <div>
      <h6 className='text-xl text-center'>How many tokens?</h6>

      <Image src='/media/trtl.png' alt='' className='w-[180px] h-[180px] my-4 mx-auto' width={180} height={180} priority unoptimized />

      <div className='flex items-center justify-center'>
        <div
          onClick={() => {
            setAmountType(() => 'FIXED');
            setAmountValue(0);
            setSelectedAmount(0);
          }}
          className={
            'group cursor-pointer my-2 p-4 border rounded-lg ' + (amountType === 'FIXED' ? 'text-white' : 'text-zinc-400 border-transparent')
          }
        >
          <label className='flex items-center group-hover:text-white cursor-pointer'>
            <input type='radio' name='amountType' value='FIXED' onChange={() => {}} checked={amountType === 'FIXED'} />
            <span className='ml-2'>Fixed Amount</span>
          </label>
        </div>

        <div
          onClick={() => {
            setAmountType(() => 'PERCENT');
            setAmountValue(0);
            setSelectedAmount(0);
          }}
          className={
            'group cursor-pointer my-2 p-4 border rounded-lg ' + (amountType === 'PERCENT' ? 'text-white' : 'text-zinc-400 border-transparent')
          }
        >
          <label className='flex items-center group-hover:text-white cursor-pointer'>
            <input type='radio' name='amountType' value='PERCENT' onChange={() => {}} checked={amountType === 'PERCENT'} />
            <span className='ml-2'>Percent Amount</span>
          </label>
        </div>
      </div>

      <div className='w-[calc(100%-0.5rem)] m-1'>
        <input
          value={amountType === 'PERCENT' ? amountValue || '' : formatTokenAmount.fromChain(amountValue, decimals) || ''}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder={amountType === 'PERCENT' ? 'Percent:' : 'Tokens:'}
          className='w-full p-4 flex items-center text-center placeholder:text-zinc-400 hover:placeholder:text-white focus:placeholder:text-white disabled:placeholder:text-zinc-600 disabled:text-zinc-600 rounded-lg border bg-zinc-700 hover:bg-zinc-600 focus:bg-zinc-600 disabled:bg-zinc-800 disabled:hover:bg-zinc-800 outline-none disabled:cursor-not-allowed border-transparent hover:border-zinc-400 focus:border-zinc-400 disabled:border-transparent'
        />
      </div>

      <p className='my-2 text-center text-xs text-zinc-400'>
        Selected:&nbsp;
        <span className='text-zinc-200'>{formatTokenAmount.fromChain(selectedAmount, decimals).toLocaleString('en-US')}</span>
        &nbsp;$TRTL
      </p>
    </div>
  );
};

export default TokenAmount;
