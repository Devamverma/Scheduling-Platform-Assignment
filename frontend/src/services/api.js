import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user ID interceptor to all requests
api.interceptors.request.use((config) => {
  // The backend will inject default user via middleware
  // But we can optionally add user ID if stored in localStorage
  const userId = localStorage.getItem('userId');
  if (userId) {
    config.headers['x-user-id'] = userId;
  }
  return config;
});

// Response interceptor to handle errors and extract data
api.interceptors.response.use(
  (response) => {
    console.log('[API] Raw Response:', {
      status: response.status,
      hasSuccessFlag: response.data?.success !== undefined,
      responseDataStructure: Object.keys(response.data || {}),
      hasDataField: response.data?.data !== undefined
    });
    
    // Extract data from standardized response format
    if (response.data && typeof response.data === 'object' && response.data.success !== undefined) {
      console.log('[API] Using standardized format - extracting response.data.data');
      console.log('[API] response.data.data:', response.data.data);
      // If response has { success, data }, extract the data
      const extractedData = response.data.data;
      console.log('[API] After extraction, data is:', extractedData, 'Type:', Array.isArray(extractedData) ? 'Array' : typeof extractedData);
      return { 
        ...response, 
        data: extractedData
      };
    }
    
    console.log('[API] Response does not have success flag, returning as-is');
    return response;
  },
  (error) => {
    console.error('[API Error]', error.response?.status, error.message);
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Event Types
export const eventTypesAPI = {
  getAll: () => api.get('/event-types'),
  getOne: (id) => api.get(`/event-types/${id}`),
  create: (data) => api.post('/event-types', data),
  update: (id, data) => api.put(`/event-types/${id}`, data),
  delete: (id) => api.delete(`/event-types/${id}`),
  toggle: (id) => api.patch(`/event-types/${id}/toggle`),
};

// Availability
export const availabilityAPI = {
  getSchedules: () => api.get('/availability/schedules'),
  getSchedule: (id) => api.get(`/availability/schedules/${id}`),
  createSchedule: (data) => api.post('/availability/schedules', data),
  updateSchedule: (id, data) => api.put(`/availability/schedules/${id}`, data),
  deleteSchedule: (id) => api.delete(`/availability/schedules/${id}`),
  setDefault: (id) => api.patch(`/availability/schedules/${id}/set-default`),
  updateWeeklyHours: (id, data) => api.put(`/availability/schedules/${id}/weekly-hours`, data),
  addDateOverride: (id, data) => api.post(`/availability/schedules/${id}/date-overrides`, data),
  removeDateOverride: (overrideId) => api.delete(`/availability/date-overrides/${overrideId}`),
};

// Bookings
export const bookingsAPI = {
  getAll: (params) => api.get('/bookings', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  cancel: (id, reason) => api.patch(`/bookings/${id}/cancel`, { reason }),
  confirm: (id) => api.patch(`/bookings/${id}/confirm`),
};

// Public API
export const publicAPI = {
  getUserProfile: (username) => api.get(`/public/${username}`),
  getEventType: (username, eventSlug) => api.get(`/public/${username}/${eventSlug}`),
  getSlots: (username, eventSlug, date, timezone) => 
    api.get(`/public/${username}/${eventSlug}/slots`, { params: { date, timezone } }),
  createBooking: (username, eventSlug, data) => 
    api.post(`/public/${username}/${eventSlug}/book`, data),
  getBookingConfirmation: (uid) => api.get(`/public/booking/${uid}`),
  cancelBooking: (uid, reason) => api.post(`/public/booking/${uid}/cancel`, { reason }),
  rescheduleBooking: (uid, data) => api.post(`/public/booking/${uid}/reschedule`, data),
};

// User
export const userAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.put('/users/me', data),
};

export default api;
