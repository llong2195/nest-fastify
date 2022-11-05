import { v2 } from 'cloudinary';
import { CLOUD_API_KEY, CLOUD_API_SECRET, CLOUD_NAME } from '@src/config';

v2.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUD_API_KEY,
  api_secret: CLOUD_API_SECRET,
});

export { v2 as cloudinary };
