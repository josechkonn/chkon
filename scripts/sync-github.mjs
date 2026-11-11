// Guarda una copia de los repos públicos. La página la usa mientras carga
// o si GitHub limita las peticiones. Corre solo antes de cada build.
import { writeFile } from 'node:fs/promises';

const USER = 'josechkonn';
const OUT = new URL('../src/data/github-snapshot.json', import.meta.url);

try {
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, { headers });
  if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);

  const repos = (await res.json()).filter((r) => !r.private).map((r) => ({
    name: r.name,
    description: r.description,
    url: r.html_url,
    homepage: r.homepage,
    language: r.language,
    stars: r.stargazers_count,
    pushedAt: r.pushed_at,
    fork: r.fork,
    archived: r.archived,
  }));

  await writeFile(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), repos }, null, 2) + '\n');
  console.log(`Copia de GitHub actualizada: ${repos.length} repos.`);
} catch (error) {
  // Sin red o con límite agotado, el build sigue con la copia anterior.
  console.warn(`No se actualizó la copia de GitHub: ${error.message}`);
}
