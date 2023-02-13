import cloudinary, { UploadApiResponse, v2 } from 'cloudinary';
import { Readable, Stream } from 'stream';

import { CLOUD_API_KEY, CLOUD_API_SECRET, CLOUD_NAME } from '@src/configs';

v2.config({
    cloud_name: CLOUD_NAME,
    api_key: CLOUD_API_KEY,
    api_secret: CLOUD_API_SECRET,
});

export { v2 as cloudinary };

/**
 * MultiStream class helps convert buffers to a streams
 * @source https://github.com/gagle/node-streamifier
 */
class MultiStream extends Readable {
    _object: Buffer | string | undefined;
    constructor(object: Buffer | string, options: any = {}) {
        super();
        this._object = object;
        Stream.Readable.call(this, {
            highWaterMark: options.highWaterMark,
            encoding: options.encoding,
        });
    }
    /**
     * _read() is a function that pushes the object to the stream and then sets the object to
     * undefined.
     */
    _read() {
        this.push(this._object);
        this._object = undefined;
    }
}

/**
 *
 * @param object - Object to convert
 * @param options - Configuration (encoding and highWaterMark)
 */
const createReadStream = (object: Buffer | string, options?: any) => new MultiStream(object, options);

export class CloudinaryService {
    constructor() {
        cloudinary.v2.config({
            cloud_name: CLOUD_NAME,
            api_key: CLOUD_API_KEY,
            api_secret: CLOUD_API_SECRET,
        });
    }

    /**
     * It takes a buffer or string and uploads it to Cloudinary
     * @param {Buffer | string} buffer - This is the file that you want to upload. It can be a Buffer
     * or a string.
     * @param {string} folder - The folder in which the image will be stored.
     * @returns A promise that resolves to an UploadApiResponse object.
     */
    upload(buffer: Buffer | string, folder: string): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream({ folder }, (error, result) => {
                if (result) return resolve(result);
                reject(error);
            });
            createReadStream(buffer).pipe(uploadStream);
        });
    }
}
