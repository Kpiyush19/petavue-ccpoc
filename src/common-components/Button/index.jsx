import { Button as PrButton } from "primereact/button";
import { twMerge } from "tailwind-merge";

const btnSizeClass = {
  sm: "text-xs px-2 py-1 rounded-md",
  md: "text-xs px-3 py-1.5 rounded-md",
  lg: "text-sm font-medium px-3 py-1.5 rounded-lg",
  xl: "text-base font-medium px-6 py-2.5 rounded-lg"
};

const btnColorClass = {
  primary:
    "bg-pv-primary-primary-500 hover:bg-pv-primary-primary-800 active:bg-pv-primary-primary-300 border border-pv-primary-primary-500 hover:border-pv-primary-primary-800 active:border-pv-primary-primary-100 text-white",
  "primary red":
    "bg-pv-error-error-text hover:bg-[#aa0000] active:bg-[#ffa8a8] border border-pv-error-error-text hover:border-[#aa0000] active:border-[#ffa8a8] text-white",
  secondary:
    "bg-white hover:bg-pv-primary-primary-100 border border-pv-primary-primary-500 text-pv-primary-primary-500 active:bg-pv-primary-primary-50 active:border-pv-primary-primary-100 active:text-pv-primary-primary-300",
  ghost:
    "bg-white hover:bg-pv-neutral-grey-50 text-pv-neutral-grey-600 hover:text-pv-neutral-grey-800 active:bg-white active:text-pv-neutral-grey-300 border border-transparent hover:border-pv-neutral-grey-50 active:border-transparent",
  "secondary ghost":
    "bg-white hover:bg-pv-neutral-grey-50 text-pv-neutral-grey-600 hover:text-pv-neutral-grey-800 active:bg-white active:text-pv-neutral-grey-300 border border-pv-neutral-grey-300 hover:border-pv-neutral-grey-500 active:border-pv-neutral-grey-100",
  "blue ghost":
    "bg-transparent hover:bg-pv-primary-primary-50 text-pv-primary-primary-500 hover:text-pv-primary-primary-800 active:bg-transparent active:text-pv-primary-primary-300 border border-transparent hover:border-pv-primary-primary-50 active:border-transparent",
  "red ghost":
    "bg-transparent hover:bg-pv-error-bg text-pv-error-text hover:text-pv-error-text/80 active:bg-transparent active:text-pv-error-text/60 border border-transparent hover:border-pv-error-bg active:border-transparent",
  transparent:
    "bg-transparent hover:bg-pv-neutral-grey-50 text-pv-neutral-grey-600 hover:text-pv-neutral-grey-800 active:bg-white active:text-pv-neutral-grey-300 border border-transparent hover:border-tranparent active:border-transparent"
};

const btnDisabledColorClass = {
  primary: "bg-pv-neutral-grey-100 text-pv-neutral-grey-300 border border-pv-neutral-grey-100",
  "primary red": "bg-pv-neutral-grey-100 text-pv-neutral-grey-300 border border-pv-neutral-grey-100",
  secondary: "bg-pv-neutral-grey-100 text-pv-neutral-grey-300 border border-pv-neutral-grey-200",
  ghost: "bg-white text-pv-neutral-grey-300 border border-transparent",
  "secondary ghost": "bg-white text-pv-neutral-grey-300 border border-pv-neutral-grey-200",
  "blue ghost": "bg-transparent text-pv-primary-primary-300 border border-transparent",
  "red ghost": "bg-transparent text-pv-error-text/40 border border-transparent",
  transparent: "bg-transparent text-pv-neutral-grey-300 border border-transparent"
};

export const Button = ({
  label = "",
  onClick,
  btnSize = "md",
  type = "button",
  children,
  btnColor = "primary",
  btnRef = null,
  disabled,
  mainBtnClassName = "",
  className = "",
  id,
  title = "",
  "aria-label": ariaLabel
}) => {
  return (
    <div className={`${className} ${disabled ? `cursor-not-allowed` : `cursor-pointer`}`}>
      <PrButton
        onClick={(e) => {
          onClick?.(e);
        }}
        label={label}
        disabled={disabled}
        type={type}
        ref={btnRef}
        id={id}
        aria-label={ariaLabel}
        title={title}
        pt={{
          root: () => {
            return {
              className: twMerge(
                "h-min gap-2 w-full flex items-center justify-center whitespace-nowrap focus-within:outline-none focus-within:ring-0",
                btnSizeClass[btnSize],
                disabled ? btnDisabledColorClass[btnColor] : btnColorClass[btnColor],
                mainBtnClassName
              ),
              style: {
                boxShadow: "none"
              }
            };
          }
        }}
      >
        {children}
      </PrButton>
    </div>
  );
};

export default Button;
