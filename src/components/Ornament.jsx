import { asset } from '../asset.js';

// Engraved corner bracket from the Figma file: two copies of the same flourish,
// one vertical and one horizontal, mirrored like in the design.
export default function Ornament({ corner = 'top-right', className = '' }) {
  return (
    <span className={`ornament ornament--${corner} ${className}`.trim()} aria-hidden="true">
      <img className="ornament__v" src={asset('v3/ornament.png')} alt="" />
      <span className="ornament__h-box">
        <img className="ornament__h" src={asset('v3/ornament.png')} alt="" />
      </span>
    </span>
  );
}
