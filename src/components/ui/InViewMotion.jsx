import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

/**
 * InViewMotion
 *
 * Wraps any element that has an `animate={{ ...repeat: Infinity ... }}`
 * loop (glowing text, pulsing orbs, scattered icons) and only lets that
 * loop run while the element is actually on screen. Off-screen, the
 * `animate` prop swaps to `idleAnimate` (defaults to the resting/first
 * frame), which stops Framer Motion's RAF loop for that node entirely.
 *
 * This fixes the "30+ infinite animations running below the fold" issue —
 * sections like FeaturesSection's ScatteredIcons, PricingSection's glow
 * orbs, and the various `textShadow` pulse loops all currently animate
 * continuously regardless of scroll position.
 *
 * Usage — before:
 *   <motion.span
 *     animate={{ textShadow: ['0 0 20px ...', '0 0 60px ...', '0 0 20px ...'] }}
 *     transition={{ duration: 3, repeat: Infinity }}
 *   >
 *     RECODE
 *   </motion.span>
 *
 * Usage — after:
 *   <InViewMotion
 *     as="span"
 *     animate={{ textShadow: ['0 0 20px ...', '0 0 60px ...', '0 0 20px ...'] }}
 *     idleAnimate={{ textShadow: '0 0 20px rgba(231,23,99,0.3)' }}
 *     transition={{ duration: 3, repeat: Infinity }}
 *   >
 *     RECODE
 *   </InViewMotion>
 *
 * For decorative background elements where the "idle" frame doesn't
 * matter visually (orbs, scattered icons), you can omit idleAnimate —
 * it'll just freeze on whatever frame it was on, which is invisible
 * because the element is off-screen anyway.
 */
export default function InViewMotion({
    as = 'div',
    animate,
    idleAnimate,
    transition,
    once = false,
    amount = 0,
    margin = '100px', // start animating slightly before it enters the viewport
    children,
    ...rest
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, amount, margin });

    const Component = motion[as] || motion.div;

    return (
        <Component
            ref={ref}
            animate={isInView ? animate : (idleAnimate ?? animate)}
            transition={isInView ? transition : { duration: 0 }}
            {...rest}
        >
            {children}
        </Component>
    );
}
