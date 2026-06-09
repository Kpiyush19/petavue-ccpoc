import { InputSwitch } from 'primereact/inputswitch';
import { twMerge } from 'tailwind-merge';

const toggleSizes = {
  sm: {
    root: 'w-6 h-3',
    slider: 'before:w-[10px] before:h-[10px] before:left-[1px] before:top-[1px]',
    translate: 'before:translate-x-[12px]'
  },
  md: {
    root: 'w-7 h-4',
    slider: 'before:w-[14px] before:h-[14px] before:left-[1px] before:top-[1px]',
    translate: 'before:translate-x-3'
  },
  lg: {
    root: 'w-9 h-5',
    slider: 'before:w-[18px] before:h-[18px] before:left-[1px] before:top-[1px]',
    translate: 'before:translate-x-4'
  },
  xl: {
    root: 'w-11 h-6',
    slider: 'before:w-[22px] before:h-[22px] before:left-[1px] before:top-[1px]',
    translate: 'before:translate-x-5'
  }
};

export const Toggle = ({
  checked,
  onClick,
  onChange,
  disabled,
  size = 'md'
}) => {
  const sizeConfig = toggleSizes[size] || toggleSizes.md;

  const handleRootClick = (e) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    // Manually trigger onChange with PrimeReact's expected event structure
    if (onChange) {
      onChange({
        originalEvent: e,
        value: !checked,
        target: {
          type: 'checkbox',
          name: undefined,
          id: undefined,
          value: !checked,
          checked: !checked
        }
      });
    }

    if (onClick) {
      onClick(e);
    }
  };

  return (
    <span className={disabled ? 'cursor-not-allowed inline-block' : 'inline-block'}>
      <InputSwitch
        checked={checked}
        disabled={disabled}
        pt={{
          root: () => ({
            className: twMerge(
              sizeConfig.root,
              'rounded-2xl relative',
              'cursor-pointer',
              checked
                ? disabled
                  ? 'bg-pv-primary-primary-300'
                  : 'hover:bg-pv-primary-primary-800 bg-pv-primary-primary-500'
                : disabled
                  ? 'bg-pv-neutral-grey-200'
                  : 'bg-pv-neutral-grey-300 hover:bg-pv-neutral-grey-500'
            ),
            onClick: handleRootClick
          }),
          input: () => ({
            className: 'sr-only',
          }),
          slider: () => ({
            className: `absolute inset-0 pointer-events-none transition-all duration-200 ease-in-out ${sizeConfig.slider} before:absolute before:rounded-full before:transition-transform before:duration-200 ${
              checked
                ? disabled
                  ? `before:bg-pv-neutral-grey-50 ${sizeConfig.translate}`
                  : `before:bg-white ${sizeConfig.translate}`
                : disabled
                  ? 'before:bg-pv-neutral-grey-50 before:translate-x-0'
                  : 'before:bg-white before:translate-x-0'
            }`,
          }),
        }}
      />
    </span>
  );
};

export default Toggle;
