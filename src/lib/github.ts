import { useEffect, useState } from 'react';
import snapshot from '@/data/github-snapshot.json';

export const GITHUB_USER = 'josechkonn';
const CACHE_KEY = 'github-repos-v1';
const CACHE_MS = 15 * 60 * 1000; // La API sin token permite 60 peticiones por hora y por visitante.

export type Repo = {
  name: string; description: string | null; url: string; homepage: string | null; language: string | null;
  stars: number; pushedAt: string; fork: boolean; archived: boolean;
};
export type GithubData = { repos: Repo[]; fetchedAt: string; live: boolean };

type ApiRepo = {
  name: string; description: string | null; html_url: string; homepage: string | null; language: string | null;
  stargazers_count: number; pushed_at: string; fork: boolean; archived: boolean;
};

const fromSnapshot = (): GithubData => ({ repos: snapshot.repos, fetchedAt: snapshot.fetchedAt, live: false });

const MAX_REPOS = 100;
const isOptionalText = (value: unknown) => value === null || (typeof value === 'string' && value.length <= 500);

/** Todo lo que llega de la red o de localStorage se valida antes de llegar a la página. */
function isRepo(value: unknown): value is Repo {
  const r = value as Repo;
  return (
    typeof r === 'object' && r !== null &&
    typeof r.name === 'string' && /^[\w.-]{1,100}$/.test(r.name) &&
    r.url === `https://github.com/${GITHUB_USER}/${r.name}` &&
    isOptionalText(r.description) && isOptionalText(r.homepage) && isOptionalText(r.language) &&
    Number.isSafeInteger(r.stars) && r.stars >= 0 &&
    typeof r.pushedAt === 'string' && !Number.isNaN(Date.parse(r.pushedAt)) &&
    typeof r.fork === 'boolean' && typeof r.archived === 'boolean'
  );
}

function readCache(): GithubData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GithubData;
    const valid = Array.isArray(parsed.repos) && parsed.repos.every(isRepo) && !Number.isNaN(Date.parse(parsed.fetchedAt));
    return valid ? { repos: parsed.repos.slice(0, MAX_REPOS), fetchedAt: parsed.fetchedAt, live: parsed.live === true } : null;
  } catch {
    return null;
  }
}

async function fetchRepos(signal: AbortSignal): Promise<GithubData> {
  const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=pushed`, {
    signal,
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    redirect: 'error',
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const list = (await res.json()) as ApiRepo[];
  return {
    live: true,
    fetchedAt: new Date().toISOString(),
    repos: list.map((r) => ({
      name: r.name, description: r.description, url: r.html_url, homepage: r.homepage, language: r.language,
      stars: r.stargazers_count, pushedAt: r.pushed_at, fork: r.fork, archived: r.archived,
    })).filter(isRepo).slice(0, MAX_REPOS),
  };
}

/** Muestra de inmediato lo último conocido y lo reemplaza con los datos en vivo de GitHub. */
export function useGithubRepos(): GithubData {
  const [data, setData] = useState<GithubData>(() => readCache() ?? fromSnapshot());

  useEffect(() => {
    const cached = readCache();
    if (cached && Date.now() - Date.parse(cached.fetchedAt) < CACHE_MS) return;

    const controller = new AbortController();
    fetchRepos(controller.signal)
      .then((fresh) => {
        setData(fresh);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh));
        } catch {
          // Sin localStorage se sigue funcionando, solo que sin caché.
        }
      })
      .catch(() => {
        // Con límite agotado o sin red se queda lo último conocido.
      });
    return () => controller.abort();
  }, []);

  return data;
}

const formatters = { es: new Intl.RelativeTimeFormat('es', { numeric: 'auto' }), en: new Intl.RelativeTimeFormat('en', { numeric: 'auto' }) };
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60],
];

export function timeAgo(iso: string, lang: 'es' | 'en' = 'es'): string {
  const seconds = (Date.parse(iso) - Date.now()) / 1000;
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return formatters[lang].format(Math.round(seconds / size), unit);
  }
  return lang === 'es' ? 'ahora mismo' : 'just now';
}

/** `homepage` es texto libre en GitHub: solo se enlaza si es https. */
export function safeUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password ? parsed.href : null;
  } catch {
    return null;
  }
}
