// src/config/constants.ts
export const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://placeholder-backend-url.railway.app/api'
  : 'http://localhost:4000/api';

console.log('🔧 [Config] API_URL:', API_URL, '| Environment:', process.env.NODE_ENV);