import { useEffect, useState } from 'react';
import { getOnboarding } from '../../onboarding/services/onboardingService';

const TRIAL_DAYS = 60; // 2 months

function getTrialInfo(trialStartedAt) {
  if (!trialStartedAt) return null;
  const start = new Date(trialStartedAt);
  const end = new Date(start.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();
  const remaining = Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
  const elapsed = TRIAL_DAYS - remaining;
  const percent = Math.min(100, Math.round((elapsed / TRIAL_DAYS) * 100));
  return { remaining, expired: remaining === 0, percent, endDate: end };
}

export function UpgradePanel({ userSession }) {
  const [trial, setTrial] = useState(null);

  useEffect(() => {
    if (!userSession?.userUid) return;
    getOnboarding(userSession.userUid)
      .then((data) => setTrial(getTrialInfo(data?.trialStartedAt)))
      .catch(() => {});
  }, [userSession?.userUid]);

  const features = [
    { icon: 'description', title: 'Unlimited Prescriptions', desc: 'Create and send unlimited prescriptions via WhatsApp every month' },
    { icon: 'smart_toy', title: 'Smart Tags & Auto-fill', desc: 'Configure reusable templates to speed up your prescription workflow' },
    { icon: 'send', title: 'WhatsApp Delivery', desc: 'Send prescriptions directly to patients via WhatsApp with one click' },
    { icon: 'history', title: 'Full Prescription History', desc: 'Access complete patient visit history with search and filters' },
    { icon: 'image', title: 'Digital Signature & Logo', desc: 'Professional branding with your clinic logo and digital signature on every prescription' },
    { icon: 'translate', title: 'Multi-language Support', desc: 'Generate prescriptions in regional languages for better patient understanding' },
    { icon: 'calendar_month', title: 'Appointment Scheduling', desc: 'Manage patient appointments and send automated reminders (coming soon)' },
    { icon: 'support_agent', title: 'Priority Support', desc: 'Get dedicated support with faster response times' },
  ];

  return (
    <section className="flex-grow overflow-y-auto bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-8 py-10">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
            Early Member Offer
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Subscribe to <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">EasyPrescribe Pro</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm max-w-md mx-auto">
            Everything you need to run your clinic digitally. One simple plan, no hidden fees.
          </p>
        </div>

        {/* Trial Status Banner */}
        {trial && (
          <div className={`rounded-2xl border p-5 mb-8 ${trial.expired ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined text-[20px] ${trial.expired ? 'text-red-500' : 'text-emerald-600'}`}>
                  {trial.expired ? 'timer_off' : 'timer'}
                </span>
                <span className={`text-sm font-bold ${trial.expired ? 'text-red-700' : 'text-emerald-800'}`}>
                  {trial.expired
                    ? 'Your free trial has ended'
                    : `${trial.remaining} day${trial.remaining !== 1 ? 's' : ''} left in your free trial`}
                </span>
              </div>
              <span className={`text-[11px] font-semibold ${trial.expired ? 'text-red-500' : 'text-emerald-600'}`}>
                {trial.expired ? 'Expired' : `Ends ${trial.endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${trial.expired ? 'bg-red-400' : trial.percent > 75 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                style={{ width: `${trial.percent}%` }}
              />
            </div>
            {!trial.expired && (
              <p className="text-[11px] text-emerald-600/80 mt-2">
                You're enjoying full access to all Pro features during your 2-month free trial.
              </p>
            )}
          </div>
        )}

        {/* Pricing Card */}
        <div className="relative bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.06)] overflow-hidden mb-10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500" />

          <div className="p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-8">
            {/* Price */}
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="flex items-baseline gap-2 justify-center sm:justify-start">
                <span className="text-slate-400 line-through text-lg font-medium">₹398</span>
                <span className="text-5xl font-extrabold text-slate-900 tracking-tight">₹298</span>
                <span className="text-slate-400 text-sm font-medium">/month</span>
              </div>
              <p className="text-xs text-amber-600 font-semibold mt-1.5 flex items-center gap-1 justify-center sm:justify-start">
                <span className="material-symbols-outlined text-[14px]">timer</span>
                Early member pricing — limited time
              </p>
              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Save ₹100/month
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px self-stretch bg-slate-200/80" />

            {/* Benefits summary */}
            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm font-semibold text-slate-800 mb-3">What's included:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {['Unlimited prescriptions', 'WhatsApp delivery', 'Smart Tags', 'Digital signature', 'Full history', 'Priority support'].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                    <span className="material-symbols-outlined text-[16px] text-emerald-500">check_circle</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="px-8 sm:px-10 pb-8 sm:pb-10">
            <button
              type="button"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all duration-200 flex items-center justify-center gap-2 mx-auto sm:mx-0"
            >
              <span className="material-symbols-outlined text-[20px]">bolt</span>
              Subscribe Now — ₹298/month
            </button>
            <p className="text-[11px] text-slate-400 mt-3 text-center sm:text-left">
              Cancel anytime. No long-term commitments. Prices are inclusive of GST.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-10">
          <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
            <div className="h-7 w-1 rounded-full bg-gradient-to-b from-amber-400 to-orange-500" />
            Everything in Pro
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 flex items-start gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/40 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-amber-600 text-[20px]">{f.icon}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800">{f.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ / Trust */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Can I cancel anytime?</p>
              <p className="text-xs text-slate-500 mt-0.5">Yes, you can cancel your subscription at any time. No questions asked.</p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700">Is my data secure?</p>
              <p className="text-xs text-slate-500 mt-0.5">All patient data is encrypted and stored securely. We comply with healthcare data privacy standards.</p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700">Will the price increase later?</p>
              <p className="text-xs text-slate-500 mt-0.5">Your early member pricing of ₹298/month is locked in as long as your subscription is active.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          Questions? Contact us at support@easyprescribe.com
        </p>
      </div>
    </section>
  );
}
