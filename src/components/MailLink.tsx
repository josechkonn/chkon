import type { AnchorHTMLAttributes, SyntheticEvent } from 'react';

// El correo no aparece completo ni en el código ni en la página hasta que alguien va a usarlo.
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
