// src/config/constants.ts
export const API_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || 'https://bonesbackend-production.up.railway.app/api'
  : 'http://localhost:4000/api';

console.log('🔧 [Config] API_URL:', API_URL);
console.log('🔧 [Config] Environment PROD:', import.meta.env.PROD);
console.log('🔧 [Config] Environment MODE:', import.meta.env.MODE);
console.log('🔧 [Config] VITE_API_URL:', import.meta.env.VITE_API_URL);