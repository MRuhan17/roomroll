const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateInviteCode = (length = 6): string => {
    let code = '';
    for (let i = 0; i < length; i += 1) {
        const index = Math.floor(Math.random() * INVITE_ALPHABET.length);
        code += INVITE_ALPHABET[index];
    }
    return code;
};
