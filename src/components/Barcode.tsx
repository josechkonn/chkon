import { useMemo } from 'react';
import { barcodeText, encode39 } from '@/lib/barcode';

export function Barcode({ value, className = '', caption }: { value: string; className?: string; caption?: boolean }) {
  const bars = useMemo(() => {
    let x = 0;
    return encode39(value).map((element) => {
      const bar = { ...element, x };
      x += element.width;
      return bar;
    });
  }, [value]);
  const total = bars[bars.length - 1].x + bars[bars.length - 1].width;

  return (
    <div className={`flex flex-col ${className}`}>
      <svg viewBox={`0 0 ${total} 40`} preserveAspectRatio="none" className="block w-full flex-1 min-h-0" role="img" aria-label={`Código de barras: ${barcodeText(value)}`} shapeRendering="crispEdges">
        {bars.map((b) => b.bar && <rect key={b.x} x={b.x} width={b.width} height="40" fill="currentColor" />)}
      </svg>
      {caption && <div className="font-mono text-center tracking-[0.4em] text-[0.8em] mt-[0.5em]">{barcodeText(value)}</div>}
    </div>
  );
}
