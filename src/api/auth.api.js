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