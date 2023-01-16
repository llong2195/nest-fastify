export function randomString(length = 10): string {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const lastIndex = characters.length - 1;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * lastIndex));
    }
    return result;
}

export function getFullDate(): string {
    const now = new Date();
    return `${now.getFullYear()}_${now.getMonth()}_${now.getDay()}_${now.getHours()}_${now.getMinutes()}_${now.getSeconds()}`;
}

export const base64Encode = (str: string) => {
    const b = Buffer.from(str);
    return b.toString('base64');
};

export const base64Decode = (str: string) => {
    const b = Buffer.from(str, 'base64');
    return b.toString();
};
