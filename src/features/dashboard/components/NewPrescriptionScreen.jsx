import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { animate, motion, AnimatePresence, useIsPresent } from 'framer-motion';
import { getOnboarding } from '../../onboarding/services/onboardingService';
import { createPrescription, lookupPatientByPhone, sendPrescriptionWhatsApp } from '../services/prescriptionService';
import { useMedicineSearch } from '../../../hooks/useMedicineSearch';
import { downloadPrescriptionPdf } from '../../../lib/pdfExport';
import { QRCodeSVG } from 'qrcode.react';
import { LANGUAGES, t, translateFrequency, translateDuration } from '../../../lib/prescriptionTranslations';
import { translateLines } from '../services/translationService';
import iconPill from '../../../assets/med-icons/pill.png';
import iconSyrup from '../../../assets/med-icons/syrup.png';
import iconSyringe from '../../../assets/med-icons/syringe.png';
import iconOintment from '../../../assets/med-icons/ointment.png';
import iconEyedrop from '../../../assets/med-icons/eyedrop.png';

const normalizePhone = (value) => value.replace(/\D/g, '').slice(0, 10);


function normalizeTagName(value) {
  return String(value || '').replace(/^#/, '').trim();
}

function normalizeQty(value) {
  const text = String(value || '').trim();
  const match = text.match(/\d+/);
  return match ? match[0] : '';
}

function normalizeMedicationRow(med) {
  if (!med) return med;
  return {
    ...med,
    qty: normalizeQty(med.qty),
  };
}

function parseMedication(raw, index) {
  const line = String(raw || '').trim();
  if (!line) {
    return null;
  }

  const bracketMatch = line.match(/^(.+?)\s*(?:\((.*)\))?$/);
  const name = bracketMatch ? bracketMatch[1].trim() : line;
  const details = bracketMatch?.[2] || '';

  let dosage = '';
  let timing = 'Select';
  let days = '';
  let notes = '';

  if (details) {
    const parts = details.split(',').map((p) => p.trim());
    const extraNotes = [];
    parts.forEach((p) => {
      if (/^(After|Before|With)\s+Food$/i.test(p)) {
        timing = p;
      } else if (/^\d+\s*days?$/i.test(p)) {
        days = p.replace(/\s*days?$/i, '');
      } else if (!dosage && /\d+\s?(mg|ml|g|mcg|iu)/i.test(p)) {
        dosage = p;
      } else if (p) {
        extraNotes.push(p);
      }
    });
    notes = extraNotes.join(', ');
  }

  return {
    id: Date.now() + index,
    name,
    form: 'Medicine',
    qty: '1',
    m: true,
    a: false,
    n: false,
    days: days || '',
    timing,
    notes,
    dosage,
  };
}

function extractAdviceLines(text) {
  return String(text || '')
    .split(/\n|\.|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
}

function splitStoredLines(text) {
  return String(text || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function createRowId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildMedicationFromName(name) {
  return {
    id: Date.now() + Math.floor(Math.random() * 10000),
    name,
    form: 'Medicine',
    qty: '1',
    m: true,
    a: false,
    n: false,
    days: '5',
    timing: 'Select',
    notes: '',
    dosage: '',
  };
}

const DRAFT_KEY = 'ep_prescription_draft';

function loadDraft(userUid) {
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY}_${userUid}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(userUid, data) {
  try { localStorage.setItem(`${DRAFT_KEY}_${userUid}`, JSON.stringify(data)); } catch {}
}

export function clearPrescriptionDraft(userUid) {
  try { localStorage.removeItem(`${DRAFT_KEY}_${userUid}`); } catch {}
}

function ExpandableAdviceRow({ children, onClick }) {
  const isPresent = useIsPresent();
  const smoothSpring = {
    type: 'spring',
    stiffness: 320,
    damping: 38,
    mass: 0.95,
    restDelta: 0.2,
    restSpeed: 0.5,
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 6 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{
        opacity: { duration: 0.22, ease: 'easeOut' },
        height: smoothSpring,
        layout: smoothSpring,
        marginBottom: smoothSpring,
      }}
      className="overflow-hidden last:mb-0"
      style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
      onClick={onClick}
    >
      {children}
    </motion.li>
  );
}

function AnimatedMedicationRow({ children, isFirst, expandOnEnter }) {
  const isPresent = useIsPresent();
  const smoothSpring = {
    type: 'spring',
    stiffness: 320,
    damping: 38,
    mass: 0.95,
    restDelta: 0.2,
    restSpeed: 0.5,
  };

  return (
    <motion.div
      layout
      initial={expandOnEnter ? { opacity: 0, height: 0 } : false}
      animate={expandOnEnter ? { opacity: 1, height: 'auto' } : undefined}
      exit={{ opacity: 0, height: 0 }}
      transition={{
        opacity: { duration: 0.2, ease: 'easeOut' },
        height: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
        layout: smoothSpring,
      }}
      className={`overflow-hidden ${isFirst ? '' : 'border-t border-[#eef2f4]'}`}
      style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
    >
      {children}
    </motion.div>
  );
}

function MedicationRowContent({ med, onChange, onDelete }) {
  return (
    <div className="grid grid-cols-[minmax(200px,1.5fr)_74px_150px_88px_132px_44px] gap-0 items-center px-5 py-3.5">
      <div className="pr-3">
        <div className="text-[15px] font-black tracking-tight text-[#0d6f68] leading-tight">{med.name}</div>
        {med.dosage ? (
          <div className="mt-1 text-xs font-medium uppercase tracking-[0.06em] text-slate-500">{med.dosage}</div>
        ) : null}
      </div>

      <div className="pr-2">
        <input
          className="w-12 rounded-lg border border-transparent bg-white px-2 py-1 text-[15px] font-medium text-slate-800 focus:border-[#0d6f68] focus:ring-[#0d6f68]"
          type="text"
          inputMode="numeric"
          value={med.qty || ''}
          onChange={(e) => onChange(med.id, 'qty', e.target.value)}
          placeholder="10"
        />
      </div>

      <div className="pr-2">
        <div className="flex items-center gap-1.5">
          {[
            ['m', med.m],
            ['a', med.a],
            ['n', med.n],
          ].map(([key, active]) => (
            <button
              key={key}
              type="button"
              className={`h-7 min-w-8 rounded-lg px-2 text-[12px] font-bold transition-colors ${
                active ? 'bg-[#bfe9df] text-[#315f5a]' : 'bg-[#e8edf2] text-slate-700 hover:bg-[#dce5ec]'
              }`}
              onClick={() => onChange(med.id, key, !active)}
              aria-label={`Toggle ${String(key).toUpperCase()} dose`}
            >
              {active ? '1' : '0'}
            </button>
          ))}
        </div>
      </div>

      <div className="pr-2">
        <div className="flex items-center gap-1.5">
          <input
            className="w-11 rounded-lg border border-transparent bg-white px-1.5 py-1 text-[15px] font-medium text-slate-800 focus:border-[#0d6f68] focus:ring-[#0d6f68]"
            type="text"
            inputMode="numeric"
            value={med.days}
            onChange={(e) => onChange(med.id, 'days', e.target.value.replace(/\D/g, '').slice(0, 3))}
            placeholder="5"
          />
        </div>
      </div>

      <div className="pr-2">
        <select
          className="w-full rounded-full border border-transparent bg-[#e8edf2] px-3 py-1 text-[12px] font-semibold text-slate-700 focus:border-[#0d6f68] focus:ring-[#0d6f68]"
          value={med.timing}
          onChange={(e) => onChange(med.id, 'timing', e.target.value)}
        >
          <option>Select</option>
          <option>After Food</option>
          <option>Before Food</option>
          <option>With Food</option>
        </select>
      </div>

      <div className="flex justify-end">
        <button
          className="rounded-full p-1 text-[#b8c6c0] transition-colors hover:bg-red-50 hover:text-red-500"
          type="button"
          onClick={() => onDelete(med.id)}
          aria-label={`Delete ${med.name}`}
        >
          <span className="material-symbols-outlined text-[22px]">delete</span>
        </button>
      </div>
    </div>
  );
}

export function NewPrescriptionScreen({ onPreview, userSession, initialPatient }) {
  const hasReceptionist = true; // TODO: derive from session/config
  const draft = useRef(loadDraft(userSession?.userUid)).current;

  const [patientForm, setPatientForm] = useState(() => {
    // If navigated from "Prescribe" button with patient data, auto-populate
    if (initialPatient) {
      return {
        fullName: initialPatient.fullName || initialPatient.name || '',
        age: initialPatient.age ? String(initialPatient.age) : '',
        gender: initialPatient.gender || 'Male',
        phone: initialPatient.phone || '',
        dateOfBirth: initialPatient.dateOfBirth || '',
        bloodGroup: initialPatient.bloodGroup || '',
        isAutoFilled: true,
      };
    }
    return draft?.patientForm || {
      fullName: '',
      age: '',
      gender: 'Male',
      phone: '',
      dateOfBirth: '',
      bloodGroup: '',
      isAutoFilled: false,
    };
  });

  const [smartTags, setSmartTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(draft?.selectedTags || []);
  const [medications, setMedications] = useState(() => (draft?.medications || []).map(normalizeMedicationRow));
  const medicationInsertModeRef = useRef('manual');
  const previousMedicationCountRef = useRef((draft?.medications || []).length);
  const previousMedicationIdsRef = useRef((draft?.medications || []).map((med) => med.id));
  const firstMedicationDeleteTimeoutRef = useRef(null);
  const prescriptionRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const medicineSearchInputRef = useRef(null);
  const [availableMedicineTags, setAvailableMedicineTags] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nutritionByTag, setNutritionByTag] = useState(draft?.nutritionByTag || {});
  const [lifestyleByTag, setLifestyleByTag] = useState(draft?.lifestyleByTag || {});
  const [customAdvice, setCustomAdvice] = useState(draft?.customAdvice || '');
  const [customAdviceInput, setCustomAdviceInput] = useState('');
  const [editingAdviceDraft, setEditingAdviceDraft] = useState('');
  const [editingAdviceIndex, setEditingAdviceIndex] = useState(null);
  const adviceRowIdsRef = useRef(splitStoredLines(draft?.customAdvice || '').map(() => createRowId('advice')));
  const [investigations, setInvestigations] = useState(draft?.investigations || []);
  const [investigationSearch, setInvestigationSearch] = useState('');
  const [customExercise, setCustomExercise] = useState(draft?.customExercise || '');
  const [customExerciseInput, setCustomExerciseInput] = useState('');
  const [editingExerciseDraft, setEditingExerciseDraft] = useState('');
  const [editingExerciseIndex, setEditingExerciseIndex] = useState(null);
  const [isExerciseExpanded, setIsExerciseExpanded] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);
  const [lookupStatus, setLookupStatus] = useState('idle');
  const [lookupMessage, setLookupMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [savedPrescriptionUid, setSavedPrescriptionUid] = useState(null);
  const [nativeLang, setNativeLang] = useState(null);
  const [translatedNutrition, setTranslatedNutrition] = useState([]);
  const [translatedExercise, setTranslatedExercise] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const rxRef = useRef(null);

  useEffect(() => {
    if (!nativeLang) {
      rxRef._native1 = null; rxRef._native2 = null;
      setTranslatedNutrition([]);
      setTranslatedExercise([]);
    }
  }, [nativeLang]);

  useEffect(() => () => {
    if (firstMedicationDeleteTimeoutRef.current) {
      clearTimeout(firstMedicationDeleteTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    previousMedicationCountRef.current = medications.length;
    previousMedicationIdsRef.current = medications.map((med) => med.id);
  }, [medications]);

  useEffect(() => {
    if (!userSession?.userUid) return;
    saveDraft(userSession.userUid, { patientForm, selectedTags, medications, investigations, nutritionByTag, lifestyleByTag, customAdvice, customExercise });
  }, [userSession?.userUid, patientForm, selectedTags, medications, investigations, nutritionByTag, lifestyleByTag, customAdvice, customExercise]);

  useEffect(() => {
    async function loadTags() {
      if (!userSession?.userUid) {
        setSmartTags([]);
        return;
      }

      setLoadingTags(true);
      try {
        const onboarding = await getOnboarding(userSession.userUid);
        setSmartTags(onboarding?.smartTags || []);
        setDoctorProfile(onboarding?.personalDetails || null);
      } catch {
        setSmartTags([]);
      } finally {
        setLoadingTags(false);
      }
    }

    loadTags();
  }, [userSession?.userUid]);

  const adviceBullets = useMemo(() => {
    const bullets = [];
    for (const [tag, text] of Object.entries(nutritionByTag)) {
      extractAdviceLines(text).forEach((line) => bullets.push({ tag, type: 'nutrition', text: line }));
    }
    for (const [tag, text] of Object.entries(lifestyleByTag)) {
      extractAdviceLines(text).forEach((line) => bullets.push({ tag, type: 'lifestyle', text: line }));
    }
    return bullets;
  }, [nutritionByTag, lifestyleByTag]);

  const nutritionAdvice = useMemo(() => Object.values(nutritionByTag).filter(Boolean).join('; '), [nutritionByTag]);
  const lifestyleAdvice = useMemo(() => Object.values(lifestyleByTag).filter(Boolean).join('; '), [lifestyleByTag]);

  useEffect(() => {
    if (!nativeLang || !showPreview) return;

    const nutritionLines = adviceBullets.filter((b) => b.type === 'nutrition').map((b) => b.text);
    const exerciseLines = adviceBullets.filter((b) => b.type === 'lifestyle').map((b) => b.text);
    const allNut = [
      ...nutritionLines,
      ...(customAdvice ? customAdvice.split('\n').map((l) => l.trim()).filter(Boolean) : []),
    ];
    const allEx = [
      ...exerciseLines,
      ...(customExercise ? customExercise.split('\n').map((l) => l.trim()).filter(Boolean) : []),
    ];

    let cancelled = false;
    async function doTranslate() {
      setIsTranslating(true);
      try {
        const [tNut, tEx] = await Promise.all([
          allNut.length > 0 ? translateLines(allNut, nativeLang) : Promise.resolve([]),
          allEx.length > 0 ? translateLines(allEx, nativeLang) : Promise.resolve([]),
        ]);
        if (!cancelled) {
          setTranslatedNutrition(tNut);
          setTranslatedExercise(tEx);
        }
      } catch (err) {
        console.warn('Advice translation failed, falling back to English:', err.message);
        if (!cancelled) {
          setTranslatedNutrition(allNut);
          setTranslatedExercise(allEx);
        }
      } finally {
        if (!cancelled) setIsTranslating(false);
      }
    }
    doTranslate();
    return () => { cancelled = true; };
  }, [nativeLang, showPreview, adviceBullets, customAdvice, customExercise]);

  const { results: medicineSearchResults, loading: medicineSearchLoading } = useMedicineSearch(searchTerm, 10);

  const filteredSearchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const activeNames = new Set(medications.map((med) => med.name.toLowerCase()));
    return medicineSearchResults.filter((name) => !activeNames.has(name.toLowerCase()));
  }, [medicineSearchResults, searchTerm, medications]);

  useEffect(() => {
    async function fetchPatientLookup() {
      if (patientForm.phone.length !== 10) {
        setLookupStatus('idle');
        setLookupMessage('');
        return;
      }

      setLookupStatus('loading');
      setLookupMessage('Checking patient record...');

      try {
        const result = await lookupPatientByPhone(patientForm.phone);
        setPatientForm((prev) => ({
          ...prev,
          fullName: result?.fullName || '',
          age: result?.age ? String(result.age) : '',
          gender: result?.gender || 'Male',
          dateOfBirth: result?.dateOfBirth || '',
          bloodGroup: result?.bloodGroup || '',
          isAutoFilled: true,
        }));
        setLookupStatus('found');
        setLookupMessage('Existing patient found. Details auto-filled.');
      } catch (error) {
        const isNotFound = error.message?.toLowerCase().includes('not found');
        if (isNotFound) {
          setPatientForm((prev) => ({
            ...prev,
            fullName: '',
            age: '',
            gender: 'Male',
            dateOfBirth: '',
            bloodGroup: '',
            isAutoFilled: false,
          }));
          setLookupStatus('not_found');
          setLookupMessage('Patient not found. Please enter details.');
          return;
        }
        setLookupStatus('error');
        setLookupMessage(error.message || 'Unable to check patient now.');
      }
    }

    fetchPatientLookup();
  }, [patientForm.phone]);

  const handlePhoneChange = (event) => {
    const phone = normalizePhone(event.target.value);
    setPatientForm((prev) => ({ ...prev, phone }));
  };

  const applyTag = (tagData) => {
    const normalizedName = normalizeTagName(tagData?.tagName);
    const alreadySelected = selectedTags.includes(normalizedName);

    if (alreadySelected) {
      setSelectedTags((prev) => prev.filter((t) => t !== normalizedName));
      const tagMedNames = new Set(
        (tagData?.medications || []).map((line) => {
          const parsed = parseMedication(line, 0);
          return parsed?.name?.toLowerCase();
        }).filter(Boolean)
      );
      setMedications((prev) => prev.filter((med) => !tagMedNames.has(med.name.toLowerCase())));
      setNutritionByTag((prev) => { const next = { ...prev }; delete next[normalizedName]; return next; });
      setLifestyleByTag((prev) => { const next = { ...prev }; delete next[normalizedName]; return next; });
      return;
    }

    setSelectedTags((prev) => [...prev, normalizedName]);

    const newMeds = (tagData?.medications || [])
      .map((line, index) => parseMedication(line, medications.length + index))
      .filter(Boolean);

    const existingNames = new Set(medications.map((m) => m.name.toLowerCase()));
    const uniqueNewMeds = newMeds.filter((m) => !existingNames.has(m.name.toLowerCase()));

    if (uniqueNewMeds.length) {
      medicationInsertModeRef.current = 'tag';
    }
    setMedications((prev) => [...prev, ...uniqueNewMeds]);
    setAvailableMedicineTags([]);
    if (tagData?.nutritionAdvice) setNutritionByTag((prev) => ({ ...prev, [normalizedName]: tagData.nutritionAdvice }));
    if (tagData?.lifestyleAdvice) setLifestyleByTag((prev) => ({ ...prev, [normalizedName]: tagData.lifestyleAdvice }));

    if (uniqueNewMeds.length) {
      setTimeout(() => {
        const el = prescriptionRef.current;
        const container = scrollContainerRef.current;
        if (!el || !container) return;
        const elRect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const target = container.scrollTop + (elRect.top - containerRect.top) - 20;
        animate(container.scrollTop, target, {
          duration: 0.8,
          ease: [0.25, 0.1, 0.25, 1.0],
          onUpdate: (v) => { container.scrollTop = v; },
        });
      }, 200);
    }
  };

  const handleMedicationChange = (id, key, value) => {
    setMedications((prev) => prev.map((med) => {
      if (med.id !== id) return med;
      return {
        ...med,
        [key]: key === 'qty' ? normalizeQty(value) : value,
      };
    }));
  };

  const handleDeleteMedication = (id) => {
    const target = medications.find((med) => med.id === id);
    const targetName = target?.name?.trim();
    const removeMedication = () => {
      setMedications((prev) => prev.filter((med) => med.id !== id));
    };

    if (!targetName) {
      removeMedication();
      return;
    }

    if (!availableMedicineTags.length) {
      removeMedication();
      firstMedicationDeleteTimeoutRef.current = setTimeout(() => {
        setAvailableMedicineTags((tags) => (tags.includes(targetName) ? tags : [...tags, targetName]));
        firstMedicationDeleteTimeoutRef.current = null;
      }, 260);
      return;
    }

    setAvailableMedicineTags((tags) => (tags.includes(targetName) ? tags : [...tags, targetName]));
    removeMedication();
  };

  const previousMedicationIds = previousMedicationIdsRef.current;
  const isTagEnteringFromEmpty =
    previousMedicationCountRef.current === 0 &&
    medications.length > 0 &&
    medicationInsertModeRef.current === 'tag';

  const addMedicineByName = (name) => {
    if (!name.trim()) {
      return;
    }

    const exists = medications.some((med) => med.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      return;
    }

    medicationInsertModeRef.current = 'manual';
    setMedications((prev) => [...prev, buildMedicationFromName(name.trim())]);
    setAvailableMedicineTags((prev) => prev.filter((tag) => tag.toLowerCase() !== name.toLowerCase()));
  };

  const handleAddCustomFromSearch = () => {
    const custom = searchTerm.trim();
    if (!custom) {
      return;
    }
    addMedicineByName(custom);
    setSearchTerm('');
  };

  const addCustomAdviceLine = (line) => {
    const nextLine = String(line || '').trim();
    if (!nextLine) return;
    const lines = splitStoredLines(customAdvice);
    adviceRowIdsRef.current = [...adviceRowIdsRef.current, createRowId('advice')];
    setCustomAdvice([...lines, nextLine].join('\n'));
  };

  const updateCustomAdviceLine = (index, line) => {
    const nextLine = String(line || '').trim();
    if (!nextLine) return;
    const lines = splitStoredLines(customAdvice);
    lines[index] = nextLine;
    setCustomAdvice(lines.join('\n'));
  };

  const removeCustomAdviceLine = (index) => {
    const lines = splitStoredLines(customAdvice);
    adviceRowIdsRef.current = adviceRowIdsRef.current.filter((_, idx) => idx !== index);
    setCustomAdvice(lines.filter((_, idx) => idx !== index).join('\n'));
  };

  const toggleQuickAdviceSentence = (sentence) => {
    const lines = splitStoredLines(customAdvice);
    const existingIndex = lines.findIndex((line) => line === sentence);
    if (existingIndex >= 0) {
      adviceRowIdsRef.current = adviceRowIdsRef.current.filter((_, idx) => idx !== existingIndex);
      setCustomAdvice(lines.filter((_, idx) => idx !== existingIndex).join('\n'));
      return;
    }

    adviceRowIdsRef.current = [...adviceRowIdsRef.current, createRowId('advice')];
    setCustomAdvice([...lines, sentence].join('\n'));
  };

  const toggleInvestigation = (name) => {
    const normalized = String(name || '').trim();
    if (!normalized) return;
    setInvestigations((prev) =>
      prev.includes(normalized) ? prev.filter((item) => item !== normalized) : [...prev, normalized]
    );
  };

  const removeInvestigation = (name) => {
    setInvestigations((prev) => prev.filter((item) => item !== name));
  };

  const buildPrescriptionPayload = () => ({
    doctorUserUid: userSession.userUid,
    patientName: patientForm.fullName.trim(),
    patientPhone: patientForm.phone,
    patientAge: Number(patientForm.age || 0),
    patientGender: patientForm.gender || 'Male',
    patientDateOfBirth: patientForm.dateOfBirth || null,
    patientBloodGroup: patientForm.bloodGroup || null,
    diagnosis: selectedTags.join(', ') || null,
    symptoms: [],
    medications: medications.map((med) => ({
      name: med.name,
      dosage: med.qty || med.dosage || null,
      frequency: `${med.m ? 1 : 0}-${med.a ? 1 : 0}-${med.n ? 1 : 0}`,
      duration: med.days ? `${med.days} days` : null,
      instructions: [med.timing !== 'Select' ? med.timing : null, med.notes || null].filter(Boolean).join(' | ') || null,
    })),
    nutrientsAdvice: [nutritionAdvice, customAdvice].filter(Boolean).join('; ') || null,
    exerciseAdvice: [lifestyleAdvice, customExercise].filter(Boolean).join('; ') || null,
    otherAdvice: null,
  });

  const savePrescriptionForQR = async () => {
    if (savedPrescriptionUid) return savedPrescriptionUid;
    if (!userSession?.userUid || !patientForm.fullName.trim() || !medications.length) return null;
    try {
      const created = await createPrescription(buildPrescriptionPayload());
      setSavedPrescriptionUid(created.prescriptionUid);
      return created.prescriptionUid;
    } catch {
      return null;
    }
  };

  const handleSendWhatsApp = async () => {
    if (!userSession?.userUid) {
      setSendMessage('Session expired. Please login again.');
      return;
    }
    if (patientForm.phone.length !== 10 || !patientForm.fullName.trim()) {
      setSendMessage('Enter patient phone and name before sending.');
      return;
    }
    if (!medications.length) {
      setSendMessage('Select a tag or add medicines before sending.');
      return;
    }

    setIsSending(true);
    setSendMessage('');
    try {
      let uid = savedPrescriptionUid;
      if (!uid) {
        const created = await createPrescription(buildPrescriptionPayload());
        uid = created.prescriptionUid;
        setSavedPrescriptionUid(uid);
      }

      await sendPrescriptionWhatsApp(uid);
      clearPrescriptionDraft(userSession?.userUid);
      setSendMessage('Prescription sent to WhatsApp and patient record saved.');
      onPreview?.();
    } catch (error) {
      setSendMessage(error.message || 'Unable to send prescription.');
    } finally {
      setIsSending(false);
    }
  };

  if (showPreview) {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const nutritionBullets = adviceBullets.filter((b) => b.type === 'nutrition').map((b) => b.text);
    const exerciseBullets = adviceBullets.filter((b) => b.type === 'lifestyle').map((b) => b.text);
    const allNutrition = [
      ...nutritionBullets,
      ...(customAdvice ? customAdvice.split('\n').map((l) => l.trim()).filter(Boolean) : []),
    ];
    const allExercise = [
      ...exerciseBullets,
      ...(customExercise ? customExercise.split('\n').map((l) => l.trim()).filter(Boolean) : []),
    ];
    const allAdvice = [...allNutrition, ...allExercise];
    const clinicName = doctorProfile?.clinicName || 'Clinic';
    const clinicAddr = [doctorProfile?.address, doctorProfile?.city, doctorProfile?.state].filter(Boolean).join(', ');
    const clinicPhone = doctorProfile?.clinicContactNumber || '';
    const drName = doctorProfile?.fullName || 'Doctor';
    const drQual = doctorProfile?.qualification || '';
    const clinicLogo = doctorProfile?.clinicLogo || (() => { try { return localStorage.getItem(`ep_logo_${userSession?.userUid}`) || ''; } catch { return ''; } })();
    const digitalSignature = doctorProfile?.digitalSignature || (() => { try { return localStorage.getItem(`ep_sig_${userSession?.userUid}`) || ''; } catch { return ''; } })();

    const hasAdvice = allNutrition.length > 0 || allExercise.length > 0;

    // ── Page split rules ──────────────────────────────────────────────
    // Hard rule based on observed fit:
    //   ≤3 meds + advice → 1 page
    //   >3 meds + advice → 2 pages (all meds page 1, all advice page 2)
    //   Meds-only overflow → split meds (English >10, Native >8)
    // ─────────────────────────────────────────────────────────────────
    const MED_ADVICE_MAX = 3;   // max meds that fit alongside advice on one page
    const E_MAX_MEDS     = 10;  // max meds on page 1 (English, no advice)
    const N_MAX_MEDS     = 8;   // max meds on page 1 (Native, no advice)

    // English
    const eMedsOverflow   = medications.length > E_MAX_MEDS;
    const eAdviceOverflow = hasAdvice && medications.length > MED_ADVICE_MAX;
    const needsTwoPages   = eMedsOverflow || eAdviceOverflow;
    const page1Meds = eMedsOverflow ? medications.slice(0, E_MAX_MEDS) : medications;
    const page2Meds = eMedsOverflow ? medications.slice(E_MAX_MEDS) : [];

    // Native
    const nMedsOverflow       = medications.length > N_MAX_MEDS;
    const nAdviceOverflow     = hasAdvice && medications.length > MED_ADVICE_MAX;
    const nativeNeedsTwoPages = nMedsOverflow || nAdviceOverflow;
    const nativePage1Meds = nMedsOverflow ? medications.slice(0, N_MAX_MEDS) : medications;
    const nativePage2Meds = nMedsOverflow ? medications.slice(N_MAX_MEDS) : [];

    const RxHeader = () => (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4" style={{ borderBottom: '4px solid #357f62' }}>
        <div className="flex items-center gap-4">
          {clinicLogo ? (
            <div className="shrink-0 flex items-center justify-center">
              <img src={clinicLogo} alt="Clinic Logo" className="max-h-[80px] w-auto object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-[#357f62]/10 rounded-xl flex items-center justify-center text-[#357f62] shrink-0">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>medical_services</span>
            </div>
          )}
          <div>
            <h1 className="text-[31px] font-black tracking-tight text-slate-900 uppercase leading-none" style={{ fontFamily: 'Poppins, sans-serif' }}>{clinicName}</h1>
            <h2 className="text-[23px] font-semibold text-[#357f62]" style={{ fontFamily: 'Poppins, sans-serif' }}>Dr. {drName}{drQual ? `, ${drQual}` : ''}</h2>
          </div>
        </div>
        <div className="text-right text-[17px]" style={{ fontFamily: 'Inter, sans-serif' }}>
          {clinicAddr && (
            <div className="flex items-center justify-end gap-2 text-slate-600">
              <span>{clinicAddr}</span>
              <span className="material-symbols-outlined text-[#357f62] text-[17px]">location_on</span>
            </div>
          )}
          {clinicPhone && (
            <div className="flex items-center justify-end gap-2 text-slate-600">
              <span>{clinicPhone}</span>
              <span className="material-symbols-outlined text-[#357f62] text-[17px]">call</span>
            </div>
          )}
        </div>
      </div>
    );

    const qrUrl = savedPrescriptionUid
      ? `${window.location.origin}/prescription/${savedPrescriptionUid}`
      : null;

    const RxFooter = () => (
      <div className="px-6 pt-3 pb-4">
        <div className="flex items-end justify-between">
          {/* QR Code - left side */}
          <div className="flex flex-col items-center ml-10 mb-4">
            {qrUrl ? (
              <>
                <QRCodeSVG value={qrUrl} size={120} level="M" bgColor="#ffffff" fgColor="#1e293b" />
                <p className="text-[10px] text-slate-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>Scan for details</p>
              </>
            ) : (
              <div className="w-[120px] h-[120px]" />
            )}
          </div>
          {/* Signature - right side */}
          <div className="w-64 flex flex-col items-end">
            {digitalSignature ? (
              <div className="w-[200px] h-[80px] flex items-center justify-center mb-2">
                <img src={digitalSignature} alt="Digital Signature" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="h-[80px] w-[200px]" />
            )}
            <div className="w-full border-b-2 border-slate-900 mb-2" />
            <div className="text-center w-full">
              <p className="text-[23px] font-bold text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>Dr. {drName}</p>
              {drQual && <p className="text-[15px] text-slate-500 mt-0.5" style={{ fontFamily: 'Inter, sans-serif' }}>{drQual}</p>}
            </div>
          </div>
        </div>
        <div className="mt-4 text-center pt-3">
          <p className="text-[#357f62] font-semibold text-[17px] tracking-wide uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>Your Health, Our Commitment</p>
          <p className="text-[13px] text-slate-400 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>This prescription is generated by EasyPrescribe</p>
        </div>
      </div>
    );

    const PatientInfo = () => (
      <div className="rx-section-patient mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#357f62] text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <h3 className="text-[19px] font-bold uppercase tracking-widest text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>Patient Information</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-slate-400 uppercase">Patient Name</p>
            <p className="text-[23px] font-bold pb-1">{patientForm.fullName || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-slate-400 uppercase">Age / Gender</p>
            <p className="text-[23px] font-semibold pb-1">{patientForm.age || '—'} / {patientForm.gender}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-slate-400 uppercase">Date</p>
            <p className="text-[23px] font-semibold pb-1">{today}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[15px] font-bold text-slate-400 uppercase">Patient ID</p>
            <p className="text-[23px] font-semibold pb-1">{patientForm.phone || '—'}</p>
          </div>
        </div>
      </div>
    );

    const getMedIcon = (name) => {
      const n = (name || '').toLowerCase();
      if (n.includes('syrup') || n.includes('liquid') || n.includes('suspension') || n.includes('solution'))
        return iconSyrup;
      if (n.includes('injection') || n.includes('vaccine') || n.includes('insulin'))
        return iconSyringe;
      if (n.includes('cream') || n.includes('ointment') || n.includes('gel') || n.includes('lotion'))
        return iconOintment;
      if (n.includes('drop') || n.includes('eye') || n.includes('ear') || n.includes('nasal'))
        return iconEyedrop;
      return iconPill;
    };

    const MedsTable = ({ meds = medications }) => (
      <div className="rx-section-meds mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#357f62] text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
          <h3 className="text-[19px] font-bold uppercase tracking-widest text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>Medication Details</h3>
        </div>
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left text-[19px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700 w-[40%]">Medicine Name</th>
                <th className="px-2 py-3 font-bold text-slate-700 w-[15%]">Qty / Dose</th>
                <th className="px-4 py-3 font-bold text-slate-700 w-[30%]">Frequency</th>
                <th className="px-2 py-3 font-bold text-slate-700 w-[15%]">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meds.map((med) => {
                const parts = [med.m && 'Morning', med.a && 'Afternoon', med.n && 'Night'].filter(Boolean);
                const freqLabel = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1] : parts[0] || '—';
                const timing = med.timing !== 'Select' ? ` (${med.timing})` : '';
                return (
                  <tr key={med.id}>
                    <td className="px-4 py-5 font-bold text-slate-900 w-[40%]">
                      <span className="font-bold text-[19px]">{med.name}</span>
                    </td>
                    <td className="px-2 py-5 w-[15%]">
                      <input className="w-full bg-transparent outline-none border-b border-transparent hover:border-slate-300 focus:border-[#357f62] text-[19px]" value={med.qty || ''} onChange={(e) => handleMedicationChange(med.id, 'qty', e.target.value)} />
                    </td>
                    <td className="px-4 py-5 w-[30%]">{freqLabel}{timing}</td>
                    <td className="px-2 py-5 text-slate-500 w-[15%]">{med.days ? `${med.days} Days` : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

    const AdviceSections = () => (
      <>
        {allNutrition.length > 0 && (
          <div className="rx-section-advice mb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="material-symbols-outlined text-[#357f62] text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              <h3 className="text-[19px] font-semibold uppercase tracking-widest text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>Nutrition Advice</h3>
            </div>
            <div className="border border-[#357f62]/30 rounded-xl p-5">
              <div className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                {allNutrition.map((line, i) => (
                  <p key={i} className="text-[19px] leading-relaxed text-slate-600" style={{ paddingLeft: '20px', textIndent: '-20px' }}><span className="text-[#357f62] font-bold" style={{ display: 'inline-block', width: '20px', textIndent: '0' }}>•</span>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
        {allExercise.length > 0 && (
          <div className="rx-section-advice mb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="material-symbols-outlined text-[#357f62] text-[23px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_run</span>
              <h3 className="text-[19px] font-semibold uppercase tracking-widest text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>Exercise &amp; Activity</h3>
            </div>
            <div className="border border-[#357f62]/30 rounded-xl p-5">
              <div className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                {allExercise.map((line, i) => (
                  <p key={i} className="text-[19px] leading-relaxed text-slate-600" style={{ paddingLeft: '20px', textIndent: '-20px' }}><span className="text-[#357f62] font-bold" style={{ display: 'inline-block', width: '20px', textIndent: '0' }}>•</span>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );

    // ── Native language translated components ──
    const lang = nativeLang;

    const NativePatientInfo = () => (
      <div className="rx-section-patient mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#357f62] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          <h3 className="text-[20px] font-bold uppercase tracking-widest text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>{t('Patient Information', lang)}</h3>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100" style={{ fontFamily: 'Inter, sans-serif' }}>
          <div className="space-y-1">
            <p className="text-[16px] font-bold text-slate-400 uppercase">{t('Patient Name', lang)}</p>
            <p className="text-[24px] font-bold pb-1">{patientForm.fullName || '—'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[16px] font-bold text-slate-400 uppercase">{t('Age / Gender', lang)}</p>
            <p className="text-[24px] font-semibold pb-1">{patientForm.age || '—'} / {t(patientForm.gender, lang)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[16px] font-bold text-slate-400 uppercase">{t('Date', lang)}</p>
            <p className="text-[24px] font-semibold pb-1">{today}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[16px] font-bold text-slate-400 uppercase">{t('Patient ID', lang)}</p>
            <p className="text-[24px] font-semibold pb-1">{patientForm.phone || '—'}</p>
          </div>
        </div>
      </div>
    );

    const NativeMedsTable = ({ meds = medications }) => (
      <div className="rx-section-meds mb-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="material-symbols-outlined text-[#357f62] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>medication</span>
          <h3 className="text-[20px] font-bold uppercase tracking-widest text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>{t('Medication Details', lang)}</h3>
        </div>
        <div className="overflow-hidden border border-slate-200 rounded-lg">
          <table className="w-full text-left text-[20px]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-bold text-slate-700 w-[40%]">{t('Medicine Name', lang)}</th>
                <th className="px-2 py-3 font-bold text-slate-700 w-[15%]">{t('Qty / Dose', lang)}</th>
                <th className="px-4 py-3 font-bold text-slate-700 w-[30%]">{t('Frequency', lang)}</th>
                <th className="px-2 py-3 font-bold text-slate-700 w-[15%]">{t('Duration', lang)}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meds.map((med) => {
                const parts = [med.m && 'Morning', med.a && 'Afternoon', med.n && 'Night'].filter(Boolean);
                const freqLabel = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' & ' + parts[parts.length - 1] : parts[0] || '—';
                const timing = med.timing !== 'Select' ? ` (${med.timing})` : '';
                const fullFreq = `${freqLabel}${timing}`;
                return (
                  <tr key={med.id}>
                    <td className="px-4 py-5 font-bold text-slate-900 w-[40%]">
                      <span className="font-bold text-[20px]">{med.name}</span>
                    </td>
                    <td className="px-2 py-5 text-[20px] w-[15%]">{med.qty || ''}</td>
                    <td className="px-4 py-5 w-[30%]">{translateFrequency(fullFreq, lang)}</td>
                    <td className="px-2 py-5 text-slate-500 w-[15%]">{med.days ? translateDuration(`${med.days} Days`, lang) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

    const nativeNutritionLines = translatedNutrition.length > 0 ? translatedNutrition : allNutrition;
    const nativeExerciseLines = translatedExercise.length > 0 ? translatedExercise : allExercise;

    const NativeAdviceSections = () => (
      <>
        {allNutrition.length > 0 && (
          <div className="rx-section-advice mb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="material-symbols-outlined text-[#357f62] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>nutrition</span>
              <h3 className="text-[20px] font-semibold uppercase tracking-widest text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>{t('Nutrition Advice', lang)}</h3>
            </div>
            <div className="border border-[#357f62]/30 rounded-xl p-5">
              <div className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                {nativeNutritionLines.map((line, i) => (
                  <p key={i} className="text-[20px] leading-relaxed text-slate-600" style={{ paddingLeft: '20px', textIndent: '-20px' }}><span className="text-[#357f62] font-bold" style={{ display: 'inline-block', width: '20px', textIndent: '0' }}>•</span>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
        {allExercise.length > 0 && (
          <div className="rx-section-advice mb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="material-symbols-outlined text-[#357f62] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>directions_run</span>
              <h3 className="text-[20px] font-semibold uppercase tracking-widest text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>{t('Exercise & Activity', lang)}</h3>
            </div>
            <div className="border border-[#357f62]/30 rounded-xl p-5">
              <div className="space-y-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                {nativeExerciseLines.map((line, i) => (
                  <p key={i} className="text-[20px] leading-relaxed text-slate-600" style={{ paddingLeft: '20px', textIndent: '-20px' }}><span className="text-[#357f62] font-bold" style={{ display: 'inline-block', width: '20px', textIndent: '0' }}>•</span>{line}</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </>
    );

    const PageShell = ({ children, refProp }) => (
      <div ref={refProp} className="print-container w-full max-w-[850px] bg-white shadow-xl rounded-xl border border-slate-200 flex flex-col" style={{ minHeight: '1202px' }}>
        <RxHeader />
        <div className="flex-grow p-6">{children}</div>
        <RxFooter />
      </div>
    );

    return (
      <div className="print-container-wrapper flex-1 flex flex-col min-h-0 overflow-hidden bg-[#f6f8f7]">
        <main className="print-container-wrapper flex-1 min-h-0 overflow-y-auto pt-8 pb-4 px-4 sm:px-6 flex flex-col items-center gap-8">
          {needsTwoPages ? (
            <>
              <PageShell refProp={(el) => { rxRef.current = el; }}>
                <PatientInfo />
                <MedsTable meds={page1Meds} />
              </PageShell>
              <PageShell refProp={(el) => { if (!rxRef.current) rxRef.current = el; rxRef._page2 = el; }}>
                {page2Meds.length > 0 && <MedsTable meds={page2Meds} />}
                {hasAdvice && <AdviceSections />}
              </PageShell>
            </>
          ) : (
            <PageShell refProp={(el) => { rxRef.current = el; }}>
              <PatientInfo />
              <MedsTable />
              {hasAdvice && <AdviceSections />}
            </PageShell>
          )}

          {/* Native language pages */}
          {nativeLang ? (
            <>
              <div className="no-print w-full max-w-[850px] flex items-center gap-3 px-2">
                <div className="flex-1 border-t border-dashed border-slate-300" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {LANGUAGES.find((l) => l.code === nativeLang)?.labelEn} Version
                  {isTranslating && <span className="ml-2 text-[#357f62] animate-pulse">— Translating…</span>}
                </span>
                <div className="flex-1 border-t border-dashed border-slate-300" />
              </div>
              {nativeNeedsTwoPages ? (
                <>
                  <PageShell refProp={(el) => { rxRef._native1 = el; }}>
                    <NativePatientInfo />
                    <NativeMedsTable meds={nativePage1Meds} />
                  </PageShell>
                  <PageShell refProp={(el) => { rxRef._native2 = el; }}>
                    {nativePage2Meds.length > 0 && <NativeMedsTable meds={nativePage2Meds} />}
                    {hasAdvice && <NativeAdviceSections />}
                  </PageShell>
                </>
              ) : (
                <PageShell refProp={(el) => { rxRef._native1 = el; }}>
                  <NativePatientInfo />
                  <NativeMedsTable />
                  {hasAdvice && <NativeAdviceSections />}
                </PageShell>
              )}
            </>
          ) : null}
        </main>

        <div className="no-print sticky bottom-0 z-40 bg-white border-t border-slate-200 px-6 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-[850px] mx-auto flex justify-between items-center gap-4">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors" onClick={() => setShowPreview(false)} type="button">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back
            </button>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-bold text-sm hover:brightness-110 transition-all shadow-sm" type="button" onClick={() => window.print()} style={{ backgroundColor: '#357f62' }}>
                <span className="material-symbols-outlined text-lg">print</span>
                Print Prescription
              </button>
              <button
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                type="button"
                disabled={isGeneratingPdf || isTranslating}
                onClick={async () => {
                  if (!rxRef.current) return;
                  setIsGeneratingPdf(true);
                  try {
                    const pages = [rxRef.current];
                    if (rxRef._page2) pages.push(rxRef._page2);
                    if (rxRef._native1) pages.push(rxRef._native1);
                    if (rxRef._native2) pages.push(rxRef._native2);
                    const name = (patientForm.fullName || 'patient').replace(/\s+/g, '_');
                    await downloadPrescriptionPdf(pages, `Rx_${name}_${new Date().toISOString().slice(0, 10)}`);
                  } catch (err) {
                    console.error('PDF generation failed:', err);
                  } finally {
                    setIsGeneratingPdf(false);
                  }
                }}
              >
                <span className="material-symbols-outlined text-lg">{isGeneratingPdf ? 'hourglass_top' : 'download'}</span>
                {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <main ref={scrollContainerRef} className="flex-grow overflow-y-auto">
        <div className="max-w-[1400px] mx-auto w-full pt-6 p-4 md:pt-8 md:p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex flex-col gap-6 flex-[2] min-w-0">

              {/* Patient Details — editable form (solo doctor) or read-only display (receptionist) */}
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="material-symbols-outlined text-[#1f7a5c]">person_add</span>
                  <h3 className="text-lg font-bold text-slate-800">Patient Details</h3>
                </div>

                {hasReceptionist ? (
                  /* Read-only patient display for receptionist mode */
                  patientForm.fullName ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="h-10 w-10 rounded-full bg-[#1f7a5c]/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[#1f7a5c] text-xl">person</span>
                        </div>
                        <div className="min-w-0">
                          <div className="text-base font-bold text-slate-900 truncate">{patientForm.fullName}</div>
                          <div className="text-xs text-slate-500">{patientForm.phone ? `+91 ${patientForm.phone}` : 'No phone'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Age</div>
                          <div className="text-sm font-bold text-slate-800">{patientForm.age || '—'}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg px-3 py-2">
                          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Gender</div>
                          <div className="text-sm font-bold text-slate-800">{patientForm.gender || '—'}</div>
                        </div>
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <div className="text-[10px] font-semibold text-amber-600 uppercase tracking-wider">Complaint</div>
                          <div className="text-sm font-medium text-amber-900">{patientForm.complaint || '—'}</div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                          <div className="text-[10px] font-semibold text-red-500 uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">warning</span> Allergies
                          </div>
                          <div className="text-sm font-medium text-red-800">{patientForm.allergies || '—'}</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">hourglass_empty</span>
                      <p className="text-sm text-slate-400">Receptionist will send the next patient</p>
                    </div>
                  )
                ) : (
                  /* Editable patient form for solo doctor mode */
                  <>
                    <div className="mb-5 rounded-xl border border-[#1f7a5c]/20 bg-[#1f7a5c]/5 p-4">
                      <label className="block text-xs font-semibold text-[#1f7a5c] uppercase tracking-wider mb-2">Patient ID (Phone)</label>
                      <input
                        className="w-full rounded-lg border-[#1f7a5c]/30 bg-white text-slate-900 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-3 text-base font-medium"
                        placeholder="Enter 10-digit phone number"
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={patientForm.phone}
                        onChange={handlePhoneChange}
                      />
                      {patientForm.phone.length === 10 && (
                        <p className={`mt-2 text-xs ${lookupStatus === 'found' ? 'text-emerald-600' : lookupStatus === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
                          {lookupMessage}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                        <input
                          className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-900 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2 text-sm"
                          type="text"
                          value={patientForm.fullName}
                          onChange={(event) => setPatientForm((prev) => ({ ...prev, fullName: event.target.value, isAutoFilled: false }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Age</label>
                        <input
                          className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-900 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2 text-sm"
                          type="text"
                          inputMode="numeric"
                          value={patientForm.age}
                          onChange={(event) => setPatientForm((prev) => ({ ...prev, age: event.target.value.replace(/\D/g, '').slice(0, 3), isAutoFilled: false }))}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
                        <select
                          className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-900 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2 text-sm"
                          value={patientForm.gender}
                          onChange={(event) => setPatientForm((prev) => ({ ...prev, gender: event.target.value, isAutoFilled: false }))}
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Complaint</label>
                        <input
                          className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-900 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2 text-sm"
                          type="text"
                          placeholder="e.g. Fever, Headache, Chest pain"
                          value={patientForm.complaint || ''}
                          onChange={(event) => setPatientForm((prev) => ({ ...prev, complaint: event.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Allergies</label>
                        <input
                          className="w-full rounded-lg border-slate-300 bg-slate-50 text-slate-900 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2 text-sm"
                          type="text"
                          placeholder="e.g. Penicillin, Peanuts, Dust"
                          value={patientForm.allergies || ''}
                          onChange={(event) => setPatientForm((prev) => ({ ...prev, allergies: event.target.value }))}
                        />
                      </div>
                    </div>
                  </>
                )}
              </section>

              <section className="space-y-4">
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[11px] font-black tracking-[0.14em] text-slate-700 uppercase shrink-0 sm:text-xs">Smart Tags:</span>
                    {loadingTags ? <span className="text-sm text-slate-500">Loading tags...</span> : null}
                    {!loadingTags && !smartTags.length ? <span className="text-sm text-slate-500">No smart tags found in your account.</span> : null}
                    {smartTags.map((tag) => {
                      const name = normalizeTagName(tag.tagName);
                      const isActive = selectedTags.includes(name);
                      return (
                        <button
                          key={tag.tagName}
                          className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-[0_4px_10px_rgba(148,163,184,0.10)] ${isActive ? 'bg-[#1f7a5c] text-white shadow-[0_8px_16px_rgba(31,122,92,0.22)]' : 'bg-[#dff3ef] text-[#245d56] hover:bg-[#cdebe5] hover:shadow-[0_6px_14px_rgba(148,163,184,0.14)]'}`}
                          type="button"
                          onClick={() => applyTag(tag)}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence initial={false}>
                    {availableMedicineTags.length ? (
                      <motion.div
                        key="available-medicine-tags"
                        layout
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{
                          opacity: { duration: 0.18, ease: 'easeOut' },
                          height: { type: 'spring', stiffness: 320, damping: 38, mass: 0.95, restDelta: 0.2, restSpeed: 0.5 },
                          layout: { type: 'spring', stiffness: 320, damping: 38, mass: 0.95, restDelta: 0.2, restSpeed: 0.5 },
                        }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-wrap gap-2">
                          {availableMedicineTags.map((name) => (
                            <button
                              key={name}
                              type="button"
                              className="rounded-full border border-[#dbe4ea] bg-white px-3 py-1.5 text-[12px] font-medium leading-none text-slate-600 hover:border-[#0d6f68] hover:text-[#0d6f68] transition-colors"
                              onClick={() => addMedicineByName(name)}
                            >
                              + {name}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>

                <section ref={prescriptionRef} className="overflow-hidden rounded-[24px] border border-[#e5eaee] bg-white shadow-[0_10px_30px_rgba(148,163,184,0.08)]">
                  <div className="overflow-x-auto">
                    <div className="min-w-[760px] text-sm">
                      <div className="grid grid-cols-[minmax(200px,1.5fr)_74px_150px_88px_132px_44px] gap-0 bg-[#edf2f6] px-5 py-3 text-[11px] font-black uppercase tracking-[0.05em] text-slate-700">
                        <div>Medicine Name</div>
                        <div>Qty</div>
                        <div>Dosage (M-A-N)</div>
                        <div>Days</div>
                        <div>Timing</div>
                        <div />
                      </div>

                      <motion.div layout transition={{ layout: { type: 'spring', stiffness: 320, damping: 38, mass: 0.95, restDelta: 0.2, restSpeed: 0.5 } }}>
                        <AnimatePresence initial={false} mode="popLayout">
                          {!medications.length ? (
                            <motion.div
                              key="medications-empty"
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.18, ease: 'easeOut' }}
                            >
                              <div className="px-5 py-7 text-center text-slate-500 text-xs">
                                Select a Smart Tag or search medicines to start the prescription.
                              </div>
                            </motion.div>
                          ) : isTagEnteringFromEmpty ? (
                            <motion.div
                              key="medications-tag-enter"
                              layout
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{
                                opacity: { duration: 0.22, ease: 'easeOut' },
                                height: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                                layout: { type: 'spring', stiffness: 320, damping: 38, mass: 0.95, restDelta: 0.2, restSpeed: 0.5 },
                              }}
                              className="overflow-hidden"
                            >
                              {medications.map((med, i) => (
                                <AnimatedMedicationRow key={med.id} isFirst={i === 0} expandOnEnter={false}>
                                  <MedicationRowContent
                                    med={med}
                                    onChange={handleMedicationChange}
                                    onDelete={handleDeleteMedication}
                                  />
                                </AnimatedMedicationRow>
                              ))}
                            </motion.div>
                          ) : (
                            medications.map((med, i) => {
                              const isExistingRow = previousMedicationIds.includes(med.id);
                              const expandOnEnter = !isExistingRow;

                              return (
                                <AnimatedMedicationRow key={med.id} isFirst={i === 0} expandOnEnter={expandOnEnter}>
                                  <MedicationRowContent
                                    med={med}
                                    onChange={handleMedicationChange}
                                    onDelete={handleDeleteMedication}
                                  />
                                </AnimatedMedicationRow>
                              );
                            })
                          )}
                        </AnimatePresence>
                      </motion.div>

                      <div className="border-t border-[#eef2f4] bg-[#f4f7fa] px-5 py-3">
                        <div className="relative max-w-[360px]">
                          <input
                            ref={medicineSearchInputRef}
                            className="w-full rounded-3xl border border-slate-200 bg-white py-2.5 pl-12 pr-4 text-[14px] text-slate-800 placeholder:font-medium placeholder:text-[#0d6f68]/55 focus:placeholder-transparent focus:border-[#0d6f68] focus:ring-[#0d6f68]"
                            placeholder="Add New Medication"
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-[#0d6f68]/55">add_circle</span>
                          {searchTerm.trim() ? (
                            <div className="absolute bottom-full left-0 z-20 mb-2 w-full rounded-2xl border border-slate-200 bg-white shadow-lg p-2 space-y-1 max-h-48 overflow-y-auto">
                              {medicineSearchLoading && !filteredSearchResults.length ? (
                                <div className="px-3 py-2 text-sm text-slate-400">Searching...</div>
                              ) : null}
                              {filteredSearchResults.map((item) => (
                                <button
                                  key={item}
                                  type="button"
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-sm"
                                  onClick={() => {
                                    addMedicineByName(item);
                                    setSearchTerm('');
                                  }}
                                >
                                  + {item}
                                </button>
                              ))}
                              {!medicineSearchLoading && !filteredSearchResults.length ? (
                                <button
                                  type="button"
                                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-100 text-sm text-[#0d6f68]"
                                  onClick={handleAddCustomFromSearch}
                                >
                                  + Add "{searchTerm.trim()}"
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[15px] font-black tracking-tight text-slate-900">Investigations</h3>
                  <div className="rounded-[20px] border border-[#e5eaee] bg-white p-3.5 shadow-[0_8px_20px_rgba(148,163,184,0.08)]">
                    <div className="grid gap-3 lg:grid-cols-[280px_1fr] lg:items-start">
                      <div className="relative">
                        <input
                          className="w-full rounded-xl border border-transparent bg-[#eef2f6] py-2.5 pl-4 pr-10 text-[12px] font-medium text-slate-800 placeholder:text-slate-500 focus:border-[#0d6f68] focus:ring-[#0d6f68]"
                          placeholder="Search or add investigation"
                          type="text"
                          value={investigationSearch}
                          onChange={(e) => setInvestigationSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && investigationSearch.trim()) {
                              e.preventDefault();
                              toggleInvestigation(investigationSearch);
                              setInvestigationSearch('');
                            }
                          }}
                        />
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500">
                          search
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {['ECG', 'CBC', 'MRI', 'X-RAY', 'Glucose', 'Thyroid', 'Lipid Panel', 'Urine R/M'].map((item) => {
                          const isActive = investigations.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => toggleInvestigation(item)}
                              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors ${
                                isActive
                                  ? 'bg-[#bfe9df] text-[#315f5a]'
                                  : 'bg-[#eef2f6] text-slate-700 hover:bg-[#dde6ee]'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-[0.12em] text-slate-700">
                        Selected Investigations
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {investigations.map((item) => (
                          <span
                            key={item}
                            className="group relative inline-flex items-center rounded-full bg-[#bfe9df] px-3 py-1.5 pr-4 text-[11px] font-bold text-[#315f5a] overflow-visible"
                          >
                            {item}
                            <button
                              type="button"
                              onClick={() => removeInvestigation(item)}
                              className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#c7ccd4] text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-[#aeb5bf]"
                              aria-label={`Remove ${item}`}
                            >
                              <span className="material-symbols-outlined text-[9px] leading-none">close</span>
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              </section>
            </div>

            <div className="flex flex-col gap-6 flex-1 min-w-[320px]">
              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-[#1f7a5c]">restaurant</span>
                  <h3 className="text-xl font-bold tracking-tight text-slate-800">Nutrition &amp; Advice</h3>
                </div>
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Select</h4>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Warm Water', sentence: 'Drink warm water frequently throughout the day to stay hydrated and aid digestion.' },
                      { label: 'Avoid Spicy', sentence: 'Avoid spicy, oily, and fried foods to prevent irritation and promote recovery.' },
                      { label: 'Bed Rest', sentence: 'Take adequate bed rest and avoid physical exertion until symptoms improve.' },
                      { label: 'Salt Gargle', sentence: 'Gargle with warm salt water 2-3 times a day to soothe throat irritation.' },
                      { label: 'Steam Inhalation', sentence: 'Do steam inhalation for 10-15 minutes twice a day to relieve nasal congestion.' },
                      { label: 'Soft Diet', sentence: 'Follow a soft and easily digestible diet including khichdi, dal, soups, and boiled vegetables.' },
                      { label: 'Fiber-Rich', sentence: 'Include fiber-rich foods such as whole grains, oats, and leafy vegetables in your diet.' },
                      { label: 'Low Salt', sentence: 'Reduce salt intake and avoid processed or packaged foods high in sodium.' },
                    ].map(({ label, sentence }) => {
                      const isActive = customAdvice.includes(sentence);
                      return (
                        <button
                          key={label}
                          className={`px-3 py-1 rounded-full text-xs transition-colors ${isActive ? 'bg-[#1f7a5c] text-white' : 'bg-slate-100 hover:bg-[#1f7a5c]/10 hover:text-[#1f7a5c]'}`}
                          type="button"
                          onClick={() => toggleQuickAdviceSentence(sentence)}
                        >{label}</button>
                      );
                    })}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add advice</h4>
                  {(() => {
                    const tagLines = adviceBullets.filter((b) => b.type === 'nutrition');
                    const customLines = splitStoredLines(customAdvice);
                    return (
                      <motion.ul
                        layout
                        transition={{ layout: { type: 'spring', stiffness: 320, damping: 38, mass: 0.95, restDelta: 0.2, restSpeed: 0.5 } }}
                        className="mb-3 flex flex-col"
                      >
                        {tagLines.map((b, i) => (
                          <li key={`tag-${b.tag}-${i}`} className="flex items-center gap-2 text-sm leading-5 text-slate-800 bg-slate-100 px-3 py-2 rounded-lg">
                            <span className="flex-1">{b.text}</span>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{b.tag}</span>
                          </li>
                        ))}
                        <AnimatePresence initial={false}>
                          {customLines.map((line, i) => (
                            <ExpandableAdviceRow
                              key={adviceRowIdsRef.current[i] || `custom-${i}`}
                              onClick={() => {
                                setEditingAdviceDraft(line);
                                setEditingAdviceIndex(i);
                              }}
                            >
                              <div className={`flex items-center gap-2 text-sm leading-5 text-slate-800 bg-slate-100 px-3 py-2 rounded-lg cursor-text transition-colors ${editingAdviceIndex === i ? 'ring-1 ring-[#1f7a5c] bg-[#eef8f4]' : ''}`}>
                                {editingAdviceIndex === i ? (
                                  <input
                                    autoFocus
                                    className="flex-1 bg-transparent outline-none text-sm text-slate-900"
                                    value={editingAdviceDraft}
                                    onChange={(e) => setEditingAdviceDraft(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={() => {
                                      const nextLine = editingAdviceDraft.trim();
                                      if (nextLine) {
                                        updateCustomAdviceLine(i, nextLine);
                                      }
                                      setEditingAdviceDraft('');
                                      setEditingAdviceIndex(null);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        e.currentTarget.blur();
                                      }
                                      if (e.key === 'Escape') {
                                        e.preventDefault();
                                        setEditingAdviceDraft('');
                                        setEditingAdviceIndex(null);
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="flex-1">{line}</span>
                                )}
                                <button
                                  type="button"
                                  className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeCustomAdviceLine(i);
                                    if (editingAdviceIndex === i) {
                                      setEditingAdviceDraft('');
                                      setEditingAdviceIndex(null);
                                    }
                                  }}
                                  aria-label={`Delete advice ${i + 1}`}
                                >
                                  <span className="material-symbols-outlined text-sm">close</span>
                                </button>
                              </div>
                            </ExpandableAdviceRow>
                          ))}
                        </AnimatePresence>
                      </motion.ul>
                    );
                  })()}
                  <textarea
                    className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2.5 text-sm resize-none min-h-[96px]"
                    placeholder="Type custom nutrition advice and press Enter..."
                    rows={4}
                    value={customAdviceInput}
                    onChange={(e) => setCustomAdviceInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter' || e.shiftKey) return;
                      const nextLine = customAdviceInput.trim();
                      if (!nextLine) return;
                      e.preventDefault();
                      addCustomAdviceLine(nextLine);
                      setCustomAdviceInput('');
                    }}
                  />
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white shadow-[0_14px_34px_rgba(148,163,184,0.12)] overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setIsExerciseExpanded((prev) => !prev)}
                  aria-expanded={isExerciseExpanded}
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#1f7a5c]">directions_run</span>
                    <h3 className="text-lg font-bold text-slate-800">Exercise &amp; Activity</h3>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">
                    {isExerciseExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isExerciseExpanded ? (
                    <motion.div
                      key="exercise-content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        <div className="mb-4">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Quick Select</h4>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { label: 'Walking', sentence: 'Walk briskly for 30 minutes daily, preferably in the morning or evening.' },
                              { label: 'Stretching', sentence: 'Perform light stretching exercises for 10-15 minutes daily to improve flexibility.' },
                              { label: 'Yoga', sentence: 'Practice gentle yoga and pranayama daily to reduce stress and improve overall well-being.' },
                              { label: 'Breathing', sentence: 'Do deep breathing exercises (5-10 minutes) twice a day to improve lung capacity.' },
                              { label: 'No Heavy Lifting', sentence: 'Avoid heavy lifting and strenuous physical activity until further advised.' },
                              { label: 'Rest', sentence: 'Avoid strenuous activity and take rest between tasks to allow the body to recover.' },
                              { label: 'Swimming', sentence: 'Light swimming for 20-30 minutes can help improve cardiovascular health.' },
                              { label: 'Cycling', sentence: 'Gentle cycling for 20-30 minutes daily is recommended for joint mobility.' },
                            ].map(({ label, sentence }) => {
                              const isActive = customExercise.includes(sentence);
                              return (
                                <button
                                  key={label}
                                  className={`px-3 py-1 rounded-full text-xs transition-colors ${isActive ? 'bg-[#1f7a5c] text-white' : 'bg-slate-100 hover:bg-[#1f7a5c]/10 hover:text-[#1f7a5c]'}`}
                                  type="button"
                                  onClick={() => setCustomExercise((prev) => {
                                    if (prev.includes(sentence)) {
                                      return prev.split('\n').filter((l) => l.trim() !== sentence).join('\n');
                                    }
                                    return prev ? `${prev}\n${sentence}` : sentence;
                                  })}
                                >{label}</button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="border-t border-slate-100 pt-4">
                          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add exercise</h4>
                          {(() => {
                            const tagLines = adviceBullets.filter((b) => b.type === 'lifestyle');
                            const customLines = customExercise ? customExercise.split('\n').map((l) => l.trim()).filter(Boolean) : [];
                            return (
                              <ul className="flex flex-col gap-1.5 mb-3">
                                {tagLines.map((b, i) => (
                                  <li key={`tag-${b.tag}-${i}`} className="flex items-start gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg">
                                    <span className="text-blue-500 font-bold mt-px">•</span>
                                    <span className="flex-1">{b.text}</span>
                                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{b.tag}</span>
                                  </li>
                                ))}
                                <AnimatePresence initial={false}>
                                  {customLines.map((line, i) => (
                                    <motion.li
                                      key={`exercise-custom-${i}`}
                                      layout="position"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
                                      transition={{ duration: 0.2, ease: 'easeOut', layout: { duration: 0.22, ease: 'easeOut' } }}
                                      className="overflow-hidden"
                                      onClick={() => {
                                        setEditingExerciseDraft(line);
                                        setEditingExerciseIndex(i);
                                      }}
                                    >
                                      <div className={`flex items-center gap-2 text-sm leading-5 text-slate-800 bg-slate-100 px-3 py-2 rounded-lg cursor-text transition-colors ${editingExerciseIndex === i ? 'ring-1 ring-[#1f7a5c] bg-[#eef8f4]' : ''}`}>
                                        {editingExerciseIndex === i ? (
                                          <input
                                            autoFocus
                                            className="flex-1 bg-transparent outline-none text-sm text-slate-900"
                                            value={editingExerciseDraft}
                                            onChange={(e) => setEditingExerciseDraft(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onBlur={() => {
                                              const lines = customExercise ? customExercise.split('\n').map((l) => l.trim()).filter(Boolean) : [];
                                              const nextLine = editingExerciseDraft.trim();
                                              if (nextLine) {
                                                lines[i] = nextLine;
                                                setCustomExercise(lines.join('\n'));
                                              }
                                              setEditingExerciseDraft('');
                                              setEditingExerciseIndex(null);
                                            }}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') {
                                                e.preventDefault();
                                                e.currentTarget.blur();
                                              }
                                              if (e.key === 'Escape') {
                                                e.preventDefault();
                                                setEditingExerciseDraft('');
                                                setEditingExerciseIndex(null);
                                              }
                                            }}
                                          />
                                        ) : (
                                          <span className="flex-1">{line}</span>
                                        )}
                                        <button
                                          type="button"
                                          className="shrink-0 text-slate-300 hover:text-red-500 transition-colors"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const lines = customExercise ? customExercise.split('\n').map((l) => l.trim()).filter(Boolean) : [];
                                            const nextLines = lines.filter((_, idx) => idx !== i);
                                            setCustomExercise(nextLines.join('\n'));
                                            if (editingExerciseIndex === i) {
                                              setEditingExerciseDraft('');
                                              setEditingExerciseIndex(null);
                                            }
                                          }}
                                          aria-label={`Delete exercise ${i + 1}`}
                                        >
                                          <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                      </div>
                                    </motion.li>
                                  ))}
                                </AnimatePresence>
                              </ul>
                            );
                          })()}
                          <textarea
                            className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-[#1f7a5c] focus:border-[#1f7a5c] px-3 py-2.5 text-sm resize-none min-h-[96px]"
                            placeholder="Type custom exercise advice and press Enter..."
                            rows={4}
                            value={customExerciseInput}
                            onChange={(e) => setCustomExerciseInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key !== 'Enter' || e.shiftKey) return;
                              const nextLine = customExerciseInput.trim();
                              if (!nextLine) return;
                              e.preventDefault();
                              const lines = customExercise ? customExercise.split('\n').map((l) => l.trim()).filter(Boolean) : [];
                              lines.push(nextLine);
                              setCustomExercise(lines.join('\n'));
                              setCustomExerciseInput('');
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#1f7a5c]">calendar_clock</span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase">Follow Up</h3>
                </div>
                <div className="flex items-center gap-3">
                  <input className="rounded border-slate-300 text-[#1f7a5c] accent-[#1f7a5c] h-4 w-4" id="followUp" type="checkbox" />
                  <label className="text-sm text-slate-700" htmlFor="followUp">Review after</label>
                  <input className="w-16 rounded border-slate-300 bg-slate-50 py-1 px-2 text-sm focus:border-[#1f7a5c] focus:ring-[#1f7a5c]" type="text" inputMode="numeric" defaultValue="3" />
                  <span className="text-sm text-slate-700">Days</span>
                </div>
              </section>

              <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_14px_34px_rgba(148,163,184,0.12)]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-[#1f7a5c]">translate</span>
                  <h3 className="text-sm font-bold text-slate-800 uppercase">Native Language Support</h3>
                </div>
                <p className="text-xs text-slate-500 mb-3">Add a second page in a regional language. Medicine names and dosage will remain in English.</p>
                <div className="flex flex-wrap gap-2">
                  {LANGUAGES.map((lang) => {
                    const active = nativeLang === lang.code;
                    return (
                      <button
                        key={lang.code}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${active ? 'bg-[#1f7a5c] text-white border-[#1f7a5c]' : 'bg-white text-slate-700 border-slate-200 hover:border-[#1f7a5c]/40 hover:bg-[#1f7a5c]/5'}`}
                        type="button"
                        onClick={() => setNativeLang(active ? null : lang.code)}
                      >
                        <span className="mr-1.5">{lang.label}</span>
                        <span className="text-xs opacity-70">({lang.labelEn})</span>
                      </button>
                    );
                  })}
                </div>
                {nativeLang && (
                  <p className="mt-3 text-xs text-[#1f7a5c] font-medium">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
                    PDF will include English + {LANGUAGES.find((l) => l.code === nativeLang)?.labelEn} version
                  </p>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <div className="sticky bottom-0 z-40 bg-white border-t border-slate-200 px-6 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-[1400px] mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-red-200 text-red-600 font-medium text-sm hover:bg-red-50 transition-colors"
              type="button"
              onClick={() => setShowClearConfirm(true)}
            >
              <span className="material-symbols-outlined text-lg">delete_sweep</span>
              Clear All
            </button>
            <span className={`text-xs ${sendMessage ? 'text-[#1f7a5c]' : 'text-slate-500'}`}>{sendMessage || `Draft auto-saved at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' })}`}</span>
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors" onClick={async () => { await savePrescriptionForQR(); setShowPreview(true); }} type="button">
              <span className="material-symbols-outlined text-lg">visibility</span>
              Preview PDF
            </button>
            <button className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#1f7a5c] text-white font-medium text-sm hover:bg-[#165942] transition-colors shadow-sm" type="button" onClick={() => window.print()}>
              <span className="material-symbols-outlined text-lg">print</span>
              Print
            </button>
            <button
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white font-medium text-sm hover:bg-green-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              type="button"
              disabled={isGeneratingPdf}
              onClick={async () => {
                await savePrescriptionForQR();
                setShowPreview(true);
                await new Promise((r) => setTimeout(r, 500));
                if (!rxRef.current) return;
                setIsGeneratingPdf(true);
                try {
                  const pages = [rxRef.current];
                  if (rxRef._page2) pages.push(rxRef._page2);
                  const name = (patientForm.fullName || 'patient').replace(/\s+/g, '_');
                  await downloadPrescriptionPdf(pages, `Rx_${name}_${new Date().toISOString().slice(0, 10)}`);
                } catch (err) {
                  console.error('PDF generation failed:', err);
                } finally {
                  setIsGeneratingPdf(false);
                }
              }}
            >
              <span className="material-symbols-outlined text-lg">{isGeneratingPdf ? 'hourglass_top' : 'download'}</span>
              {isGeneratingPdf ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-[fadeSlideIn_0.2s_ease]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-3xl text-red-500">warning</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Clear All Details?</h3>
              <p className="text-sm text-slate-500 leading-relaxed">This will clear all patient information, prescriptions, nutrition advice, and exercise notes. This action cannot be undone.</p>
            </div>
            <div className="flex border-t border-slate-100">
              <button
                className="flex-1 px-4 py-3.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                type="button"
                onClick={() => setShowClearConfirm(false)}
              >Cancel</button>
              <button
                className="flex-1 px-4 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-l border-slate-100"
                type="button"
                onClick={() => {
                  setPatientForm({ fullName: '', age: '', gender: 'Male', phone: '', dateOfBirth: '', bloodGroup: '', isAutoFilled: false });
                  setSelectedTags([]);
                  setMedications([]);
                  setNutritionByTag({});
                  setLifestyleByTag({});
                  setCustomAdvice('');
                  setCustomExercise('');
                  setSendMessage('');
                  clearPrescriptionDraft(userSession?.userUid);
                  setShowClearConfirm(false);
                }}
              >Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
