import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const is401 = error.response?.status === 401;
    const isAuthMe = error.config?.url?.includes('/auth/me');
    const isOnLoginPage = window.location.pathname === '/login';

    if (is401 && !isAuthMe && !isOnLoginPage) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;