// src/config/constants.ts
export const API_URL = import.meta.env.MODE === 'production' 
  ? import.meta.env.VITE_API_URL || 'https://bonesbackend-production.up.railway.app/api'
  : 'http://localhost:4000/api';

console.log('🔧 [Config] API_URL:', API_URL, '| Environment:', import.meta.env.MODE);