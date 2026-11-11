import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Barcode } from '@/components/Barcode';
import { MailLink } from '@/components/MailLink';
import { FitLine, useFontFit } from '@/lib/kinetic';
import { caracasDateTime } from '@/lib/time';
import { LangSwitch, LangToggle, useSite } from '@/lib/i18n';

/** La barra es el lector: su borde es un código que se ilumina al bajar y un bloque marca la sección. */
export function Register({ repoCount, sectionsReady }: { repoCount: number; sectionsReady: boolean }) {
  const site = useSite();
  const [time, setTime] = useState(() => caracasDateTime().time);
  const [active, setActive] = useState<string | null>(null);
  const [solid, setSolid] = useState(false);
  const lit = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLSpanElement>(null);
  const nav = useRef<HTMLElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const paint = () => {
      frame = 0;
      const y = window.scrollY;
      const range = document.documentElement.scrollHeight - window.innerHeight;
      const progress = range > 0 ? Math.min(1, y / range) : 0;
      if (lit.current) lit.current.style.clipPath = `inset(0 ${((1 - progress) * 100).toFixed(2)}% 0 0)`;
      if (head.current) head.current.style.transform = `translateX(${(progress * window.innerWidth).toFixed(1)}px)`;
      setSolid(y > 24);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    paint();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [sectionsReady]);

  useEffect(() => {
    const id = setInterval(() => setTime(caracasDateTime().time), 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) setActive(target.id);
        else setActive((current) => (current === target.id ? null : current));
      }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    site.nav.forEach(({ id }) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, [sectionsReady]);

  const placeMarker = () => {
    const link = active ? nav.current?.querySelector<HTMLElement>(`[data-section="${active}"]`) : null;
    if (!marker.current) return;
    marker.current.style.opacity = link ? '1' : '0';
    if (link) {
      marker.current.style.width = `${link.offsetWidth}px`;
      marker.current.style.transform = `translateX(${link.offsetLeft}px)`;
    }
  };
  useFontFit(nav, placeMarker);
  useLayoutEffect(placeMarker);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 text-cream font-mono transition-colors duration-300 ${solid ? 'bg-ink' : 'bg-transparent'}`}>
      <div className="h-12 grid grid-cols-[auto_1fr] lg:grid-cols-[1fr_auto_1fr] items-stretch pl-4 sm:pl-6 pr-1 sm:pr-3 lg:pr-0">
        <div className="flex items-stretch">
        <a href="#inicio" aria-label={`${site.identity.name}, ${site.ui.homeLabel}`} className="group flex items-center gap-2.5">
          <Barcode value="JC" className="w-8 h-5 text-cream hidden sm:flex" />
          <span className="kin text-xl leading-none [--w:66] group-hover:[--w:112]">{site.identity.name}</span>
        </a>
        <LangToggle className="ml-1 lg:hidden" />
        </div>

        <nav ref={nav} aria-label={site.ui.navLabel} className="relative flex items-stretch justify-end lg:justify-center">
          <span ref={marker} aria-hidden="true" className="absolute inset-y-0 left-0 bg-wine opacity-0 transition-[transform,width,opacity] duration-300 ease-out" />
          {site.nav.map((link) => {
            const current = active === link.id;
            return (
              <a key={link.id} href={`#${link.id}`} data-section={link.id} aria-current={current ? 'true' : undefined}
                className={`relative flex items-center px-2 sm:px-4 text-[10px] sm:text-[11px] font-bold tracking-wide sm:tracking-wider transition-colors duration-200 ${current ? 'text-cream' : 'text-cream/70 hover:text-cream'}`}>
                {link.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-stretch justify-end">
          <LangSwitch className="items-center pr-4" />
          <div className="flex items-center gap-5 pr-5 text-[10px] tracking-wider">
            <span><span className="text-cream/70 mr-1.5">REPOS</span>{repoCount}</span>
            <span><span className="text-cream/70 mr-1.5">TÁCHIRA</span>{time}</span>
          </div>
          <MailLink className="group flex items-center gap-2 bg-wine hover:bg-wine-deep px-5 text-[11px] font-bold tracking-wider transition-colors">
            {site.ui.write}<ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </MailLink>
        </div>
      </div>

      <div className="relative h-1" aria-hidden="true">
        <Barcode value={site.identity.code} className="absolute inset-0 text-cream/25" />
        <div ref={lit} className="absolute inset-0 text-cream" style={{ clipPath: 'inset(0 100% 0 0)' }}>
          <Barcode value={site.identity.code} className="h-full" />
        </div>
        <span ref={head} className="absolute -top-1 left-0 w-[2px] h-3 bg-cream shadow-[0_0_12px_3px_rgba(184,35,63,0.95)]" />
      </div>
    </header>
  );
}

export function Hero({ repoCount }: { repoCount: number }) {
  const site = useSite();
  const stats: [string, string][] = [...site.ui.stats, [String(repoCount), site.ui.repos]];

  return (
    <section id="inicio" className="relative bg-wine text-cream overflow-hidden lg:h-[100svh] lg:min-h-[640px] pt-14">
      <div className="hero-shade absolute inset-0 z-[5] pointer-events-none" aria-hidden="true" />
      <div className="px-4 sm:px-6">
        <div className="flex justify-between font-mono text-[10px] sm:text-[11px] tracking-wider pb-3">
          <span>{site.role.toUpperCase()}</span>
          <span>{site.brand.location.toUpperCase()}</span>
        </div>
        <FitLine text={site.identity.name} base={60} peak={22} fillHeight={window.innerWidth < 1024 ? 0.4 : 0.58} />
      </div>

      {/* La máscara va en un contenedor más amplio que la foto: así no recorta la sombra en un rectángulo. */}
      <div className="pointer-events-none relative z-10 flex justify-center pt-20 -mt-[calc(27svh+5rem)] [mask-image:linear-gradient(to_bottom,#000_78%,transparent)] lg:contents">
        <img
          src="/hero/jose.webp" alt={site.brand.fullName} width={653} height={985} fetchPriority="high" draggable={false}
          className="hero-photo select-none h-[66svh] w-auto max-w-none lg:absolute lg:z-10 lg:bottom-0 lg:inset-x-0 lg:mx-auto lg:h-[92svh]" />
      </div>

      <div className="hero-floor absolute inset-x-0 bottom-0 h-[18%] z-[15] pointer-events-none" aria-hidden="true" />

      <div className="relative z-20 px-4 sm:px-6 pb-8 -mt-24 lg:mt-0 lg:static">
        <div className="lg:absolute lg:z-20 lg:left-6 lg:bottom-8 lg:w-[30vw] lg:max-w-[440px]">
          <div className="hero-name italic text-[clamp(1.9rem,3.1vw,3rem)] leading-none mb-1">{site.ui.hello}</div>
          <h1 className="hero-name uppercase leading-[0.86] text-[clamp(3.6rem,7.6vw,8rem)]">
            <span className="kin block" style={{ '--w': 66 } as React.CSSProperties}>{site.brand.first}</span>
            <span className="kin block" style={{ '--w': 66 } as React.CSSProperties}>{site.brand.last}</span>
          </h1>
          <p className="mt-4 text-[clamp(1.25rem,1.65vw,1.6rem)] leading-[1.14]">{site.bio}</p>
        </div>

        <div className="mt-8 lg:mt-0 lg:absolute lg:z-20 lg:right-6 lg:bottom-8 lg:w-[25vw] lg:max-w-[360px]">
          <p className="italic text-[clamp(1.6rem,2.3vw,2.25rem)] leading-[1.02] mb-5 lg:text-right">{site.statement}</p>
          <dl>
            {stats.map(([value, label]) => (
              <div key={label} className="flex items-baseline justify-between gap-4 border-t border-cream/40 py-1.5">
                <dt className="kin text-[2rem] leading-none" style={{ '--w': 72 } as React.CSSProperties}>{value}</dt>
                <dd className="font-mono text-[10px] sm:text-[11px] text-right">{label.toUpperCase()}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
