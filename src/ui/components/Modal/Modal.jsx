import { X } from "@phosphor-icons/react";
import { twJoin, twMerge } from "tailwind-merge";
import MUIModal from "@mui/material/Modal";
import { Button } from "@/ui";
import { Tooltip } from '@/ui';

const variants = {
  primary: "border-t-[3px] border-t-[var(--color-primary-500)]",
  warning: "border-t-[3px] border-t-[var(--color-orange)]",
  error: "border-t-[3px] border-t-[var(--color-red)]"
};

export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  header,
  showHeader = true,
  className,
  headerClassName,
  titleClassName,
  closeClassName,
  childClassName,
  topBorderClassname = "",
  showCloseBtn = true,
  topStripClassName,
  center = true,
  styles = {},
  containerClassname = "",
  classes = {},
  variant = "primary"
}) => {
  const modalStyle = center ? { marginLeft: "auto", marginRight: "auto" } : { marginLeft: "calc(36%)" };

  return (
    <MUIModal
      open={isOpen}
      onClose={onClose}
      classes={{
        ...classes,
        backdrop: "!bg-[#44444466]"
      }}
    >
      <div
        className={twJoin(
          "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 focus-visible:outline-none",
          containerClassname && containerClassname
        )}
      >
        <div
          style={{ ...modalStyle, ...(styles?.modal || {}) }}
          className={twMerge(
            "bg-[var(--bg-tertiary)] w-96 rounded-xl overflow-hidden shadow-float z-50",
            className,
            variants[variant],
            topBorderClassname
          )}
        >
          {showHeader && (
            <div
              className={twMerge("flex items-center relative justify-between px-8 pt-6 pb-4 w-full", headerClassName)}
            >
              {header && <div className="w-full">{header}</div>}
              <Tooltip title={title} placement="bottom" displayTooltipOnOverflow>
                <h2 className={twMerge("text-[16px] font-semibold text-[var(--text-primary)] truncate w-[80%]", titleClassName)}>{title}</h2>
              </Tooltip>
              {showCloseBtn && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Close"
                  className={twMerge("p-1", closeClassName)}
                  onClick={onClose}
                >
                  <X size={16} className="text-[var(--text-muted)]" />
                </Button>
              )}
            </div>
          )}
          <div className={childClassName}>{children}</div>
        </div>
      </div>
    </MUIModal>
  );
};

export default Modal;
