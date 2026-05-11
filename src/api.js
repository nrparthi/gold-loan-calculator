import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 15000,
});

// Derive a human-readable message from any axios error
export const getErrorMessage = (err) => {
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout'))
    return 'Request timed out. Please try again.';
  if (!err.response)
    return 'Network error. Check your connection.';
  if (err.response.status === 401)
    return 'Session expired. Please login again.';
  if (err.response.status === 403)
    return 'You do not have permission to perform this action.';
  if (err.response.status === 404)
    return 'Resource not found.';
  if (err.response.status === 429)
    return 'Too many requests. Please wait a moment and try again.';
  if (err.response.status >= 500)
    return 'Server error. Please try again in a moment.';
  return err.response?.data?.error || err.message || 'Something went wrong.';
};

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 → fire auth:logout event so App.jsx can clear session
    if (err.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(err);
  }
);

export default api;
