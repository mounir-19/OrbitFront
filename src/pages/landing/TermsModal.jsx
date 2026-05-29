export default function TermsModal({ onClose }) {
    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[680px] max-h-[80vh] rounded-2xl flex flex-col"
                style={{
                    background: '#0f0f24',
                    border: '1px solid rgba(100,80,180,0.25)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-8 py-5 flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(100,80,180,0.15)' }}
                >
                    <h2 className="text-[1.1rem] font-bold text-white">Terms & Conditions</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-white/50 hover:text-white transition-colors"
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto px-8 py-6 flex-1 text-[0.85rem] text-white/70 leading-[1.8] space-y-6"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(139,92,246,0.3) transparent' }}>

                    <p className="text-white/40 text-[0.78rem]">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

                    <section>
                        <h3 className="text-white font-semibold mb-2">1. Acceptance of Terms</h3>
                        <p>By accessing or using Orbite, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our platform. Orbite reserves the right to update these terms at any time, and continued use of the platform constitutes acceptance of any changes.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">2. Platform Description</h3>
                        <p>Orbite is a digital agency platform that connects clients with expert-supervised digital services including web development, mobile development, UI/UX design, video editing, social media management, presentations, voice overs, and data science solutions. All work is reviewed and delivered by qualified experts.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">3. Client Accounts</h3>
                        <p>Clients must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. Orbite reserves the right to suspend or terminate accounts that violate these terms.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">4. Project Requests & Delivery</h3>
                        <p>Upon submitting a project request, Orbite will review the scope and assign a qualified team. Delivery timelines are estimated and communicated at the start of each project. Orbite is not liable for delays caused by incomplete client information or late feedback.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">5. Payments</h3>
                        <p>All payments are processed securely through the platform and are quoted in Algerian Dinars (DZD). Payment is split into two installments: <strong className="text-white">50% is due before the project begins</strong>, and the remaining <strong className="text-white">50% is due upon final delivery</strong> and client approval. Work will not commence until the initial payment is confirmed. The final deliverable will be released only after the second payment is completed.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">6. Intellectual Property</h3>
                        <p>Upon full payment, the client receives full ownership of all final deliverables produced for their project. Orbite retains the right to showcase completed work in its portfolio unless the client explicitly requests otherwise in writing prior to project start.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">7. Confidentiality</h3>
                        <p>Orbite treats all client project details as confidential. We do not share your project information with third parties outside of the team working on your project. Clients are also expected to keep internal platform processes and communications confidential.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">8. Limitation of Liability</h3>
                        <p>Orbite is not liable for any indirect, incidental, or consequential damages arising from the use of our platform or services. Our total liability shall not exceed the amount paid by the client for the specific project in dispute.</p>
                    </section>

                    <section>
                        <h3 className="text-white font-semibold mb-2">9. Contact</h3>
                        <p>For any questions regarding these terms, please contact us through the platform or reach out via our official contact page.</p>
                    </section>

                </div>

                {/* Footer */}
                <div
                    className="px-8 py-4 flex-shrink-0 flex items-center justify-between"
                    style={{ borderTop: '1px solid rgba(100,80,180,0.15)' }}
                >
                    <p className="text-[0.75rem] text-white/30">You will be asked to accept these during sign up.</p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl text-[0.85rem] font-semibold text-white/70 hover:text-white transition-colors"
                        style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}