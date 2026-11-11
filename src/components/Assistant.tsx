import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, MessageSquare, X } from 'lucide-react';
import { useLang, useSite } from '@/lib/i18n';

type Message = { role: 'user' | 'assistant'; content: string };

const TAG = /\s*\[\[(ir|ver):([\w-]+)\]\]\s*/g;

/** Separa el texto de las etiquetas con que el asistente guía: [[ir:sección]] o [[ver:SKU]] para abrir un proyecto. */
function parse(content: string) {
  const tag = [...content.matchAll(TAG)].at(-1);
  return { text: content.replace(TAG, ' ').trim(), action: tag ? { kind: tag[1] as 'ir' | 'ver', id: tag[2] } : undefined };
}

/** Chat flotante: Jose responde con los datos del portafolio y lleva a la sección que corresponde. */
export function Assistant() {
  const reducedMotion = useReducedMotion();
  const site = useSite();
  const { lang } = useLang();
  const t = site.ui.assistant;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const log = useRef<HTMLDivElement>(null);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy, failed]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = async (question: string) => {
    const content = question.trim().slice(0, 600);
    if (!content || busy) return;
    const next = [...messages, { role: 'user' as const, content }];
    setMessages(next);
    setInput('');
    setFailed(false);
    setBusy(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, messages: next }),
      });
      const data = (await response.json()) as { reply?: string };
      if (!response.ok || !data.reply) throw new Error();
      setMessages([...next, { role: 'assistant', content: data.reply }]);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void ask(input);
  };

  const go = ({ kind, id }: { kind: 'ir' | 'ver'; id: string }) => {
    if (kind === 'ver') window.dispatchEvent(new CustomEvent('open-project', { detail: id }));
    else document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    if (window.matchMedia('(max-width: 639px)').matches) setOpen(false);
  };

  const label = ({ kind, id }: { kind: 'ir' | 'ver'; id: string }) => {
    if (kind === 'ver') {
      const project = site.featured.find((item) => item.sku === id);
      return project && `${t.see} ${project.title}`;
    }
    if (!document.getElementById(id)) return undefined;
    return `${t.go} ${id === 'valor' ? site.ui.whyHire : site.nav.find((item) => item.id === id)?.label ?? id}`;
  };

  return (
    <AnimatePresence initial={false} mode="wait">
      {!open ? (
        <m.button key="launcher" type="button" onClick={() => setOpen(true)}
          initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.9 }} transition={{ duration: 0.12 }}
          className="fixed z-[90] right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:right-6 sm:bottom-6 flex items-center gap-2.5 bg-cream text-ink border border-ink px-4 py-3 font-mono text-[11px] font-bold tracking-wider shadow-[4px_4px_0_#0E0A0B] hover:bg-ink hover:text-cream hover:border-cream transition-colors">
          <MessageSquare className="w-4 h-4" aria-hidden="true" />{t.open}
        </m.button>
      ) : (
        <m.section key="chat" role="dialog" aria-label={t.title}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, clipPath: 'inset(92% 0% 0% 0%)', scaleX: 0.4, y: 16, rotate: -2 }}
          animate={reducedMotion ? { opacity: 1 } : {
            opacity: [0, 1, 1], clipPath: ['inset(92% 0% 0% 0%)', 'inset(92% 0% 0% 0%)', 'inset(-12px -12px -12px -12px)'],
            scaleX: [0.4, 1, 1], y: [16, 0, 0], rotate: [-2, 0.8, 0],
          }}
          exit={reducedMotion ? { opacity: 0 } : {
            clipPath: ['inset(-12px -12px -12px -12px)', 'inset(92% 0% 0% 0%)', 'inset(92% 0% 0% 0%)'],
            scaleX: [1, 1, 0.4], y: [0, 0, 16], rotate: [0, -0.8, 2], opacity: [1, 1, 0],
            transition: { duration: 0.3, times: [0, 0.7, 1], ease: [0.4, 0, 1, 1] },
          }}
          transition={{ duration: reducedMotion ? 0.1 : 0.5, times: [0, 0.25, 1], ease: [0.22, 1, 0.36, 1] }}
          className="origin-bottom-right fixed z-[90] inset-x-0 bottom-0 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[380px] h-[min(560px,85svh)] flex flex-col bg-ink text-cream border border-cream/30 shadow-[6px_6px_0_#6B0F24]">
          <header className="flex items-center justify-between gap-3 bg-wine px-4 py-3 font-mono text-[11px] font-bold tracking-wider">
            <span className="flex items-center gap-3">
              <span className="relative shrink-0">
                <img src="/hero/avatar.webp" alt="" width={36} height={36} className="w-9 h-9 border border-cream/40" />
                <span className="absolute -right-0.5 -bottom-0.5 w-2.5 h-2.5 bg-cream border-2 border-wine" aria-hidden="true" />
              </span>
              <span className="flex flex-col gap-0.5">{t.title}<span className="font-normal text-[9px] tracking-wide text-cream/70">{t.status}</span></span>
            </span>
            <button type="button" onClick={() => setOpen(false)} aria-label={t.close} className="p-1 -m-1 hover:text-cream/70">
              <X className="w-4 h-4" />
            </button>
          </header>

          <div ref={log} aria-live="polite" className="flex-1 overflow-y-auto px-4 py-4 space-y-3 font-sans text-[15px] leading-relaxed">
            <div className="flex gap-2.5 max-w-[92%]"><img src="/hero/avatar.webp" alt="" width={28} height={28} className="w-7 h-7 shrink-0 mt-0.5" /><p>{t.hello}</p></div>
            {messages.map((message, index) => {
              if (message.role === 'user')
                return <p key={index} className="ml-auto w-fit max-w-[85%] bg-cream text-ink px-3 py-2">{message.content}</p>;
              const { text, action } = parse(message.content);
              const actionLabel = action && label(action);
              return (
                <div key={index} className="flex gap-2.5 max-w-[92%]">
                  <img src="/hero/avatar.webp" alt="" width={28} height={28} className="w-7 h-7 shrink-0 mt-0.5" />
                  <div className="space-y-2">
                  <p className="whitespace-pre-line">{text}</p>
                  {action && actionLabel && (
                    <button type="button" onClick={() => go(action)}
                      className="flex items-center gap-2 border border-cream/60 px-3 py-1.5 font-mono text-[10px] font-bold tracking-wider hover:bg-cream hover:text-ink transition-colors">
                      {actionLabel}<ArrowDown className="w-3 h-3" aria-hidden="true" />
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
            {busy && <p className="pl-[38px] font-mono text-[11px] tracking-wider text-cream/60 animate-pulse">{t.thinking}</p>}
            {failed && <p className="font-mono text-[11px] leading-relaxed text-cream/80 border-l-2 border-wine pl-3">{t.error}</p>}
            {!messages.length && (
              <div className="flex flex-wrap gap-2 pt-2">
                {t.suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" onClick={() => void ask(suggestion)}
                    className="border border-cream/40 px-3 py-1.5 font-mono text-[10px] tracking-wide hover:bg-cream hover:text-ink transition-colors">
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form onSubmit={submit} className="flex border-t border-cream/20">
            <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={600}
              placeholder={t.placeholder} aria-label={t.placeholder}
              className="flex-1 min-w-0 bg-transparent px-4 py-3.5 font-sans text-base sm:text-[15px] text-cream placeholder:text-cream/60 outline-none" />
            <button type="submit" disabled={busy || !input.trim()} aria-label={t.send}
              className="px-4 bg-cream text-ink disabled:opacity-40 hover:bg-wine hover:text-cream transition-colors">
              <ArrowUp className="w-4 h-4" />
            </button>
          </form>
          <p className="px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] font-mono text-[9px] tracking-wide text-cream/60 border-t border-cream/10">{t.note}</p>
        </m.section>
      )}
    </AnimatePresence>
  );
}
