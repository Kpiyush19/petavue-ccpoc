import { Skeleton as MUISkeleton } from '@mui/material';
import { twMerge } from 'tailwind-merge';

export default function Skeleton({ width, height, className, variant = 'rectangular' }) {
  return (
    <MUISkeleton
      variant={variant}
      width={width}
      height={height}
      className={twMerge('bg-[var(--pv-neutral-grey-200)] rounded', className)}
      animation="pulse"
    />
  );
}
