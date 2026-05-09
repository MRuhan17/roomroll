import { randomBytes } from 'crypto';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateInviteCode = (length = 6): string => {
    const bytes = randomBytes(length);
    let code = '';
    for (let i = 0; i < length; i += 1) {
        const index = bytes[i] % INVITE_ALPHABET.length;
        code += INVITE_ALPHABET[index];
    }
    return code;
};
