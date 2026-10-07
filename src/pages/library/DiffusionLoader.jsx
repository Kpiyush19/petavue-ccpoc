/* The Diffusion image loader from generativeloaders.com.
   The published generative-loaders package (0.1.1) does not ship this variant
   yet, so its dots are drawn here inside the package's own loader frame and
   styles. Once the package includes it, this file can be replaced with
   <ImageLoader variant="diffusion" />. It fills the box it is put in. */
import "generative-loaders/styles.css";
import "./diffusionLoader.css";

// The same 28 dots the site draws: position, size and delay from the index.
const DOTS = Array.from({ length: 28 }, (_, t) => ({
  x: 8 + ((t * 37) % 84),
  y: 8 + ((t * 53) % 84),
  size: +(1.8 + ((t * 7) % 5) * 0.7).toFixed(2),
  delay: -((t * 13) % 28) / 28,
}));

export default function DiffusionLoader({ label = "Generating image", color = "var(--color-primary-500)", speed = 1 }) {
  return (
    <span
      className="iml-loader diffusion-loader"
      data-variant="diffusion"
      data-paused="false"
      role="status"
      aria-label={label}
      style={{ "--iml-color": color, "--iml-radius": "0px", "--iml-duration": `${2.35 / speed}s` }}
    >
      <span className="iml-visual" aria-hidden="true">
        <span className="iml-diffusion">
          {DOTS.map((d, i) => (
            <i
              key={i}
              style={{ "--iml-x": `${d.x}%`, "--iml-y": `${d.y}%`, "--iml-dot-size": `${d.size}%`, "--iml-delay": `calc(var(--iml-duration) * ${d.delay})` }}
            />
          ))}
        </span>
      </span>
    </span>
  );
}
