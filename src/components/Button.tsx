import { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

interface ButtonProps {
  children?: React.ReactNode
  label?: string
  icon?: ForwardRefExoticComponent<
    Omit<SVGProps<SVGSVGElement>, 'ref'> & {
      title?: string | undefined
      titleId?: string | undefined
    } & RefAttributes<SVGSVGElement>
  >
  onClick?: () => void
  disabled?: boolean
  colors?: string
}

const Button: (props: ButtonProps) => JSX.Element = (props) => {
  const {
    children,
    label,
    icon: Icon,
    onClick,
    disabled,
    colors = 'bg-blue-500 border-blue-400 [box-shadow:0_10px_0_0_#1b6ff8,0_15px_0_0_#1b70f841] active:[box-shadow:0_0px_0_0_#1b6ff8,0_0px_0_0_#1b70f841]',
  } = props;

  return (
    <button
      type='button'
      disabled={disabled}
      onClick={() => !!onClick && onClick()}
      className={
        'button w-40 h-16 m-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed select-none transition-all duration-150 rounded-full border-[1px] active:border-b-[0px] active:translate-y-2 ' +
        colors
      }
    >
      {Icon ? <Icon className='w-8 h-8 mr-2' /> : null}
      <span className='h-full flex flex-col items-center justify-center text-white text-lg font-[500]'>{children || label}</span>
    </button>
  );
};

export default Button;

export const RedButton: (props: ButtonProps) => JSX.Element = (props) => {
  const { children, ...rest } = props;

  return (
    <Button
      {...rest}
      colors="bg-red-700 border-red-600 [box-shadow:0_10px_0_0_#7f1d1d,0_15px_0_0_#7f1d1d41] active:[box-shadow:0_0px_0_0_#7f1d1d,0_0px_0_0_#7f1d1d41]"
    >
      {children}
    </Button>
  );
};
