import type { AnchorHTMLAttributes, SyntheticEvent } from 'react';

// El correo y el teléfono no aparecen completos ni en el código ni en la página hasta que alguien va a usarlo.
const REVERSED = ['moc.liamg', '5002.g.nocahc.a.esoj'];
const address = () => REVERSED.map((part) => [...part].reverse().join('')).reverse().join('@');

export function MailLink({ children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const arm = (event: SyntheticEvent<HTMLAnchorElement>) => {
    event.currentTarget.href = `mailto:${address()}`;
  };
  return (
    <a {...props} href="#caja" onPointerEnter={arm} onPointerDown={arm} onFocus={arm} onClick={arm}>
      {children}
    </a>
  );
}

const PHONE_REVERSED = '364017361485';

/** Abre un chat de WhatsApp con el mensaje inicial ya escrito. */
export function WhatsAppLink({ message, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { message: string }) {
  const arm = (event: SyntheticEvent<HTMLAnchorElement>) => {
    const phone = [...PHONE_REVERSED].reverse().join('');
    event.currentTarget.href = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };
  return (
    <a {...props} href="#caja" target="_blank" rel="noopener noreferrer" onPointerEnter={arm} onPointerDown={arm} onFocus={arm} onClick={arm}>
      {children}
    </a>
  );
}
