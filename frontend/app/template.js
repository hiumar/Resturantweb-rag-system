'use client';

import {motion, useReducedMotion} from 'framer-motion';

export default function Template({children}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div initial={reduceMotion ? false : {opacity: 0.75}} animate={{opacity: 1}} transition={{duration: 0.23}}>
      {children}
    </motion.div>
  );
}
