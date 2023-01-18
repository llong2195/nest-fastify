export enum FileType {
    JPEG = 'image/jpeg',
    PNG = 'image/png',
}

export const FILE = {
    ALLOWED_MIME_TYPES: FileType,
    MAX_SIZE: 10 * 1000 * 1000, // 10 MB
};
