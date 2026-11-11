import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { Loader } from '@/components/Loader';
import { Hero, Register } from '@/components/Top';
import { isLite, prefersReducedMotion } from '@/lib/device';
import { useGithubRepos } from '@/lib/github';
import { useSite } from '@/lib/i18n';

// Si se publica una versión nueva con la página abierta, el fragmento viejo ya no existe: se recarga una sola vez.
const loadBelow = () =>
  import('@/components/Below').catch(() => {
    if (!sessionStorage.getItem('reloaded-after-deploy')) {
      sessionStorage.setItem('reloaded-after-deploy', '1');
      location.reload();
    }
    return new Promise<never>(() => {});
  });

const BelowMain = lazy(() => loadBelow().then((module) => ({ default: module.BelowMain })));
const BelowFooter = lazy(() => loadBelow().then((module) => ({ default: module.BelowFooter })));

export default function App() {
  const [loading, setLoading] = useState(() => !isLite() && !prefersReducedMotion());
  const [sectionsReady, setSectionsReady] = useState(false);
  const finish = useCallback(() => setLoading(false), []);
  const markReady = useCallback(() => setSectionsReady(true), []);
  const github = useGithubRepos();
  const site = useSite();

  useEffect(() => {
    history.scrollRestoration = 'manual';
  }, []);

  return (
    <>
      <a href="#contenido" className="skip-link">{site.ui.skip}</a>
      {loading && <Loader onDone={finish} />}
      <Register repoCount={github.repos.length} sectionsReady={sectionsReady} />
      <main id="contenido">
        <Hero repoCount={github.repos.length} />
        <Suspense fallback={null}>
          <BelowMain github={github} onReady={markReady} />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <BelowFooter />
      </Suspense>
    </>
  );
}
