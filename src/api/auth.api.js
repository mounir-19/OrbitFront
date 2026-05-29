import api from './axiosInstance';

// Backend: POST /api/auth/register
// Body: { first_name, last_name, email, phone, password, role, domain,
//         wilaya, university, cv_url, portfolio_url,   ← student fields
//         specialty, bio,                              ← expert fields
//         company, city }                              ← client fields
// Returns: { token, user }
// NOTE: new accounts get status='pending' — need interview to become 'active'
export const register = (data) => api.post('/auth/register', data);

// Backend: POST /api/auth/login
// Body: { email, password }
// Returns: { token, user } — user.status='suspended' returns 403
export const login = (data) => api.post('/auth/login', data);

// Backend: GET /api/auth/me → requires token
// Returns: { id, last_name, first_name, email, phone, role, status, domain, created_at }
export const getMe = () => api.get('/auth/me');

export const changePassword = (data) => api.put('/auth/change-password', data);

// Backend: POST /api/auth/forgot-password
// Body: { email }
// Returns: { message } — always succeeds to prevent email enumeration
export const forgotPassword = (data) => api.post('/auth/forgot-password', data);

// Backend: POST /api/auth/verify-otp
// Body: { email, otp }
// Returns: { message, user_id }
export const verifyOtp = (data) => api.post('/auth/verify-otp', data);

// Backend: POST /api/auth/reset-password
// Body: { email, otp, new_password }
// Returns: { message }
export const resetPassword = (data) => api.post('/auth/reset-password', data);