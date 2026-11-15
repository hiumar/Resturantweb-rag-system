'use client';

import {MotionConfig, motion} from 'framer-motion';
import {ThemeProvider} from 'next-themes';

export function StorefrontProviders({children}) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeProvider>
  );
}

export function Reveal({children, className, delay = 0}) {
  return (
    <motion.div className={className} initial={{opacity: 0, y: 15}} whileInView={{opacity: 1, y: 0}}
      viewport={{once: true, amount: 0.12}} transition={{duration: 0.45, delay}}>
      {children}
    </motion.div>
  );
}
