import type { Variants } from 'motion/react';

export const rightLeftSlideVariants = {
    hidden: {
        x: '100%',
    },
    visible: {
        x: '0',
    },
    exit: {
        x: '100%',
    },
};

export const leftRightSlideVariants = {
    hidden: {
        x: '-100%',
    },
    visible: {
        x: '0',
    },
    exit: {
        x: '-100%',
    },
};

export const topDownToggle = {
    hidden: {
        y: -30,
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
    },
    exit: {
        y: -30,
        opacity: 0,
    },
};

export const downUpToggle = {
    hidden: {
        y: 30,
        opacity: 0,
    },
    visible: {
        y: 0,
        opacity: 1,
    },
    exit: {
        y: 30,
        opacity: 0,
    },
};

export const leftRightToggle = {
    hidden: {
        x: -10,
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
    },
    exit: {
        x: -10,
        opacity: 0,
    },
};

export const rightLeftToggle = {
    hidden: {
        x: 10,
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
    },
    exit: {
        x: 10,
        opacity: 0,
    },
};

export const fadeVariants = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
    },
    exit: {
        opacity: 0,
    },
};

export const fadeVariantsDelayedExit = {
    hidden: {
        opacity: 0,
    },
    visible: {
        opacity: 1,
    },
    exit: {
        opacity: 0,
        transition: {
            delay: 0.2,
        },
    },
};

export const staggerChildrenVariants = {
    visible: {
        transition: {
            staggerChildren: 0.2,
        },
    },
    exit: {
        transition: {
            staggerChildren: 0.2,
            staggerDirection: -1,
        },
    },
};

export const staggerChildrenVariantsNoExitStagger: Variants = {
    visible: {
        transition: {
            staggerChildren: 0.2,
        },
    },
    exit: {
        opacity: 0,
    },
};

export const rightLeftBounce = {
    hidden: {
        x: 100,
        opacity: 0,
    },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.6,
            type: 'spring',
            bounce: 0.4,
        },
    },
    exit: {
        x: 100,
        opacity: 0,
        transition: {
            duration: 0.6,
            type: 'spring',
            bounce: 0.4,
        },
    },
};
