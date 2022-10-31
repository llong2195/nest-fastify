import { v2 } from 'cloudinary';

v2.config({
  cloud_name: 'family-cloud',
  api_key: '676263785586468',
  api_secret: 'rAXbiwe170b99Bd6Yr2VrG-rLGQ',
});

export { v2 as cloudinary };
