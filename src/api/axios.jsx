import axios from "axios";

const api = axios.create({
  baseURL: "http://16.176.175.208:5000/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const clearAuthToken = () => {
  localStorage.removeItem('token');
};

export const getAuthToken = () => localStorage.getItem('token');

export default api;