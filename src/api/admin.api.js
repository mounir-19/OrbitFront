import api from './axiosInstance';

// ─── PROJECTS ────────────────────────────────────────────────────────────────
// Backend: GET /api/projects?status=&domain=&page=&limit=
export const getAllProjects = (params) => api.get('/projects', { params });

// Backend: GET /api/projects/:id → returns project + tasks array
export const getProject = (id) => api.get(`/projects/${id}`);

// Backend: PUT /api/projects/:id
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);

// Backend: PATCH /api/projects/:id/assign-expert → body: { expert_id }
// Sets project status to 'under_review' automatically
export const assignExpert = (id, expert_id) =>
  api.patch(`/projects/${id}/assign-expert`, { expert_id });

// Backend: DELETE /api/projects/:id
export const deleteProject = (id) => api.delete(`/projects/${id}`);

// ─── USERS ───────────────────────────────────────────────────────────────────
// Backend: GET /api/users?role=&status=&domain=&page=&limit=
// Returns: { total, page, limit, users: [...] }
export const getUsers = (params) => api.get('/users', { params });

// Backend: GET /api/users/:id → returns user with role sub-object (student/expert/client)
export const getUser = (id) => api.get(`/users/${id}`);

// Backend: GET /api/users/students/list?domain=
export const getStudentsList = (domain) =>
  api.get('/users/students/list', { params: domain ? { domain } : {} });

// Backend: GET /api/users/students/pending?domain=
// Admin sees all pending students; experts see only their assigned students (filtered server-side)
export const getPendingStudents = (domain) =>
  api.get('/users/students/pending', { params: domain ? { domain } : {} });

// Backend: PATCH /api/users/:id/assign-expert → body: { expert_id }
// Assigns a student to an expert for vetting; notifies both parties
export const assignStudentToExpert = (student_id, expert_id) =>
  api.patch(`/users/${student_id}/assign-expert`, { expert_id });

// Backend: PUT /api/users/:id
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// Backend: PATCH /api/users/:id/status → body: { status: 'active'|'inactive'|'suspended'|'pending' }
export const updateUserStatus = (id, status) =>
  api.patch(`/users/${id}/status`, { status });

// Backend: DELETE /api/users/:id
export const deleteUser = (id) => api.delete(`/users/${id}`);

// ─── APPLICATIONS ────────────────────────────────────────────────────────────
// Backend: GET /api/applications?project_id=&status=
export const getApplications = (params) => api.get('/applications', { params });

// Backend: PATCH /api/applications/:id → body: { status }
// status='selected' → auto adds to group, increments consecutive_projects, notifies student
export const updateApplication = (id, status) =>
  api.patch(`/applications/${id}`, { status });

// Backend: DELETE /api/applications/:id → admin only
export const deleteApplication = (id) => api.delete(`/applications/${id}`);

// ─── AI AGENTS ────────────────────────────────────────────────────────────────
// Backend: POST /api/ai/task-breakdown
export const runTaskBreakdown = (data) => api.post('/ai/task-breakdown', data);

// Backend: POST /api/ai/task-breakdown/approve?project_id=
export const approveTaskBreakdown = (project_id, tasks) =>
  api.post('/ai/task-breakdown/approve', { tasks }, { params: { project_id } });

// Backend: POST /api/ai/team-matching
export const runTeamMatching = (project_id) =>
  api.post('/ai/team-matching', { project_id });

// Backend: POST /api/ai/team-matching/approve?project_id=
export const approveTeam = (project_id, selected_student_ids) =>
  api.post('/ai/team-matching/approve', { selected_student_ids }, { params: { project_id } });

// Backend: GET /api/ai/logs?project_id=&type=
export const getAiLogs = (params) => api.get('/ai/logs', { params });

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
// Backend: GET /api/payments?project_id=&status=
export const getPayouts = (params) => api.get('/payments', { params });

// Backend: POST /api/payments → admin only
// Body: { project_id, recipient_id, recipient_type, amount, method, transaction_ref }
export const createPayment = (data) => api.post('/payments', data);

// Backend: PATCH /api/payments/:id → admin only
// Body: { status, transaction_ref, processed_at }
// Sends notification to recipient automatically
export const updatePayment = (id, data) => api.patch(`/payments/${id}`, data);

// Backend: GET /api/payments/breakdown/:project_id
export const getPaymentBreakdown = (project_id) =>
  api.get(`/payments/breakdown/${project_id}`);

// ─── CERTIFICATES ─────────────────────────────────────────────────────────────
// Backend: GET /api/certificates?student_id=
export const getCertificates = (params) => api.get('/certificates', { params });

// Backend: POST /api/certificates → admin/expert
export const issueCertificate = (data) => api.post('/certificates', data);

// Backend: PATCH /api/certificates/:id/pdf
export const updateCertificatePdf = (id, pdf_url) =>
  api.patch(`/certificates/${id}/pdf`, { pdf_url });

// ─── RATINGS ─────────────────────────────────────────────────────────────────
// Backend: GET /api/ratings?student_id= or ?project_id=
export const getRatings = (params) => api.get('/ratings', { params });

// ─── INTERVIEWS ──────────────────────────────────────────────────────────────
// Backend: GET /api/interviews → admin sees all
export const getInterviews = () => api.get('/interviews');

// Backend: PUT /api/interviews/:id
// result='admitted' → sets student status='active', sends notification
export const updateInterview = (id, data) => api.put(`/interviews/${id}`, data);

// Backend: DELETE /api/interviews/:id → admin only
export const deleteInterview = (id) => api.delete(`/interviews/${id}`);

// ─── REFERRALS ───────────────────────────────────────────────────────────────
// Backend: GET /api/referrals → admin sees all
export const getReferrals = () => api.get('/referrals');

// Backend: PATCH /api/referrals/:id → admin only
// Body: { status, project_id, bonus_amount }
// status='converted' → sets referral_priority=true on application
export const updateReferral = (id, data) => api.patch(`/referrals/${id}`, data);

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export const getNotifications = (params) => api.get('/notifications', { params });

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const changePassword = (data) => api.put('/auth/change-password', data);


// ─── DISPUTES ─────────────────────────────────────────────────────────────────
export const getDisputes = (params) => api.get('/disputes', { params });
export const getDispute = (id) => api.get(`/disputes/${id}`);
export const createDispute = (data) => api.post('/disputes', data);
export const updateDispute = (id, data) => api.patch(`/disputes/${id}`, data);