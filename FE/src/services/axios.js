import axios from 'axios';

const api = axios.create({
  baseURL: 'https://generator-ana-acrylic-billing.trycloudflare.com/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

export default api;
