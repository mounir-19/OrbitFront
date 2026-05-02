import api from './axiosInstance';

// ─── PROJECTS ────────────────────────────────────────────────────────────────
// Backend: GET /api/projects → admin/expert get all projects (v_project_board view)
export const getProjects = (params) => api.get('/projects', { params });

// Backend: GET /api/projects/:id → returns project + tasks array
export const getProject = (id) => api.get(`/projects/${id}`);

// Backend: PUT /api/projects/:id → expert can update status, total_price, expert_notes, dates
// Allowed fields: title, description, status, total_price, team_size, expert_notes, started_at, delivered_at
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);

// ─── APPLICATIONS (team selection) ───────────────────────────────────────────
// Backend: GET /api/applications?project_id= → expert sees applicants for a project
// Returns: student name, email, global_rating, consecutive_projects
export const getApplications = (project_id, params) =>
  api.get('/applications', { params: { project_id, ...params } });

// Backend: PATCH /api/applications/:id → body: { status: 'selected'|'withdrawn'|'pending' }
// When status='selected': adds student to project_group, increments consecutive_projects, sends notification
export const updateApplication = (id, status) =>
  api.patch(`/applications/${id}`, { status });

// ─── TASKS ───────────────────────────────────────────────────────────────────
// Backend: GET /api/tasks?project_id= → expert sees all tasks for project
export const getProjectTasks = (project_id) => api.get('/tasks', { params: { project_id } });

// Backend: GET /api/tasks/:id
export const getTask = (id) => api.get(`/tasks/${id}`);

// Backend: POST /api/tasks?project_id= → body: { title, description, weight_pct, commit_freq, due_date, domain_tag, student_id, ai_proposed }
export const createTask = (project_id, data) =>
  api.post('/tasks', data, { params: { project_id } });

// Backend: POST /api/tasks/bulk?project_id= → body: { tasks: [...] } — weights must sum to 100
// Deletes existing ai_proposed tasks first, then inserts new ones
export const createTasksBulk = (project_id, tasks) =>
  api.post('/tasks/bulk', { tasks }, { params: { project_id } });

// Backend: PUT /api/tasks/:id → expert can update any field
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);

// Backend: DELETE /api/tasks/:id
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// ─── AI TASK BREAKDOWN ────────────────────────────────────────────────────────
// Backend: POST /api/ai/task-breakdown
// Body: { project_id, scope_summary, team_size, deadline, domain }
export const runTaskBreakdown = (data) => api.post('/ai/task-breakdown', data);

// Backend: POST /api/ai/task-breakdown/approve?project_id=
// Body: { tasks: [{ title, description, weight_pct, domain_tag, commit_freq }] }
export const approveTaskBreakdown = (project_id, tasks) =>
  api.post('/ai/task-breakdown/approve', { tasks }, { params: { project_id } });

// ─── AI TEAM MATCHING ─────────────────────────────────────────────────────────
// Backend: POST /api/ai/team-matching → body: { project_id }
export const runTeamMatching = (project_id) =>
  api.post('/ai/team-matching', { project_id });

// Backend: POST /api/ai/team-matching/approve?project_id=
// Body: { selected_student_ids: [uuid, ...] }
export const approveTeam = (project_id, selected_student_ids) =>
  api.post('/ai/team-matching/approve', { selected_student_ids }, { params: { project_id } });

// ─── RATINGS ─────────────────────────────────────────────────────────────────
// Backend: GET /api/ratings?student_id= or ?project_id=
export const getRatings = (params) => api.get('/ratings', { params });

// Backend: POST /api/ratings → expert only
// Body: { student_id, project_id, quality, deadline, communication, collaboration, technical, comment }
export const rateStudent = (data) => api.post('/ratings', data);

// ─── INTERVIEWS ──────────────────────────────────────────────────────────────
// Backend: GET /api/interviews → expert sees own scheduled interviews
export const getInterviews = () => api.get('/interviews');

// Backend: GET /api/interviews/:id
export const getInterview = (id) => api.get(`/interviews/${id}`);

// Backend: POST /api/interviews → expert only
// Body: { student_id, scheduled_at, meeting_link }
// Auto-creates Jitsi link if meeting_link not provided (check your ai.js)
export const scheduleInterview = (data) => api.post('/interviews', data);

// Backend: PUT /api/interviews/:id
// Body: { scheduled_at, meeting_link, status, result: 'admitted'|'rejected', comment }
// result='admitted' → sets student status to 'active'
export const updateInterview = (id, data) => api.put(`/interviews/${id}`, data);

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────
// Backend: GET /api/certificates?student_id=
export const getCertificates = (params) => api.get('/certificates', { params });

// Backend: POST /api/certificates → expert/admin
// Body: { student_id, project_id, pdf_url }
// Auto-calculates duration_days from project started_at/delivered_at
export const issueCertificate = (data) => api.post('/certificates', data);

// Backend: PATCH /api/certificates/:id/pdf
export const updateCertificatePdf = (id, pdf_url) =>
  api.patch(`/certificates/${id}/pdf`, { pdf_url });

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
// Backend: GET /api/payments → expert sees own payments (recipient_id = self)
export const getMyEarnings = (params) => api.get('/payments', { params });

// Backend: GET /api/payments/breakdown/:project_id → v_payment_breakdown view
export const getPaymentBreakdown = (project_id) =>
  api.get(`/payments/breakdown/${project_id}`);

// ─── USERS ───────────────────────────────────────────────────────────────────
// Backend: GET /api/users/students/list?domain= → expert gets active students
export const getStudentsList = (domain) =>
  api.get('/users/students/list', { params: domain ? { domain } : {} });

// Backend: GET /api/users/:id → returns user with role sub-object
export const getUser = (id) => api.get(`/users/${id}`);

// Backend: PUT /api/users/:id → update own profile (specialty, bio, available)
export const updateProfile = (data) => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.put(`/users/${id}`, data);
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const getNotifications = (params) => api.get('/notifications', { params });
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');

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


// ─── AUTH ────────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);