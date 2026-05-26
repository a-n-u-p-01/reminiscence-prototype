import axios from 'axios';

// Foolproof cookie extractor for background network calls
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return decodeURIComponent(parts.pop().split(';').shift());
  }
  return '';
};

const apiClient = axios.create({
  baseURL: 'https://reminiscence-spring-boot.onrender.com/api/v1', // Your exact network IP
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  },
});

// Interceptor injects the perfect cookie token on-the-fly
apiClient.interceptors.request.use(
  (config) => {
    const token = getCookie('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;