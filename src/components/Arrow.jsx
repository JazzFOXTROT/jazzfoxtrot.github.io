// The "opens elsewhere" arrow. Drawn as SVG so phones never swap it for the ↗ emoji
// and it looks the same in every font and on every device.
export default function Arrow({ className = '' }) {
  return (
    <svg className={`arrow-ne ${className}`.trim()} viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2.4 9.6 9.4 2.6M3.6 2.6h5.8v5.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </svg>
  );
}
