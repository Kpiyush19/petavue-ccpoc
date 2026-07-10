import './Spinner.css'

// Shared app spinner — the multi-dot fading orbit, tinted petavue primary
// (#3661ed). Use this everywhere instead of lucide `Loader2` / phosphor
// `CircleNotch`. `size` is the visual diameter in px; the dots orbit within
// that box (the inner element is sized off `--pv-size = size / 62` so the
// full box-shadow footprint lands right on the `size` box).
export function Spinner({ size = 20, className = '', style, weight, ...props }) {
  // `weight` is swallowed so this is a drop-in for Phosphor icons (e.g. as a
  // PvButton `icon`), where the caller passes an icon-weight prop we don't use.
  return (
    <span
      className={`pv-spinner-box ${className}`}
      style={{ width: size, height: size, ...style }}
      role="status"
      aria-label="Loading"
      {...props}
    >
      <span className="pv-spinner" style={{ '--pv-size': `${size / 62}px` }} aria-hidden="true" />
    </span>
  )
}

export default Spinner
