import api from './axiosInstance';

// ─── PROJECT BOARD ────────────────────────────────────────────────────────────
// Backend: GET /api/projects → student gets open projects in their domain (v_project_board view)
export const getProjectBoard = () => api.get('/projects');

// Backend: POST /api/applications (body: project_id, message) — student only
// NOTE: backend reads project_id from req.body NOT req.query
export const applyToProject = (project_id, data) =>
  api.post('/applications', { project_id, ...data });

// ─── MY PROJECTS ─────────────────────────────────────────────────────────────
// Backend: GET /api/projects → same endpoint, student gets their domain projects
export const getMyProjects = () => api.get('/projects', { params: { status: 'in_progress' } });

// Backend: GET /api/projects/:id → returns project + tasks array
export const getProject = (id) => api.get(`/projects/${id}`);

// ─── TASKS ───────────────────────────────────────────────────────────────────
// Backend: GET /api/tasks?project_id= → student sees only their assigned tasks
export const getProjectTasks = (project_id) => api.get('/tasks', { params: { project_id } });

// Backend: PUT /api/tasks/:id → student can only set: in_progress or in_review
export const updateTaskStatus = (id, status) => api.put(`/tasks/${id}`, { status });

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
// Backend: GET /api/applications → student sees own applications (no project_id needed)
export const getMyApplications = () => api.get('/applications');

// Backend: PATCH /api/applications/:id → student can only set status: 'withdrawn'
export const withdrawApplication = (id) => api.patch(`/applications/${id}`, { status: 'withdrawn' });

// ─── EARNINGS / PAYMENTS ─────────────────────────────────────────────────────
// Backend: GET /api/payments → student sees payments where recipient_id = self
export const getEarnings = (params) => api.get('/payments', { params });

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────
// Backend: GET /api/certificates → student sees own certificates
export const getCertificates = () => api.get('/certificates');

// Backend: GET /api/certificates/:id
export const getCertificate = (id) => api.get(`/certificates/${id}`);

// ─── RATINGS ─────────────────────────────────────────────────────────────────
// Backend: GET /api/ratings → student sees own ratings
export const getMyRatings = () => api.get('/ratings');

// ─── PROFILE ─────────────────────────────────────────────────────────────────
// Backend: GET /api/auth/me
export const getProfile = () => api.get('/auth/me');

// Backend: PUT /api/users/:id → updates user + student sub-table
export const updateProfile = (data) => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.put(`/users/${id}`, data);
};

// ─── SETTINGS ────────────────────────────────────────────────────────────────
// Backend: GET /api/users/:id → returns user with student sub-object
export const getSettings = () => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.get(`/users/${id}`);
};

// Backend: PUT /api/users/:id → updates cv_url, portfolio_url, wilaya, university etc.
export const updateSettings = (data) => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.put(`/users/${id}`, data);
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
// Backend: GET /api/notifications?read=
export const getNotifications = (params) => api.get('/notifications', { params });

// Backend: PATCH /api/notifications/:id/read
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

// Backend: PATCH /api/notifications/read-all
export const markAllRead = () => api.patch('/notifications/read-all');

// Backend: DELETE /api/notifications/:id
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ─── REFERRALS ───────────────────────────────────────────────────────────────
// Backend: GET /api/referrals → student sees own referrals
export const getMyReferrals = () => api.get('/referrals');

// Backend: POST /api/referrals → body: { client_contact, bonus_amount }
export const createReferral = (data) => api.post('/referrals', data);

// ─── INTERVIEWS ──────────────────────────────────────────────────────────────
// Backend: GET /api/interviews → student sees own interviews
export const getMyInterviews = () => api.get('/interviews');

// Backend: GET /api/interviews/:id
export const getInterview = (id) => api.get(`/interviews/${id}`);

// ─── MESSAGES ────────────────────────────────────────────────────────────────
// REST fallback — prefer useChat hook (WebSocket) for sending messages

// GET /api/messages/conversations → list all threads + last message + unread count
export const getConversations = () => api.get('/messages/conversations');
export const getMyTasks = () => api.get('/tasks/mine');
export const changePassword = (data) => api.put('/auth/change-password', data);


// GET /api/messages/conversations/:id?limit=50&before= → paginated history
export const getMessages = (id, params) => api.get(`/messages/conversations/${id}`, { params });
export const getProjectTeam = (project_id) =>
  api.get(`/projects/${project_id}/team`);

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