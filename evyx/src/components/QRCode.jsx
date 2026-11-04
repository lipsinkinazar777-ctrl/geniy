import { useMemo } from 'react';
import { qrPath } from '../lib/qr.js';

export default function QRCode({ value }) {
  const { d, n } = useMemo(() => qrPath(value), [value]);
  return (
    <div className="qr">
      <svg viewBox={`0 0 ${n} ${n}`} shapeRendering="crispEdges" role="img" aria-label="QR code of the wallet address"><path d={d} fill="#000" /></svg>
    </div>
  );
}
