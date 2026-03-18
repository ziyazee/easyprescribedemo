import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getOnboarding, savePersonalDetails, saveExpertise } from '../../onboarding/services/onboardingService';
import { processImage, processSignature, validateSignatureBackground } from '../../../lib/imageProcessor';

const STATE_OPTIONS = [
  { value: '', label: 'Select State' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Delhi', label: 'Delhi' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'West Bengal', label: 'West Bengal' },
];

const SPECIALTIES = [
  { id: 'general-practice', name: 'General Practice', icon: 'stethoscope' },
  { id: 'cardiology', name: 'Cardiology', icon: 'cardiology' },
  { id: 'dermatology', name: 'Dermatology', icon: 'dermatology' },
  { id: 'pediatrics', name: 'Pediatrics', icon: 'child_care' },
  { id: 'orthopedics', name: 'Orthopedics', icon: 'orthopedics' },
  { id: 'neurology', name: 'Neurology', icon: 'neurology' },
  { id: 'psychiatry', name: 'Psychiatry', icon: 'psychology' },
  { id: 'oncology', name: 'Oncology', icon: 'monitor_heart' },
  { id: 'endocrinology', name: 'Endocrinology', icon: 'vaccines' },
  { id: 'gastroenterology', name: 'Gastroenterology', icon: 'gastroenterology' },
  { id: 'urology', name: 'Urology', icon: 'water_drop' },
];

const EDIT_TRANSITION = {
  opacity: { duration: 0.2, ease: 'easeOut' },
  y: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  height: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

const EDIT_VARIANTS = {
  initial: { opacity: 0, y: 8, height: 0 },
  animate: { opacity: 1, y: 0, height: 'auto' },
  exit: { opacity: 0, y: -8, height: 0 },
};

function SectionCard({ icon, title, subtitle, children, actions }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.02)] overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f7a5c] to-[#0ea4a4] flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-white text-[20px]">{icon}</span>
          </div>
          <div>
            <h3 className="text-[15px] font-bold text-slate-900 tracking-tight">{title}</h3>
            {subtitle ? <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p> : null}
          </div>
        </div>
        {actions || null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function ReadOnlyField({ label, value, icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="flex items-center gap-2 text-sm text-gray-900 font-medium min-h-[36px]">
        {icon ? <span className="material-symbols-outlined text-gray-400 text-[18px]">{icon}</span> : null}
        <span>{value || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
      </div>
    </div>
  );
}

function EditableField({ label, value, onChange, type = 'text', placeholder = '', icon, inputMode, maxLength }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</label>
      <div className="relative">
        {icon ? (
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">{icon}</span>
        ) : null}
        <input
          className={`w-full rounded-md border border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#1A8B6A]/20 focus:border-[#1A8B6A] px-3 py-2.5 transition-colors ${icon ? 'pl-10' : ''}`}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          maxLength={maxLength}
        />
      </div>
    </div>
  );
}

function titleCase(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function ProfileHeader({ fullName, qualification, expertises, registrationNumber, clinicName }) {
  const initials = String(fullName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'DR';

  const displayName = fullName ? `Dr. ${titleCase(fullName)}` : 'Doctor';

  const primaryExpertise = (expertises || [])
    .map((e) => SPECIALTIES.find((s) => s.id === e)?.name || e)
    .slice(0, 2)
    .join(', ');

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <span className="material-symbols-outlined text-sm text-gray-400">badge</span>
          Doctor Profile
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Verified
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-xl bg-[#1A8B6A] flex items-center justify-center text-4xl font-bold text-white shadow-inner shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName}</h2>
            {qualification ? <p className="text-gray-600 font-medium mb-4">{qualification}</p> : null}
            <div className="flex flex-wrap gap-2">
              {registrationNumber ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  <span className="material-symbols-outlined mr-1.5 text-gray-500 text-sm">assignment_ind</span>
                  Reg. {registrationNumber}
                </span>
              ) : null}
              {clinicName ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  <span className="material-symbols-outlined mr-1.5 text-gray-500 text-sm">local_hospital</span>
                  {clinicName}
                </span>
              ) : null}
              {primaryExpertise ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-50 text-green-700 border border-green-200">
                  <span className="material-symbols-outlined mr-1.5 text-green-600 text-sm">psychology</span>
                  {primaryExpertise}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DoctorProfileSection({ userSession, onProfileUpdated }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [toast, setToast] = useState('');

  const [imagePreview, setImagePreview] = useState(null); // { type: 'logo'|'signature', original: dataUrl, processed: dataUrl }
  const [rejectedImage, setRejectedImage] = useState(null); // dataUrl of rejected signature

  const [personalDetails, setPersonalDetails] = useState({
    fullName: '',
    medicalRegistrationNumber: '',
    dateOfBirth: '',
    qualification: '',
    clinicName: '',
    address: '',
    city: '',
    state: '',
    clinicContactNumber: '',
    clinicLogo: '',
    digitalSignature: '',
  });
  const [expertises, setExpertises] = useState([]);
  const [clinicLogo, setClinicLogo] = useState(() => {
    try { return localStorage.getItem(`ep_logo_${userSession?.userUid}`) || ''; } catch { return ''; }
  });
  const [digitalSignature, setDigitalSignature] = useState(() => {
    try { return localStorage.getItem(`ep_sig_${userSession?.userUid}`) || ''; } catch { return ''; }
  });
  const [onboardingStatus, setOnboardingStatus] = useState({
    personalDetailsCompleted: false,
    expertiseCompleted: false,
    onboardingCompleted: false,
  });

  const [editBuffer, setEditBuffer] = useState({});

  useEffect(() => {
    async function loadProfile() {
      if (!userSession?.userUid) {
        setLoading(false);
        return;
      }
      try {
        const data = await getOnboarding(userSession.userUid);
        if (data?.personalDetails) {
          const logo = data.personalDetails.clinicLogo || '';
          const sig = data.personalDetails.digitalSignature || '';
          setPersonalDetails({
            fullName: data.personalDetails.fullName || '',
            medicalRegistrationNumber: data.personalDetails.medicalRegistrationNumber || '',
            dateOfBirth: data.personalDetails.dateOfBirth || '',
            qualification: data.personalDetails.qualification || '',
            clinicName: data.personalDetails.clinicName || '',
            address: data.personalDetails.address || '',
            city: data.personalDetails.city || '',
            state: data.personalDetails.state || '',
            clinicContactNumber: data.personalDetails.clinicContactNumber || '',
            clinicLogo: logo,
            digitalSignature: sig,
          });
          if (logo) setClinicLogo(logo);
          if (sig) setDigitalSignature(sig);
        }
        setExpertises(data?.expertises || []);
        setOnboardingStatus({
          personalDetailsCompleted: data?.personalDetailsCompleted || false,
          expertiseCompleted: data?.expertiseCompleted || false,
          onboardingCompleted: data?.onboardingCompleted || false,
        });
      } catch {
        // Profile may not exist yet for new users
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [userSession?.userUid]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const startEdit = (section) => {
    if (section === 'personal') {
      setEditBuffer({ ...personalDetails });
    } else if (section === 'clinic') {
      setEditBuffer({
        clinicName: personalDetails.clinicName,
        address: personalDetails.address,
        city: personalDetails.city,
        state: personalDetails.state,
        clinicContactNumber: personalDetails.clinicContactNumber,
      });
    } else if (section === 'expertise') {
      setEditBuffer({ expertises: [...expertises] });
    }
    setEditingSection(section);
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditBuffer({});
  };

  const handleSavePersonal = async () => {
    if (!userSession?.userUid) return;
    setSaving(true);
    try {
      const merged = { ...personalDetails, ...editBuffer, clinicLogo, digitalSignature };
      await savePersonalDetails({
        userUid: userSession.userUid,
        fullName: merged.fullName.trim(),
        medicalRegistrationNumber: merged.medicalRegistrationNumber.trim(),
        dateOfBirth: merged.dateOfBirth,
        qualification: merged.qualification.trim(),
        clinicName: merged.clinicName.trim(),
        address: merged.address.trim(),
        city: merged.city.trim(),
        state: merged.state,
        clinicContactNumber: merged.clinicContactNumber.replace(/\D/g, '').slice(0, 10),
        clinicLogo: merged.clinicLogo || null,
        digitalSignature: merged.digitalSignature || null,
      });
      setPersonalDetails(merged);
      setEditingSection(null);
      setEditBuffer({});
      showToast('Personal details updated successfully.');
      onProfileUpdated?.();
    } catch (error) {
      showToast(error.message || 'Failed to save personal details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClinic = async () => {
    if (!userSession?.userUid) return;
    setSaving(true);
    try {
      const merged = { ...personalDetails, ...editBuffer, clinicLogo, digitalSignature };
      await savePersonalDetails({
        userUid: userSession.userUid,
        fullName: merged.fullName.trim(),
        medicalRegistrationNumber: merged.medicalRegistrationNumber.trim(),
        dateOfBirth: merged.dateOfBirth,
        qualification: merged.qualification.trim(),
        clinicName: merged.clinicName.trim(),
        address: merged.address.trim(),
        city: merged.city.trim(),
        state: merged.state,
        clinicContactNumber: merged.clinicContactNumber.replace(/\D/g, '').slice(0, 10),
        clinicLogo: merged.clinicLogo || null,
        digitalSignature: merged.digitalSignature || null,
      });
      setPersonalDetails(merged);
      setEditingSection(null);
      setEditBuffer({});
      showToast('Clinic information updated successfully.');
      onProfileUpdated?.();
    } catch (error) {
      showToast(error.message || 'Failed to save clinic information.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpertise = async () => {
    if (!userSession?.userUid) return;
    setSaving(true);
    try {
      await saveExpertise({
        userUid: userSession.userUid,
        expertises: editBuffer.expertises || [],
      });
      setExpertises(editBuffer.expertises || []);
      setEditingSection(null);
      setEditBuffer({});
      showToast('Expertise updated successfully.');
      onProfileUpdated?.();
    } catch (error) {
      showToast(error.message || 'Failed to save expertise.');
    } finally {
      setSaving(false);
    }
  };

  const toggleExpertise = (id) => {
    setEditBuffer((prev) => {
      const current = new Set(prev.expertises || []);
      if (current.has(id)) current.delete(id);
      else current.add(id);
      return { ...prev, expertises: [...current] };
    });
  };

  const persistProfile = async (details) => {
    if (!userSession?.userUid) return;
    try {
      await savePersonalDetails({
        userUid: userSession.userUid,
        fullName: details.fullName?.trim() || '',
        medicalRegistrationNumber: details.medicalRegistrationNumber?.trim() || '',
        dateOfBirth: details.dateOfBirth || '',
        qualification: details.qualification?.trim() || '',
        clinicName: details.clinicName?.trim() || '',
        address: details.address?.trim() || '',
        city: details.city?.trim() || '',
        state: details.state || '',
        clinicContactNumber: (details.clinicContactNumber || '').replace(/\D/g, '').slice(0, 10),
        clinicLogo: details.clinicLogo || null,
        digitalSignature: details.digitalSignature || null,
      });
    } catch { /* silent — toast already shown */ }
  };

  const handleImageUpload = (event, type) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const rawDataUrl = reader.result;

      try {
        // For signatures, validate the background is clean white first
        if (type === 'signature') {
          const { result } = await validateSignatureBackground(rawDataUrl);
          if (result === 'reject') {
            setRejectedImage(rawDataUrl);
            return;
          }
          // 'fixable' → auto-correct minor off-white to pure white
          // 'pass' → just trim and resize
          showToast('Processing image...');
          const processedDataUrl = await processSignature(rawDataUrl, {
            maxWidth: 400, maxHeight: 120, fix: result === 'fixable'
          });
          setImagePreview({ type, original: rawDataUrl, processed: processedDataUrl });
          return;
        }

        showToast('Processing image...');
        const processedDataUrl = await processImage(rawDataUrl, { maxWidth: 300, maxHeight: 120, transparentBg: true });

        setImagePreview({ type, original: rawDataUrl, processed: processedDataUrl });
      } catch {
        showToast('Failed to process image. Please try a different file.');
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const confirmImageUpload = () => {
    if (!imagePreview) return;
    const { type, processed } = imagePreview;
    const storageKey = type === 'logo' ? `ep_logo_${userSession?.userUid}` : `ep_sig_${userSession?.userUid}`;
    try {
      localStorage.setItem(storageKey, processed);
    } catch {
      showToast('Unable to save — storage may be full.');
      setImagePreview(null);
      return;
    }
    if (type === 'logo') {
      setClinicLogo(processed);
      setPersonalDetails((prev) => {
        const updated = { ...prev, clinicLogo: processed };
        persistProfile(updated);
        return updated;
      });
      showToast('Clinic logo updated.');
    } else {
      setDigitalSignature(processed);
      setPersonalDetails((prev) => {
        const updated = { ...prev, digitalSignature: processed };
        persistProfile(updated);
        return updated;
      });
      showToast('Digital signature updated.');
    }
    setImagePreview(null);
  };

  const handleRemoveImage = (type) => {
    const storageKey = type === 'logo' ? `ep_logo_${userSession?.userUid}` : `ep_sig_${userSession?.userUid}`;
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    if (type === 'logo') {
      setClinicLogo('');
      setPersonalDetails((prev) => ({ ...prev, clinicLogo: '' }));
      showToast('Clinic logo removed.');
    } else {
      setDigitalSignature('');
      setPersonalDetails((prev) => ({ ...prev, digitalSignature: '' }));
      showToast('Digital signature removed.');
    }
  };

  const updateEditField = (key, value) => {
    setEditBuffer((prev) => ({ ...prev, [key]: value }));
  };

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  if (loading) {
    return (
      <section className="flex-grow flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          <span className="text-sm font-medium">Loading profile...</span>
        </div>
      </section>
    );
  }

  const editButton = (section) => (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-500 bg-transparent rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-all"
      onClick={() => startEdit(section)}
    >
      <span className="material-symbols-outlined text-[15px] text-slate-400">edit</span>
      Edit
    </button>
  );

  const saveActions = (onSave) => (
    <div className="flex items-center gap-2 pt-4 border-t border-gray-200 mt-4">
      <button
        type="button"
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        onClick={cancelEdit}
        disabled={saving}
      >
        Cancel
      </button>
      <button
        type="button"
        className="px-5 py-2 text-sm font-semibold text-white bg-[#1A8B6A] rounded-md hover:bg-[#166f56] transition-colors disabled:opacity-60"
        onClick={onSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  return (
    <section className="flex-grow overflow-y-auto bg-[#F3F4F6]">
      <div className="px-8 py-8 space-y-6">
        {/* Profile Header */}
        <ProfileHeader
          fullName={personalDetails.fullName}
          qualification={personalDetails.qualification}
          expertises={expertises}
          registrationNumber={personalDetails.medicalRegistrationNumber}
          clinicName={personalDetails.clinicName}
        />

        {/* Onboarding Status */}
        {!onboardingStatus.onboardingCompleted ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3 shadow-sm">
            <span className="material-symbols-outlined text-amber-600 mt-0.5">warning</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Profile Incomplete</p>
              <p className="text-xs text-amber-700 mt-0.5">Complete all sections below to unlock full prescribing features.</p>
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <SectionCard
            icon="person_outline"
            title="Personal Information"
            subtitle="Your identity and medical credentials"
            actions={editingSection !== 'personal' ? editButton('personal') : null}
          >
            <motion.div className="relative overflow-hidden">
              <AnimatePresence initial={false}>
                {editingSection === 'personal' ? (
                  <motion.div key="personal-edit" variants={EDIT_VARIANTS} initial="initial" animate="animate" exit="exit" transition={EDIT_TRANSITION} className="space-y-4 overflow-hidden">
                    <EditableField
                      label="Full Name"
                      value={editBuffer.fullName || ''}
                      onChange={(v) => updateEditField('fullName', v)}
                      placeholder="Dr. Rajesh Kumar"
                      icon="person"
                    />
                    <EditableField
                      label="Medical Registration Number"
                      value={editBuffer.medicalRegistrationNumber || ''}
                      onChange={(v) => updateEditField('medicalRegistrationNumber', v)}
                      placeholder="e.g. MCI-123456"
                      icon="badge"
                    />
                    <EditableField
                      label="Date of Birth"
                      value={editBuffer.dateOfBirth || ''}
                      onChange={(v) => updateEditField('dateOfBirth', v)}
                      type="date"
                      icon="calendar_today"
                    />
                    <EditableField
                      label="Qualification"
                      value={editBuffer.qualification || ''}
                      onChange={(v) => updateEditField('qualification', v)}
                      placeholder="e.g. MBBS, MD (General Medicine)"
                      icon="school"
                    />
                    {saveActions(handleSavePersonal)}
                  </motion.div>
                ) : (
                  <motion.div key="personal-view" variants={EDIT_VARIANTS} initial="initial" animate="animate" exit="exit" transition={EDIT_TRANSITION} className="overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                      <ReadOnlyField label="Full Name" value={personalDetails.fullName} icon="person" />
                      <ReadOnlyField label="Registration No." value={personalDetails.medicalRegistrationNumber} icon="badge" />
                      <ReadOnlyField label="Date of Birth" value={formatDate(personalDetails.dateOfBirth)} icon="calendar_today" />
                      <ReadOnlyField label="Qualification" value={personalDetails.qualification} icon="school" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </SectionCard>

          {/* Clinic Information */}
          <SectionCard
            icon="domain_add"
            title="Clinic Information"
            subtitle="Your practice and contact details"
            actions={editingSection !== 'clinic' ? editButton('clinic') : null}
          >
            <motion.div className="relative overflow-hidden">
              <AnimatePresence initial={false}>
                {editingSection === 'clinic' ? (
                  <motion.div key="clinic-edit" variants={EDIT_VARIANTS} initial="initial" animate="animate" exit="exit" transition={EDIT_TRANSITION} className="space-y-4 overflow-hidden">
                    <EditableField
                      label="Clinic Name"
                      value={editBuffer.clinicName || ''}
                      onChange={(v) => updateEditField('clinicName', v)}
                      placeholder="e.g. City Care Clinic"
                      icon="local_hospital"
                    />
                    <EditableField
                      label="Address"
                      value={editBuffer.address || ''}
                      onChange={(v) => updateEditField('address', v)}
                      placeholder="Street address"
                      icon="location_on"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField
                        label="City"
                        value={editBuffer.city || ''}
                        onChange={(v) => updateEditField('city', v)}
                        placeholder="City"
                      />
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">State</label>
                        <select
                          className="w-full rounded-md border border-gray-200 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#1A8B6A]/20 focus:border-[#1A8B6A] px-3 py-2.5 transition-colors"
                          value={editBuffer.state || ''}
                          onChange={(e) => updateEditField('state', e.target.value)}
                        >
                          {STATE_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <EditableField
                      label="Contact Number"
                      value={editBuffer.clinicContactNumber || ''}
                      onChange={(v) => updateEditField('clinicContactNumber', v.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit phone"
                      icon="call"
                      inputMode="numeric"
                      maxLength={10}
                    />
                    {saveActions(handleSaveClinic)}
                  </motion.div>
                ) : (
                  <motion.div key="clinic-view" variants={EDIT_VARIANTS} initial="initial" animate="animate" exit="exit" transition={EDIT_TRANSITION} className="overflow-hidden">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-4">
                      <ReadOnlyField label="Clinic Name" value={personalDetails.clinicName} icon="local_hospital" />
                      <ReadOnlyField label="Contact Number" value={personalDetails.clinicContactNumber ? `+91 ${personalDetails.clinicContactNumber}` : ''} icon="call" />
                      <div className="sm:col-span-2">
                        <ReadOnlyField
                          label="Address"
                          value={[personalDetails.address, personalDetails.city, personalDetails.state].filter(Boolean).join(', ') || ''}
                          icon="location_on"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </SectionCard>
        </div>

        {/* Medical Expertise */}
        <SectionCard
          icon="medical_services"
          title="Medical Expertise"
          subtitle="Your areas of specialization"
          actions={editingSection !== 'expertise' ? editButton('expertise') : null}
        >
          <motion.div className="relative overflow-hidden">
            <AnimatePresence initial={false}>
              {editingSection === 'expertise' ? (
                <motion.div key="expertise-edit" variants={EDIT_VARIANTS} initial="initial" animate="animate" exit="exit" transition={EDIT_TRANSITION} className="overflow-hidden">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-2">
                    {SPECIALTIES.map((spec) => {
                      const isSelected = (editBuffer.expertises || []).includes(spec.id);
                      return (
                        <button
                          key={spec.id}
                          type="button"
                          className={`flex items-center gap-2.5 p-3 rounded-md text-left transition-colors ${
                            isSelected
                              ? 'border border-green-200 bg-green-50 text-green-700'
                              : 'border border-gray-200 bg-white text-gray-600 hover:border-[#1A8B6A]/40 hover:text-[#1A8B6A]'
                          }`}
                          onClick={() => toggleExpertise(spec.id)}
                        >
                          <span className="material-symbols-outlined text-[20px]">{spec.icon}</span>
                          <span className="text-sm font-medium">{spec.name}</span>
                          {isSelected ? <span className="material-symbols-outlined text-[16px] ml-auto">check</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  {saveActions(handleSaveExpertise)}
                </motion.div>
              ) : (
                <motion.div key="expertise-view" variants={EDIT_VARIANTS} initial="initial" animate="animate" exit="exit" transition={EDIT_TRANSITION} className="overflow-hidden">
                  {!expertises.length ? (
                    <p className="text-sm text-slate-500 italic">No expertise selected yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {expertises.map((expId) => {
                        const spec = SPECIALTIES.find((s) => s.id === expId);
                        return (
                          <span
                            key={expId}
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1f7a5c]/5 border border-[#1f7a5c]/15 text-[#1f7a5c] text-sm font-medium"
                          >
                            <span className="material-symbols-outlined text-[18px]">{spec?.icon || 'medical_services'}</span>
                            {spec?.name || expId}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </SectionCard>

        {/* Clinic Logo & Digital Signature */}
        <SectionCard
          icon="image"
          title="Clinic Logo & Digital Signature"
          subtitle="These appear on your printed and PDF prescriptions"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Clinic Logo */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Clinic Logo</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">This logo will appear on patient reports, prescriptions, and billing statements.</p>
              {clinicLogo ? (
                <div className="rounded-2xl border border-[#1f7a5c]/20 bg-[#1f7a5c]/[0.03] p-6 flex flex-col items-center ring-1 ring-[#1f7a5c]/10">
                  <div className="w-full h-44 flex items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-100 mb-5 shadow-sm">
                    <img src={clinicLogo} alt="Clinic logo" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1f7a5c] rounded-lg hover:bg-[#186347] transition-all cursor-pointer shadow-sm">
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      Replace
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-9 h-9 text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                      onClick={() => handleRemoveImage('logo')}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#1f7a5c]/25 bg-[#1f7a5c]/[0.02] hover:border-[#1f7a5c]/50 hover:bg-[#1f7a5c]/5 transition-all cursor-pointer p-10 group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#1f7a5c]/15 flex items-center justify-center text-[#1f7a5c]/50 group-hover:text-[#1f7a5c] group-hover:border-[#1f7a5c]/30 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600 group-hover:text-[#1f7a5c] transition-colors">Upload Clinic Logo</p>
                    <p className="text-[11px] text-slate-400 mt-1">PNG, JPG up to 2 MB</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'logo')} />
                </label>
              )}
            </div>

            {/* Digital Signature */}
            <div>
              <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Professional Digital Signature</h4>
              <p className="text-xs text-slate-400 mt-1 mb-4">Secured signature used for e-prescriptions and clinical clearance letters.</p>
              {digitalSignature ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 flex flex-col items-center">
                  <div className="w-full h-40 flex items-center justify-center overflow-hidden rounded-xl bg-white mb-5">
                    <img src={digitalSignature} alt="Digital signature" className="max-h-full max-w-full object-contain" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1f7a5c] rounded-lg hover:bg-[#186347] transition-all cursor-pointer shadow-sm">
                      <span className="material-symbols-outlined text-[15px]">edit</span>
                      Replace
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'signature')} />
                    </label>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-9 h-9 text-slate-500 bg-white border border-slate-200 rounded-lg hover:text-red-500 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm"
                      onClick={() => handleRemoveImage('signature')}
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-[#1f7a5c]/40 hover:bg-[#1f7a5c]/5 transition-all cursor-pointer p-10 group">
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-[#1f7a5c] group-hover:border-[#1f7a5c]/30 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-2xl">draw</span>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-600 group-hover:text-[#1f7a5c] transition-colors">Upload Signature</p>
                    <p className="text-[11px] text-slate-400 mt-1">Sign on a clean white paper and upload the photo</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'signature')} />
                </label>
              )}
            </div>
          </div>
        </SectionCard>

        {/* Account Info */}
        <SectionCard icon="shield_person" title="Account" subtitle="Your login credentials and account status">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <ReadOnlyField label="Username" value={userSession?.username} icon="alternate_email" />
            <ReadOnlyField label="User ID" value={userSession?.userUid ? String(userSession.userUid).slice(0, 8) + '...' : ''} icon="fingerprint" />
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {toast ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-[#1f7a5c] text-white text-sm font-medium px-5 py-3 shadow-xl animate-[fadeIn_0.2s_ease-out]">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {toast}
        </div>
      ) : null}

      {imagePreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setImagePreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                {imagePreview.type === 'logo' ? 'Confirm Clinic Logo' : 'Confirm Digital Signature'}
              </h3>
              <p className="text-sm text-slate-500">
                {imagePreview.type === 'logo'
                  ? 'Your logo has been auto-trimmed and resized. This is how it will appear on prescriptions.'
                  : 'Your signature has been auto-trimmed and resized. For best results, use a signature with a clean white or transparent background.'}
              </p>
            </div>

            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Original</p>
                  <div className="h-[120px] rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center p-3">
                    <img src={imagePreview.original} alt="Original" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Processed</p>
                  <div className="h-[120px] rounded-lg border-2 border-[#1f7a5c]/30 bg-white flex items-center justify-center p-3">
                    <img src={imagePreview.processed} alt="Processed" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preview on Prescription</p>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                {imagePreview.type === 'logo' ? (
                  <div className="flex items-center gap-3">
                    <div className="w-[64px] h-[64px] shrink-0 flex items-center justify-center">
                      <img src={imagePreview.processed} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div>
                      <p className="text-base font-black uppercase text-slate-900 leading-none">{personalDetails.clinicName || 'Clinic Name'}</p>
                      <p className="text-sm text-[#357f62] font-semibold">Dr. {personalDetails.fullName || 'Doctor Name'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <div className="w-[200px] h-[80px] flex items-center justify-center bg-white">
                      <img src={imagePreview.processed} alt="Signature preview" className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="border-t border-slate-200 pt-1 mt-1 w-[200px] text-right">
                      <p className="text-sm font-semibold text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>Dr. {personalDetails.fullName || 'Doctor Name'}</p>
                      <p className="text-xs text-slate-500">{personalDetails.qualification || 'Qualification'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex border-t border-slate-100">
              <button
                className="flex-1 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                type="button"
                onClick={() => setImagePreview(null)}
              >Cancel</button>
              <button
                className="flex-1 px-4 py-3.5 text-sm font-semibold text-[#1f7a5c] hover:bg-[#1f7a5c]/5 transition-colors border-l border-slate-100"
                type="button"
                onClick={confirmImageUpload}
              >Confirm &amp; Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Rejected Signature Modal — shows wrong vs correct side by side */}
      {rejectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setRejectedImage(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Invalid Signature Background</h3>
              <p className="text-sm text-slate-500">
                Please sign on a <span className="font-semibold text-slate-700">clean white paper</span> and upload the photo. Colored or textured backgrounds are not supported.
              </p>
            </div>

            <div className="px-6 pb-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Wrong — uploaded image */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[16px] text-red-500">close</span>
                    <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Your Upload</p>
                  </div>
                  <div className="h-[120px] rounded-lg border-2 border-red-200 bg-red-50/50 flex items-center justify-center p-3">
                    <img src={rejectedImage} alt="Rejected" className="max-w-full max-h-full object-contain" />
                  </div>
                </div>

                {/* Right — sample correct signature */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-500">check</span>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Correct Format</p>
                  </div>
                  <div className="h-[120px] rounded-lg border-2 border-emerald-200 bg-white flex items-center justify-center p-3">
                    <svg viewBox="0 0 200 60" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <rect width="200" height="60" fill="white"/>
                      <path d="M20,45 Q25,15 35,30 T55,20 Q65,15 70,25 T85,20 Q95,35 105,25 T125,30 Q135,20 145,35 T165,25 Q175,20 180,30" fill="none" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 pb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs text-amber-700 flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] mt-0.5 shrink-0">lightbulb</span>
                  <span>Tip: Sign with a dark pen on plain white paper, then take a photo in good lighting. Avoid lined, colored, or textured paper.</span>
                </p>
              </div>
            </div>

            <div className="flex border-t border-slate-100">
              <button
                className="flex-1 px-4 py-3.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
                type="button"
                onClick={() => setRejectedImage(null)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
