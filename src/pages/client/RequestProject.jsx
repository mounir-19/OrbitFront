import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Sparkles, AlertCircle, ChevronLeft, Edit3, ChevronRight } from 'lucide-react';
import { requestProject } from '../../api/client.api';
import api from '../../api/axiosInstance';
import toast from 'react-hot-toast';

// ─── Config ───────────────────────────────────────────────────────────────────
const SERVICE_TYPES = [
  { value: 'web_dev', label: 'Web Development' },
  { value: 'mobile_dev', label: 'Mobile App' },
  { value: 'ui_ux_design', label: 'UI/UX Design' },
  { value: 'video_editing', label: 'Video Editing' },
  { value: 'other', label: 'Other' },
];

// ─── Shared UI ────────────────────────────────────────────────────────────────
const Label = ({ children, optional }) => (
  <label className="block text-[11px] font-bold text-[#6b7280] uppercase tracking-widest mb-2">
    {children}
    {optional && <span className="text-[#9ca3af] font-normal normal-case tracking-normal ml-1.5">— optional</span>}
  </label>
);

const Input = ({ className = '', ...props }) => (
  <input
    {...props}
    className={`w-full bg-white border border-[#ede9fe] rounded-xl px-4 py-3 text-sm text-[#111827] outline-none
      focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all placeholder:text-[#c4b5fd] ${className}`}
  />
);

const Textarea = ({ className = '', ...props }) => (
  <textarea
    {...props}
    className={`w-full bg-white border border-[#ede9fe] rounded-xl px-4 py-3 text-sm text-[#111827] outline-none
      focus:border-[#7c3aed] focus:ring-2 focus:ring-[#f5f3ff] transition-all placeholder:text-[#c4b5fd] resize-y ${className}`}
  />
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-[#ede9fe] p-6">
    {title && <div className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest mb-4">{title}</div>}
    {children}
  </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function RequestProject() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    service_type: 'web_dev',
    skills_needed: '',
    deadline: '',
  });

  const [roughIdea, setRoughIdea] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiUsed, setAiUsed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showRough, setShowRough] = useState(true); // toggle AI input vs manual

  const setF = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: null }));
  };

  // ── AI generate ──────────────────────────────────────────────────────────
  const handleAiFill = async () => {
    if (!roughIdea.trim()) { toast.error('Describe your idea first.'); return; }
    setAiLoading(true);
    try {
      const res = await api.post('/ai/brief-assist', {
        title: roughIdea,
        partial_description: roughIdea,
        service_type: form.service_type || undefined,
      });
      const d = res.data;
      setForm(f => ({
        ...f,
        title: d.title || f.title,
        description: d.description || f.description,
        service_type: d.service_type || f.service_type,
        skills_needed: d.skills_needed || f.skills_needed,
      }));
      setAiUsed(true);
      setShowRough(false);
      toast.success('Brief generated — review and adjust before submitting.');
    } catch {
      toast.error('AI generation failed. Fill in the details manually.');
      setShowRough(false);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.description.trim()) e.description = 'Description is required';
    if (!form.service_type) e.service_type = 'Pick a service type';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await requestProject({
        title: form.title,
        description: form.description,
        service_type: form.service_type,
        skills_needed: form.skills_needed || undefined,
        deadline: form.deadline || undefined,
      });
      toast.success('Request submitted! Our team will review it within 24 hours.');
      navigate('/client/projects');
    } catch {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const minDeadline = new Date();
  minDeadline.setDate(minDeadline.getDate() + 7);
  const minDeadlineStr = minDeadline.toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-[#fafafa] px-8 py-8">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-[11px] font-bold text-[#9ca3af] uppercase tracking-widest mb-6 hover:text-[#7c3aed] transition-colors"
      >
        <ChevronLeft size={14} /> Back
      </button>

      <div className="mb-8">
        <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">
          Request a Project
        </h1>
        <p className="text-sm text-[#6b7280] mt-1.5">
          Describe what you need. Our team will scope it, price it, and assign a vetted team.
        </p>
      </div>

      <div className="flex flex-col gap-4">

        {/* ── AI Banner ─────────────────────────────────────────────────── */}
        <div className="bg-[#1e1b4b] rounded-2xl px-6 py-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl bg-[#7c3aed] flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AI Brief Assistant</div>
              <div className="text-[11px] text-[#a5b4fc]">
                Describe your idea in plain words — AI will write the brief for you
              </div>
            </div>
            <button
              onClick={() => setShowRough(v => !v)}
              className="ml-auto text-[10px] font-bold text-[#a5b4fc] uppercase tracking-widest hover:text-white transition-colors"
            >
              {showRough ? 'Hide' : 'Show'}
            </button>
          </div>

          {showRough && (
            <>
              <Textarea
                value={roughIdea}
                onChange={e => setRoughIdea(e.target.value)}
                rows={3}
                placeholder="e.g. I need an app for my clinic where patients can book appointments online in Arabic and French, with SMS reminders..."
                className="bg-white/10 border-white/20 text-white placeholder:text-[#6d5fa6] focus:border-[#7c3aed] focus:ring-[#7c3aed]/20 mb-3"
              />
              <button
                onClick={handleAiFill}
                disabled={aiLoading || !roughIdea.trim()}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#7c3aed] text-white rounded-xl text-[11px] font-bold uppercase tracking-widest disabled:opacity-60 hover:bg-[#6d28d9] transition-colors"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <><Zap size={13} /> {aiUsed ? 'Re-generate' : 'Generate Brief'}</>
                )}
              </button>
            </>
          )}
        </div>

        {/* ── Divider if AI was used ─────────────────────────────────────── */}
        {aiUsed && (
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#ede9fe]" />
            <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-widest flex items-center gap-1">
              <Sparkles size={10} /> AI-generated · review below
            </span>
            <div className="flex-1 h-px bg-[#ede9fe]" />
          </div>
        )}

        {/* ── Project Info ──────────────────────────────────────────────── */}
        <Section title="Project Info">
          <div className="flex flex-col gap-5">

            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Project Title</Label>
                {aiUsed && <span className="text-[10px] text-[#7c3aed] font-bold">✦ AI-generated</span>}
              </div>
              <Input
                value={form.title}
                onChange={e => setF('title', e.target.value)}
                placeholder="e.g. Arabic-first clinic appointment system"
              />
              {errors.title && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Description</Label>
                {aiUsed && <span className="text-[10px] text-[#7c3aed] font-bold">✦ AI-generated</span>}
              </div>
              <Textarea
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                rows={5}
                placeholder="Describe the goal, target users, key features, and any technical constraints..."
              />
              {errors.description && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.description}
                </p>
              )}
            </div>

            {/* Service type */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Service Type</Label>
                {aiUsed && <span className="text-[10px] text-[#7c3aed] font-bold">✦ AI-suggested</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setF('service_type', s.value)}
                    className={`px-4 py-2 rounded-xl text-[12px] font-bold uppercase tracking-widest transition-colors ${form.service_type === s.value
                      ? 'bg-[#7c3aed] text-white'
                      : 'bg-white border border-[#ede9fe] text-[#6b7280] hover:border-[#7c3aed] hover:text-[#7c3aed]'
                      }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {errors.service_type && (
                <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={11} /> {errors.service_type}
                </p>
              )}
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label optional>Skills Needed</Label>
                {aiUsed && form.skills_needed && (
                  <span className="text-[10px] text-[#7c3aed] font-bold">✦ AI-suggested</span>
                )}
              </div>
              <Input
                value={form.skills_needed}
                onChange={e => setF('skills_needed', e.target.value)}
                placeholder="e.g. React, Node.js, PostgreSQL, Arabic RTL"
              />
            </div>

            {/* Deadline */}
            <div>
              <Label optional>Your Preferred Deadline</Label>
              <Input
                value={form.deadline}
                onChange={e => setF('deadline', e.target.value)}
                type="date"
                min={minDeadlineStr}
              />
              <p className="text-[11px] text-[#9ca3af] mt-1">
                Our team may adjust this based on project scope.
              </p>
            </div>

          </div>
        </Section>

        {/* ── Actions ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-3 border border-[#ede9fe] rounded-xl text-[12px] font-bold text-[#6b7280] uppercase tracking-widest hover:bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2.5 px-8 py-3 bg-[#7c3aed] text-white rounded-xl text-[12px] font-bold uppercase tracking-widest disabled:opacity-60 transition-all hover:bg-[#6d28d9]"
          >
            {submitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <><Zap size={14} /> Submit Request</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}