import { useEffect, useState } from 'react';
import { getOnboarding, saveTags } from '../../onboarding/services/onboardingService';
import { SmartTagsSection } from '../../onboarding/components/SmartTagsSection';

export function SmartTagsPanel({ userSession }) {
  const [smartTags, setSmartTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      if (!userSession?.userUid) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOnboarding(userSession.userUid);
        setSmartTags(data?.smartTags || []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userSession?.userUid]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSmartTagsChange = async (updatedTags) => {
    setSmartTags(updatedTags);
    if (!userSession?.userUid) return;
    setSaving(true);
    try {
      await saveTags({
        userUid: userSession.userUid,
        smartTags: updatedTags,
      });
      showToast('Smart tags saved successfully.');
    } catch {
      showToast('Failed to save smart tags.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="flex-grow flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span className="text-sm font-medium">Loading smart tags...</span>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-grow overflow-y-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <SmartTagsSection
          smartTags={smartTags}
          onSmartTagsChange={handleSmartTagsChange}
          hideNavigation
        />
        {saving ? (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-700 text-white text-sm font-medium px-5 py-3 shadow-xl">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Saving...
          </div>
        ) : null}
        {toast && !saving ? (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#1f7a5c] text-white text-sm font-medium px-5 py-3 shadow-xl">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {toast}
          </div>
        ) : null}
      </div>
    </section>
  );
}
