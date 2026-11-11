import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { m, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import { ArrowUpRight, MessageCircle } from 'lucide-react';
import { Barcode } from '@/components/Barcode';
import { MailLink, WhatsAppLink } from '@/components/MailLink';
import { GithubIcon } from '@/components/Icons';
import { encode39 } from '@/lib/barcode';
import { isLite } from '@/lib/device';
import { FitLine, measureEm, useFontFit } from '@/lib/kinetic';
import { TECH_ICONS } from '@/lib/tech-icons';
import { useSite } from '@/lib/i18n';
import type { Content } from '@/site';

/** Para quien decide contratar: el mensaje y la evidencia, nada más. */
export function Value() {
  const site = useSite();
  const { value } = site;
  return (
    <section id="valor" className="bg-ink text-cream px-4 sm:px-6 pt-32 sm:pt-44 lg:pt-56 pb-20">
      <h2 className="font-mono text-[10px] sm:text-[11px] tracking-wider mb-8">{site.ui.whyHire}</h2>
      <div className="space-y-3 pt-3">
        {value.lines.map((line, i) => (
          <m.div key={line} initial={{ opacity: 0, y: 46 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-12%' }} transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}>
            <FitLine text={line} base={i ? 66 : 74} peak={20} />
          </m.div>
        ))}
      </div>

      <p className="text-[clamp(1.6rem,3vw,2.75rem)] leading-[1.08] max-w-4xl mt-10">{value.pitch}</p>

      <dl className="grid sm:grid-cols-3 gap-x-8 gap-y-8 mt-12 border-t border-cream/30 pt-7">
        {value.proof.map(([number, unit, detail], i) => (
          <m.div key={unit} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
            <dt className="flex items-baseline gap-2.5">
              <span className="kin text-[clamp(4.5rem,8.5vw,8.5rem)] leading-[0.82]" style={{ '--w': 62 } as React.CSSProperties}>{number}</span>
              <span className="font-mono text-[10px] sm:text-xs font-bold tracking-wider">{unit.toUpperCase()}</span>
            </dt>
            <dd className="text-[1.25rem] sm:text-[1.4rem] leading-[1.12] mt-3">{detail}</dd>
          </m.div>
        ))}
      </dl>

      <p className="font-mono text-[10px] sm:text-xs font-bold tracking-wider mt-12 border-t border-cream/30 pt-5 flex flex-wrap gap-x-8 gap-y-2">
        {value.offers.map((offer) => <span key={offer}>{offer.toUpperCase()}</span>)}
      </p>
    </section>
  );
}

const STRIPES = 18;

/** Paso de un color al otro con franjas que engordan al hacer scroll. */
const STRIPE_BG = { wine: 'bg-wine', ink: 'bg-ink' };
type StripeColor = keyof typeof STRIPE_BG;

export function Stripes({ from, to }: { from: StripeColor; to: StripeColor }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const progress = useTransform(scrollYProgress, [0.1, 0.75], [0.25, 1.35]);
  const lite = isLite();

  return (
    <m.div ref={ref} aria-hidden="true" className={`flex flex-col ${STRIPE_BG[from]}`} style={{ '--p': lite ? 1.35 : progress } as never}>
      {Array.from({ length: STRIPES }, (_, i) => (
        <div key={i} className="h-3 sm:h-4">
          <div className={`h-full origin-bottom ${STRIPE_BG[to]}`} style={{ transform: `scaleY(min(1, calc(var(--p) * ${(i + 1) / STRIPES})))` }} />
        </div>
      ))}
    </m.div>
  );
}

const MANIFESTO_WIDTH = 60;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** La frase se cuenta sola: primero un boceto con datos de build; el láser lo deja impecable. Solo transform y clip. */
export function Manifesto() {
  const section = useRef<HTMLElement>(null);
  const sticky = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const solid = useRef<HTMLSpanElement>(null);
  const wash = useRef<HTMLDivElement>(null);
  const laser = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLUListElement>(null);
  const box = useRef({ tallest: 1.4, left: 0, width: 0, full: 0 });
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end end'] });
  const closing = useTransform(scrollYProgress, [0.72, 0.92], [0, 1]);
  const { manifesto } = useSite().ui;

  const paint = (p: number) => {
    const { tallest, left, width, full } = box.current;
    if (!word.current || !solid.current || !wash.current || !laser.current || !log.current) return;
    word.current.style.transform = `scaleY(${(0.5 + (tallest - 0.5) * clamp01(p / 0.3)).toFixed(3)})`;
    const reveal = isLite() ? 1 : clamp01((p - 0.32) / 0.42);
    const x = reveal * full;
    wash.current.style.clipPath = `inset(0 ${(full - x).toFixed(1)}px 0 0)`;
    solid.current.style.clipPath = `inset(-20% ${Math.max(0, width - (x - left)).toFixed(1)}px -20% 0)`;
    laser.current.style.transform = `translateX(${x.toFixed(1)}px)`;
    laser.current.style.opacity = reveal > 0 && reveal < 1 ? '1' : '0';
    log.current.style.opacity = String(clamp01(1 - reveal * 3));
  };

  const fit = () => {
    if (!stage.current || !word.current || !sticky.current) return;
    const em = measureEm(manifesto.word, MANIFESTO_WIDTH);
    const size = (stage.current.clientWidth - 8) / em;
    word.current.style.fontSize = `${size}px`;
    const full = sticky.current.clientWidth;
    const width = size * em;
    box.current = { tallest: Math.max(0.9, Math.min(full < 768 ? 3.2 : 1.6, (stage.current.clientHeight * 0.92) / (size * 0.8))), left: (full - width) / 2, width, full };
    paint(scrollYProgress.get());
  };
  useFontFit(stage, fit);
  useLayoutEffect(fit, [manifesto.word]);
  useMotionValueEvent(scrollYProgress, 'change', paint);

  return (
    <section ref={section} className="relative h-[260vh] bg-ink text-cream">
      <div ref={sticky} className="sticky top-0 h-[100svh] pt-[52px] flex flex-col px-4 sm:px-6 overflow-hidden">
        <div ref={wash} aria-hidden="true" className="absolute inset-0 bg-wine" style={{ clipPath: 'inset(0 100% 0 0)' }} />

        <div className="relative z-10 flex items-start justify-between gap-6 pt-6">
          <div className="text-[clamp(2.4rem,6vw,5.5rem)] italic leading-none">{manifesto.first}</div>
          <ul ref={log} aria-hidden="true" className="font-mono text-[10px] sm:text-xs leading-[1.9] text-right">
            {manifesto.log.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </div>

        <div ref={stage} className="relative z-10 flex-1 flex items-center justify-center min-h-0">
          <div ref={word} className="relative kin leading-[0.8] whitespace-nowrap will-change-transform" style={{ transition: 'none', '--w': MANIFESTO_WIDTH } as React.CSSProperties}>
            <span aria-hidden="true" className="word-outline">{manifesto.word}</span>
            <span ref={solid} className="absolute inset-0" style={{ clipPath: 'inset(-20% 100% -20% 0)' }}>{manifesto.word}</span>
          </div>
        </div>

        <m.div style={{ opacity: closing }} className="relative z-10 pb-6 text-right text-[clamp(2.4rem,6vw,5.5rem)] italic leading-none">{manifesto.last}</m.div>

        <div ref={laser} aria-hidden="true" className="absolute inset-y-0 left-0 z-20 w-[3px] bg-cream shadow-[0_0_28px_10px_rgba(184,35,63,0.9)] opacity-0 will-change-transform" />
      </div>
    </section>
  );
}

const STAMP_GAP = 0.38;
const STAMPS = [
  { tilt: -5, place: 'lg:col-span-7' },
  { tilt: 4, place: 'lg:col-span-5 lg:mt-14' },
  { tilt: 3, place: 'lg:col-span-5 lg:-mt-4' },
  { tilt: -3.5, place: 'lg:col-span-7 lg:mt-6' },
];

/** Cada título cae como un sello de aprobado, uno tras otro, y la hoja acusa el golpe. */
export function Credentials() {
  const site = useSite();
  const shake = [...site.credentials.flatMap(() => [0, 0, 7, -3]), 0];

  return (
    <section id="titulos" className="bg-wine text-cream px-4 sm:px-6 pt-14 pb-24 overflow-hidden">
      <div className="flex justify-between font-mono text-[10px] sm:text-[11px] tracking-wider mb-10 lg:mb-14">
        <h2>{site.ui.credentials.title}</h2>
        <span>{site.credentials.length} {site.ui.credentials.approved}</span>
      </div>

      <m.div initial={{ y: 0 }} whileInView={{ y: shake }} viewport={{ once: true, margin: '-15%' }} transition={{ duration: STAMP_GAP * site.credentials.length, ease: 'linear' }}
        className="grid lg:grid-cols-12 gap-x-8 gap-y-9 lg:gap-y-10 max-w-[1500px] mx-auto">
        {site.credentials.map((credential, i) => (
          <m.article key={credential.code} className={STAMPS[i].place} style={{ willChange: 'transform, opacity' }}
            initial={{ opacity: 0, scale: 2.3, rotate: STAMPS[i].tilt * 3 }} whileInView={{ opacity: 1, scale: 1, rotate: STAMPS[i].tilt }}
            viewport={{ once: true, margin: '-15%' }} transition={{ duration: 0.24, delay: i * STAMP_GAP, ease: [0.55, 0, 1, 0.45] }}>
            <div className="border-[5px] sm:border-[7px] border-cream p-1 sm:p-1.5 stamp-wear">
              <div className="border-2 border-cream px-5 sm:px-7 py-5 sm:py-6">
                <div className="flex justify-between gap-4 font-mono text-[10px] sm:text-xs font-bold tracking-wider">
                  <span>{credential.kicker.toUpperCase()}</span>
                  <span>{credential.code}</span>
                </div>
                <h3 className="kin uppercase text-[clamp(2.5rem,6.2vw,6.4rem)] leading-[0.86] my-4 sm:my-5" style={{ '--w': 64 } as React.CSSProperties}>{credential.title}</h3>
                <p className="text-[clamp(1.15rem,1.7vw,1.6rem)] leading-[1.12]">{credential.detail}</p>
              </div>
            </div>
          </m.article>
        ))}
      </m.div>
    </section>
  );
}

// Grosor de código de barras: más ancha la que más proyectos usan.
const growOf = (tech: Content['stack'][number], active: boolean) => (active ? 2.1 : 1 + Math.max(0, tech.used.length - 1) * 0.3);

function TechLogo({ name, className = '' }: { name: string; className?: string }) {
  const icon = TECH_ICONS[name];
  if (!icon) return null;
  return (
    <svg viewBox={icon.viewBox} fill="currentColor" className={className} aria-hidden="true">
      {icon.paths.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Nombre en grande: siempre la misma altura, y la fuente cambia de ancho para llenar la línea. */
function StackReadout({ name }: { name: string }) {
  const box = useRef<HTMLDivElement>(null);
  const word = useRef<HTMLDivElement>(null);
  const text = name.toUpperCase();

  const fit = () => {
    if (!box.current || !word.current) return;
    const full = box.current.clientHeight / 0.8;
    const width = box.current.clientWidth;
    let wdth = 50;
    let size = width / measureEm(text, 50);
    if (size >= full) {
      size = full;
      let low = 50;
      let high = 150;
      for (let i = 0; i < 7; i++) {
        const middle = (low + high) / 2;
        if (measureEm(text, middle) * full <= width) low = middle;
        else high = middle;
      }
      wdth = low;
    }
    word.current.style.fontSize = `${size}px`;
    word.current.style.setProperty('--w', String(wdth));
  };

  useFontFit(box, fit);
  useLayoutEffect(fit);

  return (
    <div ref={box} className="h-[20svh] lg:h-[27svh] min-h-[90px] overflow-hidden flex items-end">
      <m.div key={name} ref={word} initial={{ y: '45%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="kin leading-[0.8] whitespace-nowrap" style={{ transition: 'none' }}>{text}</m.div>
    </div>
  );
}

export function StackWall() {
  const site = useSite();
  const [active, setActive] = useState(site.stack[0].name);
  const current = site.stack.find((tech) => tech.name === active) ?? site.stack[0];
  const [perRow, setPerRow] = useState(() => (window.innerWidth >= 1024 ? 7 : 5));
  const rows = Array.from({ length: Math.ceil(site.stack.length / perRow) }, (_, i) => site.stack.slice(i * perRow, (i + 1) * perRow));

  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => setPerRow(query.matches ? 7 : 5);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return (
    <section id="stack" className="bg-ink text-cream px-4 sm:px-6 pt-14 pb-16 lg:pb-24 lg:min-h-[100svh] flex flex-col">
      <h2 className="font-mono text-[10px] sm:text-[11px] tracking-wider mb-6">{site.ui.stack.title}</h2>

      <StackReadout name={current.name} />

      <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 font-mono text-[10px] sm:text-xs tracking-wider border-y border-cream/30 py-3 mt-4 mb-4">
        <span>{current.group.toUpperCase()}</span>
        <span className="text-right">
          {current.note?.toUpperCase() ?? (current.used.length ? `${site.ui.stack.usedIn} ${current.used.join(' · ').toUpperCase()}` : site.ui.stack.workStack)}
        </span>
      </div>

      <div className="flex flex-col flex-1 min-h-[42svh] gap-1 sm:gap-1.5">
        {rows.map((row) => (
          <div key={row[0].name} className="flex flex-1 gap-1 sm:gap-1.5">
            {row.map((tech) => {
              const on = tech.name === active;
              return (
                <button key={tech.name} type="button" aria-pressed={on} onPointerEnter={() => setActive(tech.name)} onFocus={() => setActive(tech.name)} onClick={() => setActive(tech.name)}
                  className={`relative min-w-0 overflow-hidden flex flex-col items-center justify-center gap-2 sm:gap-3 px-1 py-3 transition-[flex-grow,background-color] duration-500 ease-out ${on ? 'bg-wine' : 'bg-wine-deep hover:bg-wine'}`}
                  style={{ flexGrow: growOf(tech, on), flexBasis: 0 }}>
                  {on ? (
                    <m.span key={tech.name} initial={{ clipPath: 'inset(0 0 100% 0)' }} animate={{ clipPath: 'inset(0 0 0% 0)' }} transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}>
                      <TechLogo name={tech.name} className="scan-stripes block h-10 sm:h-14 lg:h-[4.5rem] w-auto" />
                    </m.span>
                  ) : (
                    <TechLogo name={tech.name} className="block h-7 sm:h-9 lg:h-11 w-auto" />
                  )}
                  <span className="kin uppercase whitespace-nowrap leading-none text-[13px] sm:text-lg lg:text-[1.35rem]" style={{ '--w': 62 } as React.CSSProperties}>{tech.name}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}

/** Código real que además reacciona al cursor como un ecualizador. */
function LiveBarcode() {
  const site = useSite();
  const elements = useMemo(() => encode39(site.identity.code), []);
  const bars = useRef<(HTMLDivElement | null)[]>([]);

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width;
    bars.current.forEach((bar, i) => {
      if (!bar) return;
      const distance = (x - i / elements.length) / 0.09;
      bar.style.transform = `scaleY(${1 - 0.62 * Math.exp(-distance * distance)})`;
    });
  };

  const onLeave = () => bars.current.forEach((bar) => { if (bar) bar.style.transform = 'scaleY(1)'; });

  return (
    <div className="flex h-[24vw] min-h-[92px] max-h-[360px]" onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      {elements.map((element, i) => (
        <div key={i} ref={(el) => { bars.current[i] = el; }} className={`origin-bottom transition-transform duration-200 ease-out ${element.bar ? 'bg-cream' : ''}`} style={{ flexGrow: element.width, flexBasis: 0 }} />
      ))}
    </div>
  );
}

export function Contact() {
  const year = new Date().getFullYear();
  const site = useSite();
  return (
    <footer id="caja-footer">
      <section id="caja" className="bg-wine text-cream px-4 sm:px-6 pt-16 lg:pt-24 pb-14 lg:pb-20">
        <h2><FitLine text={site.ui.contact.title} base={64} peak={26} /></h2>
        <div className="mt-8 grid lg:grid-cols-2 gap-8 items-end">
          <p className="text-[clamp(1.75rem,4vw,3.75rem)] leading-[1.02] italic">{site.ui.contact.text}</p>
          <div className="grid sm:grid-cols-3 gap-2 font-mono text-xs font-bold tracking-wider">
            <WhatsAppLink message={site.ui.whatsappMessage} className="group flex items-center justify-between bg-cream text-ink hover:bg-ink hover:text-cream px-5 py-5 transition-colors">
              <span className="flex items-center gap-2.5"><MessageCircle className="w-4 h-4" />WHATSAPP</span><ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </WhatsAppLink>
            <MailLink className="group flex items-center justify-between bg-ink text-cream hover:bg-wine-deep px-5 py-5 transition-colors">
              {site.ui.write}<ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </MailLink>
            <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between border border-cream hover:bg-ink px-5 py-5 transition-colors">
              <span className="flex items-center gap-2.5"><GithubIcon className="w-4 h-4" />GITHUB</span><ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>
      <div className="bg-ink px-4 sm:px-10 pt-8 sm:pt-10 pb-5">
        <LiveBarcode />
        <div className="font-mono text-[10px] sm:text-xs tracking-[0.5em] text-center text-cream mt-3">{site.identity.code}</div>
      </div>
      <div className="bg-ink text-cream/80 border-t border-cream/15 px-4 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-4 font-mono text-[10px] tracking-wide sm:tracking-wider whitespace-nowrap">
        <span>© {year} {site.brand.fullName.toUpperCase()}</span>
        <span>{site.brand.location.toUpperCase()}</span>
      </div>
    </footer>
  );
}
