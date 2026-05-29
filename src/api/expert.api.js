import api from './axiosInstance';

// ─── PROJECTS ────────────────────────────────────────────────────────────────
export const getProjects = (params) => api.get('/projects', { params });
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const startProject = (id) => api.patch(`/projects/${id}/start`);
export const getProjectTeam = (project_id) => api.get(`/projects/${project_id}/team`);
export const getProjectApplications = (project_id) => api.get(`/projects/${project_id}/applications`);

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
export const getApplications = (project_id, params) => {
  const queryParams = { ...params };
  if (project_id) queryParams.project_id = project_id;
  return api.get('/applications', { params: queryParams });
};
export const updateApplication = (id, status) => api.patch(`/applications/${id}`, { status });

// ─── TASKS ───────────────────────────────────────────────────────────────────
export const getProjectTasks = (project_id) => api.get('/tasks', { params: { project_id } });
export const getTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (project_id, data) => api.post('/tasks', data, { params: { project_id } });
export const createTasksBulk = (project_id, tasks) =>
  api.post('/tasks/bulk', { tasks }, { params: { project_id } });
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

// ─── AI ──────────────────────────────────────────────────────────────────────
export const getAiProjectRequirements = (data) => api.post('/ai/project-requirements', data);
export const runTaskBreakdown = (data) => api.post('/ai/task-breakdown', data);
export const approveTaskBreakdown = (project_id, tasks) =>
  api.post('/ai/task-breakdown/approve', { tasks }, { params: { project_id } });
export const runTeamMatching = (project_id) => api.post('/ai/team-matching', { project_id });
export const approveTeam = (project_id, selected_student_ids) =>
  api.post('/ai/team-matching/approve', { selected_student_ids }, { params: { project_id } });

// ─── RATINGS ─────────────────────────────────────────────────────────────────
export const getRatings = (params) => api.get('/ratings', { params });
export const rateStudent = (data) => api.post('/ratings', data);

// ─── INTERVIEWS ──────────────────────────────────────────────────────────────
export const getInterviews = () => api.get('/interviews');
export const getInterview = (id) => api.get(`/interviews/${id}`);
export const scheduleInterview = (data) => api.post('/interviews', data);
export const updateInterview = (id, data) => api.put(`/interviews/${id}`, data);

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────
export const getCertificates = (params) => api.get('/certificates', { params });
export const issueCertificate = (data) => api.post('/certificates', data);
export const updateCertificatePdf = (id, pdf_url) =>
  api.patch(`/certificates/${id}/pdf`, { pdf_url });

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export const getMyEarnings = (params) => api.get('/payments', { params });
export const getPaymentBreakdown = (project_id) =>
  api.get(`/payments/breakdown/${project_id}`);

// ─── USERS ───────────────────────────────────────────────────────────────────
// Active students — for team matching / meeting scheduling
export const getStudentsList = (domain) =>
  api.get('/users/students/list', { params: domain ? { domain } : {} });
// Pending students — for expert vetting pipeline
export const getPendingStudents = (domain) =>
  api.get('/users/students/pending', { params: domain ? { domain } : {} });
export const getUser = (id) => api.get(`/users/${id}`);
export const updateProfile = (data) => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.put(`/users/${id}`, data);
};
export const getSettings = () => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.get(`/users/${id}`);
};
export const updateSettings = (data) => {
  const id = JSON.parse(localStorage.getItem('tb-auth') || '{}')?.state?.user?.id;
  return api.put(`/users/${id}`, data);
};

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const getNotifications = (params) => api.get('/notifications', { params });
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);
export const markAllRead = () => api.patch('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export const getConversations = () => api.get('/messages/conversations');
export const getMessages = (id, params) => api.get(`/messages/conversations/${id}`, { params });
export const startConversation = (other_user_id, project_id) =>
  api.post('/messages/conversations', { other_user_id, project_id });
export const sendMessage = (id, content) =>
  api.post(`/messages/conversations/${id}`, { content });
export const markConversationRead = (id) =>
  api.patch(`/messages/conversations/${id}/read`);
export const deleteConversation = (id) =>
  api.delete(`/messages/conversations/${id}`);
export const uploadFile = (id, formData) =>
  api.post(`/messages/conversations/${id}/file`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);