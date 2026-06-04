import api from './axiosInstance';

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export const getClientProjects = (params) => api.get('/projects', { params });
export const getClientProject = (id) => api.get(`/projects/${id}`);
export const requestProject = (data) => api.post('/projects', data);

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
// Get all invoices for this client's projects
export const getClientInvoices = (params) => api.get('/payments', { params });

// Client signals payment intent (50% or final) → admin processes
// Body: { project_id, amount, payment_type: '50_percent' | 'final' }
export const initiatePayment = (data) => api.post('/payments/client-initiate', data);

// Client marks a specific invoice as client_paid (after bank transfer / CIB)
export const payInvoice = (id, data) => api.patch(`/payments/${id}`, data);

// Admin-only: get full breakdown for a project
export const getPaymentBreakdown = (project_id) => api.get(`/payments/breakdown/${project_id}`);

// ─── TASKS ───────────────────────────────────────────────────────────────────
export const getProjectTasks = (project_id) =>
    api.get('/tasks', { params: { project_id } });

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const getNotifications = (params) => api.get('/notifications', { params });
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');

// ─── USERS ───────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me');

export const updateProfile = (data) => {
    const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
    return api.put(`/users/${id}`, data);
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const changePassword = (data) => api.put('/auth/change-password', data);

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export const getConversations = () => api.get('/messages/conversations');
export const getMessages = (id, params) => api.get(`/messages/conversations/${id}`, { params });
export const startConversation = (other_user_id, project_id) =>
    api.post('/messages/conversations', { other_user_id, project_id });
export const sendMessage = (id, content) => api.post(`/messages/conversations/${id}`, { content });
export const markConversationRead = (id) => api.patch(`/messages/conversations/${id}/read`);

export const sendClientMsg = sendMessage;