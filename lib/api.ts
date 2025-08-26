import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/constants';
import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'https://bahifinal.pythonanywhere.com/api/auth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Add access token to request
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get(ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh access token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = Cookies.get(REFRESH_TOKEN);
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/token/refresh/`, { refresh: refreshToken });
          const newAccessToken = data.access;
          Cookies.set(ACCESS_TOKEN, newAccessToken, { sameSite: 'Strict' });

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          Cookies.remove(ACCESS_TOKEN);
          Cookies.remove(REFRESH_TOKEN);
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
