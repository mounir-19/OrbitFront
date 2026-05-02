import { useState, useEffect } from 'react';
import { Download, Share2 } from 'lucide-react';
import { getCertificates, getCertificate } from '../../api/student.api';

export default function Certificates() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    getCertificates()
      .then((res) => setCerts(res.data || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (cert) => {
    setDownloading(cert.id);
    try {
      if (cert.pdf_url) {
        window.open(cert.pdf_url, '_blank');
      } else {
        alert('PDF not yet generated for this certificate.');
      }
    } finally {
      setDownloading(null);
    }
  };

  const handleShare = (cert) => {
    const url = `${window.location.origin}/certificates/${cert.id}`;
    navigator.clipboard?.writeText(url)
      .then(() => alert('Link copied!'))
      .catch(() => alert(url));
  };

  if (loading) return <div className="px-8 py-8 text-sm text-gray-400">Loading certificates...</div>;

  return (
    <div className="px-8 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Certificates</h1>
      <p className="text-sm text-gray-500 mb-8">Shareable proofs of completed work — signed by your expert and the client.</p>

      {certs.length === 0 ? (
        <div className="border border-gray-200 rounded-xl px-5 py-10 text-center text-gray-400 text-sm">
          No certificates yet. Complete a project to earn one.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-5">
          {certs.map((cert) => (
            <div key={cert.id} className="border-2 border-indigo-100 rounded-xl px-5 py-5 flex flex-col gap-4">
              <div>
                <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-2">Certificate</div>
                <div className="text-lg font-bold text-gray-900 mb-1">{cert.project_title || 'Project'}</div>
                <div className="text-sm text-gray-500">
                  {cert.service_type} — issued {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
                {cert.duration_days && (
                  <div className="text-xs text-gray-400 mt-0.5">Duration: {cert.duration_days} days</div>
                )}
              </div>
              <div className="bg-indigo-50 rounded-lg px-3 py-2.5 text-xs text-indigo-700">
                Verified by TalentBridge
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(cert)} disabled={downloading === cert.id}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                  <Download size={14} />
                  {downloading === cert.id ? 'Opening...' : 'Download PDF'}
                </button>
                <button onClick={() => handleShare(cert)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-800 text-white rounded-lg text-sm font-medium hover:bg-indigo-900">
                  <Share2 size={14} /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}