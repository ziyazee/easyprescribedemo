import { useMemo, useState } from 'react';
import { ClinicInformationSection } from '../features/onboarding/components/ClinicInformationSection';
import { ExpertiseSection } from '../features/onboarding/components/ExpertiseSection';
import { OnboardingActions } from '../features/onboarding/components/OnboardingActions';
import { OnboardingHeader } from '../features/onboarding/components/OnboardingHeader';
import { PersonalDetailsSection } from '../features/onboarding/components/PersonalDetailsSection';
import { RegistrationProgress } from '../features/onboarding/components/RegistrationProgress';
import { SmartTagsSection } from '../features/onboarding/components/SmartTagsSection';
import { saveExpertise, savePersonalDetails, saveTags } from '../features/onboarding/services/onboardingService';
import { registerReceptionist } from '../features/auth/services/authService';

const STEP_INDEX = {
  'personal-details': 1,
  expertise: 2,
  'smart-tags': 4,
};

const STATE_OPTIONS = {
  WB: 'West Bengal',
  MH: 'Maharashtra',
  DL: 'Delhi',
  KA: 'Karnataka',
};

export function OnboardingPage({ step = 'personal-details', userSession, onBack, onNext, onComplete }) {
  const progressStep = STEP_INDEX[step] || 1;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [smartTags, setSmartTags] = useState([]);

  // Receptionist setup
  const [hasReceptionist, setHasReceptionist] = useState(false);
  const [recName, setRecName] = useState('');
  const [recPhone, setRecPhone] = useState('');
  const [recPassword, setRecPassword] = useState('');
  const [recError, setRecError] = useState('');
  const [recSuccess, setRecSuccess] = useState('');
  const [recSubmitting, setRecSubmitting] = useState(false);

  const handleRegisterReceptionist = async () => {
    if (!recName.trim() || !recPhone.trim() || !recPassword) {
      setRecError('Please fill all receptionist fields.');
      return;
    }
    if (recPhone.replace(/\D/g, '').length < 10) {
      setRecError('Enter a valid 10-digit phone number.');
      return;
    }
    if (recPassword.length < 4) {
      setRecError('Password must be at least 4 characters.');
      return;
    }
    setRecError('');
    setRecSuccess('');
    setRecSubmitting(true);
    try {
      await registerReceptionist({
        doctorUserUid: userSession.userUid,
        name: recName.trim(),
        phone: recPhone.replace(/\D/g, '').slice(0, 10),
        password: recPassword,
      });
      setRecSuccess('Receptionist account created successfully!');
    } catch (err) {
      setRecError(err.message || 'Failed to create receptionist account.');
    } finally {
      setRecSubmitting(false);
    }
  };

  const [personalDetails, setPersonalDetails] = useState({
    fullName: userSession?.username || '',
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

  const isPersonalDetailsValid = useMemo(() => {
    const contactDigits = personalDetails.clinicContactNumber.replace(/\D/g, '').slice(0, 10);
    return Boolean(
      personalDetails.fullName.trim()
      && personalDetails.medicalRegistrationNumber.trim()
      && personalDetails.dateOfBirth
      && personalDetails.qualification.trim()
      && personalDetails.clinicName.trim()
      && personalDetails.address.trim()
      && personalDetails.city.trim()
      && personalDetails.state.trim()
      && contactDigits.length === 10,
    );
  }, [personalDetails]);

  const handlePersonalFieldChange = (key, value) => {
    setErrorMessage('');
    setPersonalDetails((prev) => ({
      ...prev,
      [key]: key === 'clinicContactNumber' ? value.replace(/\D/g, '').slice(0, 10) : value,
    }));
  };

  const handlePersonalNext = async () => {
    if (!userSession?.userUid) {
      setErrorMessage('Session expired. Please register again.');
      return;
    }
    if (!isPersonalDetailsValid) {
      setErrorMessage('Please fill all required fields before continuing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await savePersonalDetails({
        userUid: userSession.userUid,
        fullName: personalDetails.fullName.trim(),
        medicalRegistrationNumber: personalDetails.medicalRegistrationNumber.trim(),
        dateOfBirth: personalDetails.dateOfBirth,
        qualification: personalDetails.qualification.trim(),
        clinicName: personalDetails.clinicName.trim(),
        address: personalDetails.address.trim(),
        city: personalDetails.city.trim(),
        state: STATE_OPTIONS[personalDetails.state] || personalDetails.state,
        clinicContactNumber: personalDetails.clinicContactNumber.replace(/\D/g, '').slice(0, 10),
        clinicLogo: personalDetails.clinicLogo || null,
        digitalSignature: personalDetails.digitalSignature || null,
      });
      onNext?.();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save personal details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpertiseNext = async () => {
    if (!userSession?.userUid) {
      setErrorMessage('Session expired. Please register again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await saveExpertise({
        userUid: userSession.userUid,
        expertises: selectedExpertise,
      });
      onNext?.();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save expertise.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!userSession?.userUid) {
      setErrorMessage('Session expired. Please register again.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    try {
      await saveTags({
        userUid: userSession.userUid,
        tags: [],
        smartTags: smartTags,
      });
      onComplete?.();
    } catch (error) {
      setErrorMessage(error.message || 'Unable to save smart tags.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#f6f8f7] min-h-screen flex flex-col font-display text-[#121715]">
      <OnboardingHeader />

      <main className="flex-grow w-full max-w-[1024px] mx-auto px-4 sm:px-6 py-8">
        <RegistrationProgress step={progressStep} />

        {step === 'personal-details' ? (
          <form className="space-y-12 pb-20" onSubmit={(e) => e.preventDefault()}>
            <PersonalDetailsSection values={personalDetails} onChange={handlePersonalFieldChange} />
            <ClinicInformationSection values={personalDetails} onChange={handlePersonalFieldChange} />
            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
            <OnboardingActions onNext={handlePersonalNext} isSubmitting={isSubmitting} />
          </form>
        ) : step === 'expertise' ? (
          <>
            {errorMessage ? <p className="text-sm text-red-600 mb-4">{errorMessage}</p> : null}
            <ExpertiseSection
              selected={selectedExpertise}
              onSelectionChange={setSelectedExpertise}
              onBack={onBack}
              onNext={handleExpertiseNext}
            />
          </>
        ) : (
          <>
            {errorMessage ? <p className="text-sm text-red-600 mb-4">{errorMessage}</p> : null}
            <SmartTagsSection onBack={onBack} onProceed={handleComplete} smartTags={smartTags} onSmartTagsChange={setSmartTags} />

            {/* Receptionist Setup Section */}
            <div className="mt-12 bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1f7a5c]/10 text-[#1f7a5c]">
                  <span className="material-symbols-outlined text-[22px]">person_add</span>
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Receptionist Setup</h3>
                  <p className="text-sm text-slate-500">Optional: Add a receptionist to manage your patient queue.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <span className="text-sm font-medium text-slate-700">Do you have a receptionist?</span>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasReceptionist ? 'bg-[#1f7a5c]' : 'bg-slate-300'}`}
                  onClick={() => { setHasReceptionist(!hasReceptionist); setRecError(''); setRecSuccess(''); }}
                >
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${hasReceptionist ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-semibold text-slate-500">{hasReceptionist ? 'Yes' : 'No'}</span>
              </div>

              {hasReceptionist && (
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <p className="text-xs text-slate-500">Your receptionist can log in with their phone number and password to manage the patient queue.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] outline-none"
                        placeholder="Receptionist name"
                        value={recName}
                        onChange={(e) => { setRecName(e.target.value); setRecError(''); }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        inputMode="numeric"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] outline-none"
                        placeholder="9876543210"
                        value={recPhone}
                        onChange={(e) => { setRecPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setRecError(''); }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] outline-none"
                        placeholder="Min 4 characters"
                        value={recPassword}
                        onChange={(e) => { setRecPassword(e.target.value); setRecError(''); }}
                      />
                    </div>
                  </div>
                  {recError ? <p className="text-xs text-red-600">{recError}</p> : null}
                  {recSuccess ? <p className="text-xs text-emerald-600 font-semibold">{recSuccess}</p> : null}
                  <button
                    type="button"
                    className="h-10 px-5 rounded-lg bg-[#1f7a5c] text-white text-sm font-semibold hover:bg-[#165942] transition-colors disabled:opacity-50"
                    onClick={handleRegisterReceptionist}
                    disabled={recSubmitting || !!recSuccess}
                  >{recSubmitting ? 'Creating...' : recSuccess ? 'Created' : 'Create Receptionist Account'}</button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
