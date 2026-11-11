import { useEffect, useMemo, useState } from 'react';
import { Barcode } from '@/components/Barcode';
import { encode39 } from '@/lib/barcode';
import { sites } from '@/site';

const SCAN_START = 480;
const SCAN_SECONDS = 0.6;
const OUT_AT = SCAN_START + SCAN_SECONDS * 1000 + 110;
const END = OUT_AT + 600;
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)';

/** En pantallas táctiles se anima el código completo para evitar una capa de GPU por barra. */
export function Loader({ onDone }: { onDone: () => void }) {
  const [compact] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  const [phase, setPhase] = useState<'rise' | 'scan' | 'out'>('rise');
  const elements = useMemo(() => {
    const encoded = encode39(sites.es.identity.code);
    const total = encoded.reduce((sum, element) => sum + element.width, 0);
    let position = 0;
    return encoded.map((element) => {
      const center = (position + element.width / 2) / total;
      position += element.width;
      return { ...element, center };
    });
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    const timers = [setTimeout(() => setPhase('scan'), SCAN_START), setTimeout(() => setPhase('out'), OUT_AT), setTimeout(onDone, END)];
    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = '';
    };
  }, [onDone]);

  const leaving = phase === 'out';
  const scanned = phase !== 'rise';

  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden cursor-pointer ${leaving ? '' : 'bg-ink'}`} onClick={onDone} aria-hidden="true">
      {compact ? (
        <div className="absolute inset-0 bg-ink origin-top will-change-transform"
          style={{ animation: leaving ? `bar-out 0.42s ${EASE} both` : undefined }}>
          <div className="absolute inset-0 origin-bottom will-change-transform" style={{ animation: `bar-rise 0.36s ${EASE} both` }}>
            <Barcode value={sites.es.identity.code} className="h-full text-cream" />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex">
          {elements.map((element, i) => {
            const fromCenter = Math.abs(element.center - 0.5) * 2;
            const animation = leaving
              ? `bar-out 0.42s ${EASE} ${(fromCenter * 0.14).toFixed(3)}s both`
              : element.bar ? `bar-rise 0.36s ${EASE} ${(fromCenter * 0.12).toFixed(3)}s both` : undefined;
            return (
              <div key={i} className="relative" style={{ flexGrow: element.width, flexBasis: 0, marginRight: '-0.5px' }}>
                <div
                  className={`absolute inset-0 will-change-transform ${i % 2 ? 'origin-top' : 'origin-bottom'} ${element.bar ? (scanned ? 'bg-cream' : 'bg-wine') : 'bg-ink'}`}
                  style={{ animation, transition: `background-color 0.08s linear ${scanned ? element.center * SCAN_SECONDS : 0}s` }}
                />
              </div>
            );
          })}
        </div>
      )}

      {phase === 'scan' && (
        <div className={`absolute inset-y-0 left-0 w-[3px] will-change-transform ${compact ? 'bg-wine' : 'bg-cream shadow-[0_0_24px_8px_rgba(184,35,63,0.9)]'}`} style={{ animation: `laser ${SCAN_SECONDS}s linear both` }} />
      )}
    </div>
  );
}
