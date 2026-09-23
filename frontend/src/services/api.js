import axios from 'axios';

const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('onrender.com')) {
    return envUrl;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://gdairy-1zu5.vercel.app/api';
  }
  const hostname = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${hostname}:17202/api`;
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000, // 12 second fast timeout for responsive network calls
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Token Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gdairy_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for Unauthorized and Cold-Start Retry handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once immediately on gateway timeout (502/503/504)
    if (
      error.response &&
      (error.response.status === 502 || error.response.status === 503 || error.response.status === 504) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.warn('[API] Server connection retry triggered...');
      return api(originalRequest);
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('gdairy_token');
      localStorage.removeItem('gdairy_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
