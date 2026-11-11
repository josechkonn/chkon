import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUpRight, Lock, Maximize2, Plus, X } from 'lucide-react';
import { Barcode } from '@/components/Barcode';
import { GithubIcon } from '@/components/Icons';
import { encode39 } from '@/lib/barcode';
import { isLite, prefersReducedMotion } from '@/lib/device';
import { FitLine } from '@/lib/kinetic';
import { safeUrl, timeAgo, type GithubData, type Repo } from '@/lib/github';
import { useLang } from '@/lib/i18n';
import type { Content } from '@/site';

type Item = Content['featured'][number] & { data?: Repo };

const GRID = 'grid grid-cols-[5rem_1fr_auto] lg:grid-cols-[2.5rem_11rem_1fr_minmax(0,21rem)_8.5rem_2rem] items-center gap-x-3 lg:gap-x-5';

const NAV_HEIGHT = 52;
const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const;
const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** La imagen entra por franjas de su propio código de barras mientras pasa el escáner. */
function ScanImage({ src, video, alt, code, className = '' }: { src: string; video?: string; alt: string; code: string; className?: string }) {
  const strips = useMemo(() => {
    const elements = encode39(code);
    const total = elements.reduce((sum, element) => sum + element.width, 0);
    let start = 0;
    return elements.map((element) => {
      const fraction = element.width / total;
      const strip = { ...element, fraction, position: (start / total / (1 - fraction)) * 100 };
      start += element.width;
      return strip;
    });
  }, [code]);
  const middle = strips.length / 2;
  const lite = isLite();

  return (
    <div className={`relative overflow-hidden bg-wine-deep ${className}`}>
      {!lite && <div className="absolute inset-0 flex" aria-hidden="true">
        {strips.map((strip, i) => (
          <m.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ duration: 0.42, ease: EASE_IN_OUT, delay: (strip.bar ? 0.08 : 0.32) + (Math.abs(i - middle) / middle) * 0.14 }}
            className={i % 2 ? 'origin-top' : 'origin-bottom'}
            style={{ flexGrow: strip.width, flexBasis: 0, marginRight: '-0.5px', backgroundImage: `url(${src})`, backgroundSize: `${100 / strip.fraction}% auto`, backgroundPosition: `${strip.position}% 0%` }} />
        ))}
      </div>}
      {video && !lite && !prefersReducedMotion() ? (
        <m.video src={video} poster={src} aria-label={alt} autoPlay muted loop playsInline preload="metadata" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12, delay: 0.92 }} className="absolute inset-0 w-full h-full object-cover object-top" />
      ) : (
        <m.img src={src} alt={alt} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.12, delay: lite ? 0 : 0.92 }} className="absolute inset-0 w-full h-full object-cover object-top" />
      )}
      {!lite && <m.div aria-hidden="true" className="absolute inset-x-0 h-[2px] bg-cream shadow-[0_0_14px_3px_rgba(242,232,213,0.75)]"
        initial={{ top: '0%', opacity: 1 }} animate={{ top: '100%', opacity: [1, 1, 0] }} transition={{ duration: 0.8, delay: 0.18, ease: 'easeInOut' }} />}
    </div>
  );
}

/** Imagen o video completo en un diálogo nativo: atrapa el foco y cierra con Esc por sí solo. */
function Lightbox({ src, video, alt, closeLabel, onClose }: { src: string; video?: string; alt: string; closeLabel: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      if (element.open) element.close();
    };
  }, []);

  const closeOnBackdrop = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <dialog ref={dialog} aria-label={alt} onClose={onClose} onClick={closeOnBackdrop} className="fixed inset-0 m-0 p-0 w-screen h-[100dvh] max-w-none max-h-none bg-ink/95 text-cream backdrop:bg-ink/95">
      <div onClick={closeOnBackdrop} className="w-full h-full flex items-center justify-center p-3 pt-16 sm:p-10 sm:pt-16">
        <m.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.28, ease: EASE_OUT }} className="max-w-full max-h-full flex">
          {video ? (
            <video src={video} poster={src} aria-label={alt} controls autoPlay muted loop playsInline className="max-w-full max-h-[calc(100dvh-5.5rem)] object-contain" />
          ) : (
            <img src={src} alt={alt} className="max-w-full max-h-[calc(100dvh-5.5rem)] object-contain" />
          )}
        </m.div>
      </div>
      <button type="button" onClick={onClose} aria-label={closeLabel} className="absolute top-3 right-3 sm:top-4 sm:right-5 w-11 h-11 flex items-center justify-center bg-wine hover:bg-wine-deep border border-cream/50 transition-colors">
        <X className="w-5 h-5" />
      </button>
    </dialog>
  );
}

function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <span key={i} className="inline-block overflow-hidden align-top pb-[0.12em] -mb-[0.12em] mr-[0.24em]">
          <m.span className="inline-block" initial={{ y: '115%' }} animate={{ y: 0 }} transition={{ duration: 0.55, ease: EASE_OUT, delay: 0.34 + i * 0.022 }}>{word}</m.span>
        </span>
      ))}
    </>
  );
}

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: EASE_OUT, delay },
});

/** Sube junto con el cierre: el scroll nativo se interrumpe mientras la página se encoge. */
function glideTo(target: number) {
  const start = window.scrollY;
  const began = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - began) / 650);
    const eased = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    window.scrollTo({ top: start + (target - start) * eased, behavior: 'instant' });
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function Row({ item, index, open, onToggle }: { item: Item; index: number; open: boolean; onToggle: () => void }) {
  const { lang, site } = useLang();
  const ui = site.ui.projects;
  const demo = safeUrl(item.data?.homepage);
  const button = 'inline-flex items-center gap-2.5 px-5 py-4 font-mono text-xs font-bold tracking-wider transition-colors';
  const wide = item.title.length > 14 ? 58 : item.title.length > 8 ? 74 : 88;
  const rowRef = useRef<HTMLLIElement>(null);
  const [inView, setInView] = useState(false);
  const [armed, setArmed] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    if (!open || !rowRef.current) {
      setInView(false);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '-52px 0px -90px 0px' });
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, [open]);

  const close = () => {
    const top = rowRef.current?.getBoundingClientRect().top ?? 0;
    if (top < NAV_HEIGHT) {
      const target = window.scrollY + top - NAV_HEIGHT;
      glideTo(target);
    }
    onToggle();
  };

  return (
    <li ref={rowRef} className={`scroll-mt-[52px] border-t-2 border-cream/30 transition-colors duration-500 ${open ? 'bg-ink text-cream' : 'text-cream hover:bg-ink'}`}>
      <button onClick={onToggle} onPointerEnter={() => setArmed(!isLite())} aria-expanded={open} className={`group relative isolate overflow-hidden w-full text-left px-4 sm:px-6 py-3 lg:py-4 ${GRID}`}>
        {!open && armed && (
          <span className="absolute inset-0 -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true">
            <img src={item.image} alt="" decoding="async" className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[1200ms] ease-out" />
            <span className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/85" />
          </span>
        )}
        <span className="hidden lg:block font-mono text-[11px]">{String(index + 1).padStart(2, '0')}</span>
        <span className="block h-14 lg:h-[6.5rem] overflow-hidden bg-ink">
          <img src={item.image.replace('/projects/', '/projects/thumb/')} alt="" loading="lazy" decoding="async" width={420} height={280} className={`w-full h-full object-cover object-top transition-transform duration-700 ease-out group-hover:scale-110 ${open ? 'scale-125' : ''}`} />
        </span>
        <span className="min-w-0">
          <span className={`kin block uppercase leading-[0.92] text-[clamp(1.7rem,5.6vw,5.4rem)] lg:truncate pb-[0.05em] [transition:font-variation-settings_0.65s_cubic-bezier(0.22,1,0.36,1)] ${open ? '[--w:var(--open)]' : '[--w:58] group-hover:[--w:var(--open)]'}`} style={{ '--open': wide } as React.CSSProperties}>{item.title}</span>
          {!open && <span className="lg:hidden block italic text-[1.05rem] leading-tight mt-1">{item.hook}</span>}
        </span>
        <span className={`hidden lg:block italic text-[1.6rem] leading-[1.05] transition-opacity duration-300 ${open ? 'opacity-0' : ''}`}>{item.hook}</span>
        <span className="hidden lg:block font-mono text-[11px]">{item.data ? timeAgo(item.data.pushedAt, lang).toUpperCase() : ui.private}</span>
        <Plus className={`w-5 h-5 justify-self-end transition-transform duration-500 ${open ? 'rotate-[135deg]' : ''}`} />
      </button>

      {zoomed && <Lightbox src={item.image} video={item.video} alt={`${ui.capture} ${item.title}`} closeLabel={ui.closeLabel} onClose={() => setZoomed(false)} />}

      <AnimatePresence>
        {open && inView && (
          <m.button key="close" type="button" onClick={close} aria-label={`${ui.closeLabel} ${item.title}`}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.3, ease: EASE_OUT }}
            className="fixed z-40 bottom-5 sm:bottom-7 inset-x-0 mx-auto w-max flex items-center gap-2.5 bg-wine hover:bg-wine-deep border border-cream/50 text-cream px-5 py-3.5 font-mono text-xs font-bold tracking-wider shadow-[0_12px_32px_rgba(14,10,11,0.65)] transition-colors">
            <X className="w-4 h-4" />{ui.close}
          </m.button>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {open && (
          <m.div key="panel" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.65, ease: EASE_IN_OUT }} className="overflow-hidden">
            <m.div exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
              <div className="relative">
                <ScanImage src={item.image} video={item.video} alt={`${ui.capture} ${item.title}`} code={item.sku} className="aspect-[3/2] lg:aspect-[5/2]" />
                <button type="button" onClick={() => setZoomed(true)} aria-label={`${ui.viewFull}: ${item.title}`} className="group/zoom absolute inset-0 cursor-zoom-in">
                  <span className="absolute top-4 left-4 sm:top-7 sm:left-7 z-10 flex items-center gap-2 bg-ink/85 group-hover/zoom:bg-wine border border-cream/50 px-3 py-2 font-mono text-[10px] sm:text-xs font-bold tracking-wider transition-colors">
                    <Maximize2 className="w-3.5 h-3.5" />{ui.viewFull}
                  </span>
                </button>
                <m.div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.7 }} />
                <m.div className="absolute top-4 right-4 sm:top-7 sm:right-7 pointer-events-none" initial={{ opacity: 0, scale: 2.2, rotate: -16 }} animate={{ opacity: 1, scale: 1, rotate: -6 }} transition={{ duration: 0.24, delay: 1, ease: [0.55, 0, 1, 0.45] }}>
                  <div className="border-[3px] border-cream px-3 py-1.5 font-mono text-[10px] sm:text-xs font-bold tracking-wider stamp-wear">{item.discipline.toUpperCase()}</div>
                </m.div>
                <p className="pointer-events-none absolute inset-x-4 sm:inset-x-6 bottom-4 sm:bottom-7 italic text-[clamp(2.3rem,7.2vw,7.5rem)] leading-[0.98] max-w-[85%]"><Words text={item.hook} /></p>
              </div>

              <div className="px-4 sm:px-6 pt-7 pb-9 grid lg:grid-cols-12 gap-x-10 gap-y-7">
                <m.div {...rise(0.6)} className="lg:col-span-7">
                  <p className="text-[clamp(1.45rem,2.1vw,2.1rem)] leading-[1.1] mb-4">{item.description}</p>
                  {item.built.length > 0 && (
                    <ul className="text-[1.2rem] sm:text-[1.3rem] leading-[1.14] space-y-1.5 mb-5">
                      {item.built.map((line) => <li key={line} className="flex gap-2.5"><span className="mt-[0.55em] w-1.5 h-1.5 bg-cream shrink-0" />{line}</li>)}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
                    {item.tags.map((tag) => <span key={tag}>{tag.toUpperCase()}</span>)}
                  </div>
                </m.div>

                <div className="lg:col-span-5 flex flex-col gap-6">
                  {item.metrics.length > 0 && (
                    <m.dl {...rise(0.68)} className="flex flex-wrap gap-x-7 gap-y-3">
                      {item.metrics.map(([value, label]) => (
                        <div key={label}>
                          <dt className="kin text-[clamp(2.6rem,4.4vw,4.2rem)] leading-[0.85]" style={{ '--w': 64 } as React.CSSProperties}>{value}</dt>
                          <dd className="font-mono text-[10px] mt-1.5">{label.toUpperCase()}</dd>
                        </div>
                      ))}
                    </m.dl>
                  )}
                  <div className="flex flex-wrap items-end justify-between gap-5 mt-auto">
                    <m.div {...rise(0.76)} className="flex flex-wrap gap-2">
                      {item.data ? (
                        <>
                          <a href={item.data.url} target="_blank" rel="noopener noreferrer" className={`${button} bg-wine text-cream hover:bg-wine-deep`}>
                            <GithubIcon className="w-4 h-4" />{ui.code}<ArrowUpRight className="w-4 h-4" />
                          </a>
                          {demo && <a href={demo} target="_blank" rel="noopener noreferrer" className={`${button} border border-cream hover:bg-wine`}>DEMO<ArrowUpRight className="w-4 h-4" /></a>}
                        </>
                      ) : (
                        <span className={`${button} border border-cream/50`}><Lock className="w-3.5 h-3.5" />{ui.privateRepo}</span>
                      )}
                    </m.div>
                    <m.div initial={{ clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.8 }} className="text-cream w-36 text-[10px]">
                      <Barcode value={item.sku} caption className="h-12" />
                    </m.div>
                  </div>
                </div>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </li>
  );
}

export function Projects({ data }: { data: GithubData }) {
  const { lang, site } = useLang();
  const ui = site.ui.projects;
  const byName = new Map(data.repos.map((r) => [r.name, r]));
  const items: Item[] = site.featured
    .map((item) => ({ ...item, data: item.repo ? byName.get(item.repo) : undefined }))
    .filter((item) => !item.repo || item.data);

  const featuredNames = new Set(site.featured.map((f) => f.repo));
  const others = data.repos.filter((r) => !r.fork && !r.archived && !featuredNames.has(r.name) && !site.hiddenRepos.includes(r.name));

  const [open, setOpen] = useState<string | null>('PosBit');

  return (
    <section id="proyectos" className="bg-wine text-cream pt-14 pb-20">
      <div className="px-4 sm:px-6">
        <h2><FitLine text={ui.title} base={84} peak={26} /></h2>
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 mt-5 mb-10">
          <p className="text-[clamp(1.5rem,3vw,2.75rem)] italic leading-tight">{ui.intro}</p>
          <a href={site.links.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px] hover:underline underline-offset-4">
            <span className={`w-2 h-2 ${data.live ? 'bg-cream animate-pulse' : 'bg-cream/40'}`} />
            {data.live ? ui.synced : ui.copy} · {timeAgo(data.fetchedAt, lang).toUpperCase()}
          </a>
        </div>
      </div>

      <div className={`hidden lg:grid px-6 pb-2 font-mono text-[10px] tracking-wider ${GRID}`}>
        {ui.head.map((label) => <span key={label}>{label}</span>)}<span />
      </div>
      <ul className="border-b-2 border-cream/30">
        {items.map((item, i) => (
          <Row key={item.title} item={item} index={i} open={open === item.title} onToggle={() => setOpen(open === item.title ? null : item.title)} />
        ))}
      </ul>

      {others.length > 0 && (
        <div className="px-4 sm:px-6 mt-14">
          <div className="flex justify-between font-mono text-[10px] sm:text-[11px] tracking-wider pb-3">
            <span>{ui.more}</span>
            <span>{others.length} · {ui.byActivity}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-10 border-t border-cream/30">
            {others.map((repo) => (
              <a key={repo.name} href={repo.url} target="_blank" rel="noopener noreferrer" className="group flex items-baseline justify-between gap-4 border-b border-cream/30 py-3 hover:bg-ink transition-colors">
                <span className="min-w-0">
                  <span className="kin block uppercase text-2xl leading-none truncate [--w:64] group-hover:[--w:88]">{repo.name}</span>
                  <span className="block text-lg leading-tight mt-1 truncate">{repo.description ?? ui.noDescription}</span>
                </span>
                <span className="font-mono text-[10px] text-right shrink-0">
                  {repo.language?.toUpperCase()}<br />{timeAgo(repo.pushedAt, lang).toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
