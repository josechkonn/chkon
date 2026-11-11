import { useLayoutEffect, useRef } from 'react';
import { isLite } from '@/lib/device';

/** Ejecuta `run` ahora, cuando carguen las fuentes y cada vez que cambie el tamaño del elemento. */
export function useFontFit(ref: React.RefObject<HTMLElement | null>, run: () => void) {
  const latest = useRef(run);
  latest.current = run;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let alive = true;
    const go = () => alive && latest.current();
    go();
    document.fonts.ready.then(go);
    const observer = new ResizeObserver(go);
    observer.observe(el);
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [ref]);
}

/** Ancho, en em, de un texto en negrita de Anybody con el ancho variable dado. */
export function measureEm(text: string, wdth: number): number {
  const probe = document.createElement('span');
  probe.textContent = text;
  probe.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font:900 100px Anybody,Impact,sans-serif;font-variation-settings:'wdth' ${wdth},'wght' 900;`;
  document.body.appendChild(probe);
  const em = probe.getBoundingClientRect().width / 100;
  probe.remove();
  return em;
}

type FitLineProps = {
  text: string;
  /** Ancho de reposo de las letras (50 a 150). */
  base?: number;
  /** Cuánto se ensancha la letra bajo el cursor. */
  peak?: number;
  /** Fracción de la altura de la ventana que debe ocupar (estira la letra en vertical). */
  fillHeight?: number;
  className?: string;
};

const LINE_HEIGHT = 0.8;

/** Una línea que ocupa todo el ancho, y cuyas letras se ensanchan cerca del cursor. */
function FitLineInner({ text, base = 70, peak = 24, fillHeight, className = '' }: FitLineProps) {
  const outer = useRef<HTMLSpanElement>(null);
  const inner = useRef<HTMLSpanElement>(null);
  const letters = useRef<HTMLSpanElement[]>([]);

  useFontFit(outer, () => {
    if (!outer.current || !inner.current) return;
    const size = (outer.current.clientWidth * 0.93) / measureEm(text, base);
    const natural = size * LINE_HEIGHT;
    const stretch = fillHeight ? Math.max(1, (window.innerHeight * fillHeight) / natural) : 1;
    inner.current.style.fontSize = `${size}px`;
    inner.current.style.transform = `scaleY(${stretch})`;
    outer.current.style.height = `${natural * stretch}px`;
  });

  const centers = useRef<number[]>([]);
  const frame = useRef(0);

  const onEnter = () => {
    centers.current = letters.current.map((letter) => {
      const box = letter.getBoundingClientRect();
      return box.left + box.width / 2;
    });
  };

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || isLite() || !outer.current) return;
    if (centers.current.length === 0) onEnter();
    const x = e.clientX;
    const radius = outer.current.clientWidth / 11;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      letters.current.forEach((letter, i) => {
        const distance = (x - centers.current[i]) / radius;
        letter.style.setProperty('--w', (base + peak * Math.exp(-distance * distance)).toFixed(1));
      });
    });
  };

  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    centers.current = [];
    letters.current.forEach((letter) => letter.style.setProperty('--w', String(base)));
  };

  letters.current = [];

  return (
    <span ref={outer} className={`block [contain:layout_style] ${className}`} onPointerEnter={onEnter} onPointerMove={onMove} onPointerLeave={onLeave}>
      <span className="sr-only">{text}</span>
      <span ref={inner} aria-hidden="true" className="flex justify-between items-start origin-top whitespace-nowrap uppercase" style={{ lineHeight: LINE_HEIGHT }}>
        {text.split('').map((char, i) =>
          char === ' ' ? (
            <span key={i} className="w-[0.14em] shrink-0" />
          ) : (
            <span key={i} ref={(el) => { if (el) letters.current.push(el); }} className="kin shrink-0" style={{ '--w': base } as React.CSSProperties}>{char}</span>
          ),
        )}
      </span>
    </span>
  );
}

/** Al cambiar el texto (por ejemplo, de idioma) se vuelve a medir desde cero. */
export function FitLine(props: FitLineProps) {
  return <FitLineInner key={props.text} {...props} />;
}
