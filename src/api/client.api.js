import api from './axiosInstance';

// ─── PROJECTS ────────────────────────────────────────────────────────────────
// Backend: GET /api/projects → client sees only own projects (filtered by client_id in backend)
export const getClientProjects = (params) => api.get('/projects', { params });

// Backend: GET /api/projects/:id → returns project + tasks array
export const getClientProject = (id) => api.get(`/projects/${id}`);

// Backend: POST /api/projects → client only
// Body: { title, service_type, description, team_size }
// service_type must match: 'web_dev' | 'mobile_dev' | 'ui_ux_design' | 'video_editing'
export const requestProject = (data) => api.post('/projects', data);

// ─── PAYMENTS (invoices) ─────────────────────────────────────────────────────
// Backend: GET /api/payments?project_id=&status=
// Client role: backend returns all payments for their projects
export const getClientInvoices = (params) => api.get('/payments', { params });

// Backend: PATCH /api/payments/:id → admin only in backend
// Client triggers release through admin — for now use this to signal intent
export const payInvoice = (id, data) => api.patch(`/payments/${id}`, data);

// Backend: GET /api/payments/breakdown/:project_id
export const getPaymentBreakdown = (project_id) =>
    api.get(`/payments/breakdown/${project_id}`);

// ─── TASKS ───────────────────────────────────────────────────────────────────
// Backend: GET /api/tasks?project_id= → client can view task progress
export const getProjectTasks = (project_id) =>
    api.get('/tasks', { params: { project_id } });

// ─── INTERVIEWS ──────────────────────────────────────────────────────────────
// Backend: GET /api/interviews → client role returns [] (no interviews for client)
export const getInterviews = () => api.get('/interviews');

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
// Backend: GET /api/notifications?read=
export const getNotifications = (params) => api.get('/notifications', { params });

// Backend: PATCH /api/notifications/:id/read
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

// Backend: PATCH /api/notifications/read-all
export const markAllRead = () => api.patch('/notifications/read-all');

// ─── USERS ───────────────────────────────────────────────────────────────────
// Backend: GET /api/auth/me
export const getMe = () => api.get('/auth/me');

// Backend: PUT /api/users/:id → update company, city, phone, name
export const updateProfile = (data) => {
    const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
    return api.put(`/users/${id}`, data);
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const changePassword = (data) => api.put('/auth/change-password', data);

// ─── MESSAGES ────────────────────────────────────────────────────────────────
// REST fallback — prefer useChat hook (WebSocket) for sending messages

// GET /api/messages/conversations → list all threads + last message + unread count
export const getConversations = () => api.get('/messages/conversations');

// GET /api/messages/conversations/:id?limit=50&before= → paginated history
export const getMessages = (id, params) => api.get(`/messages/conversations/${id}`, { params });

// POST /api/messages/conversations → get-or-create thread
// Body: { other_user_id, project_id? }
export const startConversation = (other_user_id, project_id) =>
    api.post('/messages/conversations', { other_user_id, project_id });

// POST /api/messages/conversations/:id → REST send (fallback when socket is down)
export const sendMessage = (id, content) =>
    api.post(`/messages/conversations/${id}`, { content });

// PATCH /api/messages/conversations/:id/read → mark all as read
export const markConversationRead = (id) =>
    api.patch(`/messages/conversations/${id}/read`);


export const sendClientMsg = sendMessage; // alias for client pages