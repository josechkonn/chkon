// Code 39 real: se puede leer con cualquier escáner.
// Cada carácter son 9 elementos alternos (barra, espacio, barra...), n = angosto, w = ancho.
const CODE39: Record<string, string> = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn', F: 'nnwnwwnnn',
  G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn', K: 'wnnnnnnww', L: 'nnwnnnnww',
  M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn', P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn',
  S: 'nnwnnnwwn', T: 'nnnnwnwwn', U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn', Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', '*': 'nwnnwnwnn',
};

export type Element = { width: number; bar: boolean };

const NARROW = 1;
const WIDE = 3;

/** Texto admitido por Code 39, en mayúsculas y sin acentos. */
export function barcodeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^0-9A-Z. -]/g, '-');
}

export function encode39(value: string): Element[] {
  const chars = `*${barcodeText(value)}*`.split('');
  return chars.flatMap((char, c) => {
    const elements = CODE39[char].split('').map((e, i): Element => ({ width: e === 'w' ? WIDE : NARROW, bar: i % 2 === 0 }));
    return c < chars.length - 1 ? [...elements, { width: NARROW, bar: false }] : elements;
  });
}
