import axios from 'axios';

// API Gateway Ingress URL
const API_BASE_URL = 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all requests automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('pulsefit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle 401 Unauthorized globally if token expired
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && !error.config.url.includes('/api/auth/login')) {
      console.warn('Unauthorized request - session may be expired');
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  login: (username, password) => apiClient.post('/api/auth/login', { username, password }),
  register: (userData) => apiClient.post('/api/auth/register', userData),
  validate: () => apiClient.get('/api/auth/validate'),
  getUsers: () => apiClient.get('/api/auth/users'),
  socialLogin: (data) => apiClient.post('/api/auth/social-login', data),
  resetPassword: (identifier, newPassword) => apiClient.post('/api/auth/reset-password', { identifier, newPassword })
};

// Member Endpoints
export const memberApi = {
  getAll: () => apiClient.get('/api/members'),
  getById: (id) => apiClient.get(`/api/members/${id}`),
  create: (data) => apiClient.post('/api/members', data),
  update: (id, data) => apiClient.put(`/api/members/${id}`, data),
  deactivate: (id) => apiClient.delete(`/api/members/${id}`),
  checkStatus: (id) => apiClient.get(`/api/members/${id}/status`)
};

// Subscription Endpoints
export const subscriptionApi = {
  getAll: () => apiClient.get('/api/subscriptions'),
  getById: (id) => apiClient.get(`/api/subscriptions/${id}`),
  getByMember: (memberId) => apiClient.get(`/api/subscriptions/member/${memberId}`),
  getActiveForMember: (memberId) => apiClient.get(`/api/subscriptions/member/${memberId}/active`),
  create: (data) => apiClient.post('/api/subscriptions', data),
  renew: (id, data) => apiClient.post(`/api/subscriptions/${id}/renew`, data)
};

// Attendance & Turnstile Endpoints
export const attendanceApi = {
  checkIn: (data) => apiClient.post('/api/attendance/check-in', data),
  checkOut: (data) => apiClient.post('/api/attendance/check-out', data),
  getRecent: () => apiClient.get('/api/attendance/recent'),
  getByMember: (memberId) => apiClient.get(`/api/attendance/member/${memberId}`),
  getDailyFacility: (facilityId, date) => apiClient.get(`/api/attendance/facility/${facilityId}${date ? `?date=${date}` : ''}`)
};

// AI & Innovative Systems Endpoints
export const aiApi = {
  // Attendance & Anti-Fraud AI
  tailgateCheck: (data) => apiClient.post('/api/attendance/ai/tailgate-check', data),
  getFraudAlerts: () => apiClient.get('/api/attendance/ai/fraud-alerts'),
  getOccupancyHeatmap: () => apiClient.get('/api/attendance/ai/occupancy-heatmap'),
  getFacilityForecast: (facilityId) => apiClient.get(`/api/attendance/ai/facility-forecast/${facilityId}`),

  // Member Retention & Habit AI
  getMemberRetention: (memberId) => apiClient.get(`/api/members/ai/retention/${memberId}`),
  getChurnReport: () => apiClient.get('/api/members/ai/churn-report'),

  // Subscription & Grace Period AI
  grantCourtesyPass: (subscriptionId) => apiClient.post(`/api/subscriptions/ai/grant-courtesy-pass/${subscriptionId}`),
  optimizePlan: (memberId) => apiClient.get(`/api/subscriptions/ai/optimize/${memberId}`)
};
