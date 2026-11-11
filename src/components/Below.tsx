import { useEffect, type ReactNode } from 'react';
import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';
import { Contact, Credentials, Manifesto, StackWall, Stripes, Value } from '@/components/Sections';
import { Projects } from '@/components/Projects';
import type { GithubData } from '@/lib/github';

const Motion = ({ children }: { children: ReactNode }) => (
  <LazyMotion features={domAnimation} strict>
    <MotionConfig reducedMotion="user">{children}</MotionConfig>
  </LazyMotion>
);

export function BelowMain({ github, onReady }: { github: GithubData; onReady: () => void }) {
  useEffect(onReady, [onReady]);
  return (
    <Motion>
      <Value />
      <Stripes from="ink" to="wine" />
      <Projects data={github} />
      <Stripes from="wine" to="ink" />
      <Manifesto />
      <Stripes from="ink" to="wine" />
      <Credentials />
      <Stripes from="wine" to="ink" />
      <StackWall />
      <Stripes from="ink" to="wine" />
    </Motion>
  );
}

export function BelowFooter() {
  return (
    <Motion>
      <Contact />
    </Motion>
  );
}
