import { FileText, ShieldCheck, Download } from 'lucide-react';

export default function Contracts() {
    // Placeholder — contracts will be populated by admin/expert once projects are signed.
    // When backend supports contracts, fetch from /api/contracts or similar endpoint.

    const mockContracts = []; // replace with real API call when ready

    return (
        <div className="min-h-screen bg-[#fafafa] px-8 py-8">

            {/* Header */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-[32px] font-bold text-[#111827] tracking-tight leading-none">Contracts</h1>
                    <p className="text-sm text-[#6b7280] mt-1.5">
                        Signed agreements and NDAs. Download PDFs any time.
                    </p>
                </div>
                <div className="flex items-center gap-2.5 bg-[#f5f3ff] border border-[#ede9fe] rounded-2xl px-5 py-3">
                    <ShieldCheck size={16} className="text-[#7c3aed]" />
                    <span className="text-[11px] font-bold text-[#7c3aed] uppercase tracking-widest">All files encrypted</span>
                </div>
            </div>

            {mockContracts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#ede9fe] flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[#f5f3ff] flex items-center justify-center mb-4">
                        <FileText size={26} className="text-[#7c3aed]" />
                    </div>
                    <div className="text-base font-bold text-[#374151] mb-2">No contracts yet</div>
                    <div className="text-[13px] text-[#9ca3af] max-w-xs leading-relaxed">
                        Signed agreements and NDAs will appear here once your projects are confirmed and contracts are issued.
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-[#ede9fe] overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr_auto] px-6 py-3 bg-[#fafafa] border-b border-[#ede9fe]">
                        {['Document', 'Project', 'Signed', ''].map(h => (
                            <div key={h} className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{h}</div>
                        ))}
                    </div>
                    <div className="divide-y divide-[#f5f3ff]">
                        {mockContracts.map(c => (
                            <div key={c.id} className="grid grid-cols-[2fr_1fr_1fr_auto] items-center px-6 py-4 hover:bg-[#fafafa]">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-[#f5f3ff] flex items-center justify-center">
                                        <FileText size={16} className="text-[#7c3aed]" />
                                    </div>
                                    <span className="text-[13px] font-semibold text-[#111827]">{c.name}</span>
                                </div>
                                <span className="text-[12px] text-[#6b7280]">{c.project}</span>
                                <span className="text-[12px] text-[#6b7280]">{c.signed_at}</span>
                                <button className="flex items-center gap-1.5 px-3 py-2 border border-[#ede9fe] rounded-xl text-[11px] font-bold text-[#6b7280] hover:bg-[#f5f3ff] transition-colors">
                                    <Download size={12} /> Download
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}