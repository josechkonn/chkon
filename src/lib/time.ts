const ZONE = 'America/Caracas';

export function caracasDateTime() {
  const now = new Date();
  return {
    date: now.toLocaleDateString('es-VE', { timeZone: ZONE, day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: now.toLocaleTimeString('es-VE', { timeZone: ZONE, hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}
