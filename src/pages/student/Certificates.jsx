import { useState, useEffect } from 'react';
import { ExternalLink, Share2, Award } from 'lucide-react';
import { getCertificates } from '../../api/student.api';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCertificates()
      .then((res) => setCerts(res.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleView = (cert) => {
    if (!cert.pdf_url) {
      alert('PDF is not yet generated for this certificate.');
      return;
    }
    window.open(cert.pdf_url, '_blank');
  };

  const handleShare = (cert) => {
    const url = cert.pdf_url || `${window.location.origin}/certificates/${cert.id}`;
    if (navigator.share) {
      navigator.share({ title: 'My TalentBridge Certificate', url });
    } else {
      navigator.clipboard?.writeText(url)
        .then(() => alert('Certificate link copied to clipboard!'))
        .catch(() => alert(url));
    }
  };

  const serviceLabel = (type) =>
    (type || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading certificates...</div>;

  return (
    <div className="px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-1 h-5 rounded-full bg-violet-500 inline-block" />
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Certificates</h1>
        </div>
        <p className="text-sm text-gray-400 pl-3">
          Verified proofs of professional work experience — shareable and downloadable.
        </p>
      </div>

      {certs.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl px-5 py-20 text-center">
          <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award size={24} className="text-violet-300" />
          </div>
          <p className="text-gray-500 font-medium mb-1">No certificates yet</p>
          <p className="text-sm text-gray-400">Complete a project to earn your first certificate.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {certs.map((cert) => (
            <div
              key={cert.id}
              className="bg-white border border-gray-100 rounded-2xl overflow-hidden flex flex-col"
            >
              {/* Preview banner — not clickable */}
              <div
                className="h-32 relative flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0f0a1e 0%, #1e1040 50%, #2d1b69 100%)' }}
              >
                <div className="absolute inset-2 border border-purple-700/40 rounded-lg" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-violet-600" />
                <div className="text-center relative z-10">
                  <p className="text-[10px] font-bold text-violet-400 tracking-widest mb-1">TALENTBRIDGE</p>
                  <p className="text-white font-bold text-sm">Certificate of Experience</p>
                  <p className="text-violet-300 text-[11px] mt-1">{serviceLabel(cert.service_type)}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-5 flex-1 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-semibold text-violet-500 uppercase tracking-widest mb-1">
                    {serviceLabel(cert.service_type)}
                  </p>
                  <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                    {cert.project_title || 'Project'}
                  </p>
                </div>

                <div className="space-y-1">
                  {cert.expert_name && (
                    <p className="text-[12px] text-gray-400">
                      Supervised by <span className="text-gray-600 font-medium">{cert.expert_name}</span>
                    </p>
                  )}
                  {cert.duration_days && (
                    <p className="text-[12px] text-gray-400">
                      Duration: <span className="text-gray-600 font-medium">{cert.duration_days} days</span>
                    </p>
                  )}
                  <p className="text-[12px] text-gray-400">
                    Issued:{' '}
                    <span className="text-gray-600 font-medium">
                      {cert.issued_at
                        ? new Date(cert.issued_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                        : '—'}
                    </span>
                  </p>
                </div>

                {/* Verified badge */}
                <div className="flex items-center gap-2 bg-violet-50 rounded-xl px-3 py-2">
                  <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[11px] font-semibold text-violet-600">Verified by TalentBridge</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleView(cert)}
                    disabled={!cert.pdf_url}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-xl text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ExternalLink size={13} />
                    View
                  </button>
                  <button
                    onClick={() => handleShare(cert)}
                    disabled={!cert.pdf_url}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-[12px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Share2 size={13} /> Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}