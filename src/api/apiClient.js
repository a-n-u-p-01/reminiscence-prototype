import axios from 'axios';
import { getItem } from '../context/AuthContext';



const apiClient = axios.create({
  baseURL: 'https://reminiscence-spring-boot.onrender.com/api/v1', // Your exact network IP
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  },
});

// Interceptor injects the perfect cookie token on-the-fly
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;