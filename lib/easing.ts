// Ease-out-quart cubic bezier
export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1]

// Transition presets
export const FAST = { duration: 0.18, ease: EASE_OUT }      // frequent interactions
export const MID  = { duration: 0.35, ease: EASE_OUT }      // occasional transitions
export const SLOW = { duration: 0.55, ease: EASE_OUT }      // scene choreography

// Spring preset for drag interactions
export const SPRING = { type: 'spring' as const, stiffness: 280, damping: 28 }
