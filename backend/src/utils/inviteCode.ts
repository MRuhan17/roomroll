import { randomBytes } from 'crypto';

const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateInviteCode = (length = 6): string => {
    const alphabetLength = INVITE_ALPHABET.length;
    const maxByte = 256 - (256 % alphabetLength);
    let code = '';
    while (code.length < length) {
        const bytes = randomBytes(length);
        for (let i = 0; i < bytes.length && code.length < length; i += 1) {
            const byte = bytes[i];
            if (byte >= maxByte) {
                continue;
            }
            const index = byte % alphabetLength;
            code += INVITE_ALPHABET[index];
        }
    }
    return code;
};
