/** Wraps `index + delta` into the `[0, length)` range, looping around both ends. */
export const wrapIndex = (index: number, delta: number, length: number): number => {
    return (index + delta + length) % length;
};
