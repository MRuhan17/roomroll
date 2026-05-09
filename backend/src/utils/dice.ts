import { randomInt } from 'crypto';

export const rollDie = (sides: number): number => {
    return randomInt(1, sides + 1);
};
