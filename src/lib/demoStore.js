const STORAGE_KEY = 'easy_prescribe_demo_db_v1';

const MEDICINE_SEARCH_LIMIT_DEFAULT = 20;
const OTP_CODE = '123456';

let medicineCachePromise = null;
const otpSessions = new Map();

function nowIso() {
  return new Date().toISOString();
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeUsername(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9._\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('91') ? digits.slice(-10) : digits.slice(-10);
}

function normalizePhoneWithCountry(phone) {
  const local = normalizePhone(phone);
  return local ? `91${local}` : '';
}

function titleCase(str) {
  return String(str || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values.map((value) => value.trim());
}

async function loadMedicineIndex() {
  if (!medicineCachePromise) {
    medicineCachePromise = fetch('/data.csv')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load medicine data (${response.status})`);
        }
        return response.text();
      })
      .then((csv) => {
        const lines = csv.split(/\r?\n/).filter(Boolean);
        const header = parseCsvLine(lines[0] || '');
        const nameIndex = header.findIndex((column) => column === 'name');
        const names = new Set();

        for (let index = 1; index < lines.length; index += 1) {
          const parts = parseCsvLine(lines[index]);
          const name = nameIndex >= 0 ? parts[nameIndex] : parts[1];
          if (name) {
            names.add(name);
          }
        }

        return Array.from(names).sort((a, b) => a.localeCompare(b));
      });
  }

  return medicineCachePromise;
}

function seedSmartTags() {
  return [
    {
      tagName: 'Fever',
      specialty: 'General Practice',
      description: 'Common fever management template',
      medications: [
        'Paracetamol 500mg (After Food, 5 days)',
        'Cetzine Tablet (Before Food, 3 days)',
      ],
      nutritionAdvice: 'Drink warm water frequently;Take adequate rest;Eat light home-cooked food',
      lifestyleAdvice: 'Bed rest until temperature settles;Monitor temperature twice daily',
    },
    {
      tagName: 'Cold',
      specialty: 'General Practice',
      description: 'Upper respiratory symptom set',
      medications: [
        'Ascoril LS Syrup (After Food, 5 days)',
        'Allegra 120mg Tablet (Before Food, 3 days)',
      ],
      nutritionAdvice: 'Do steam inhalation twice daily;Drink warm fluids;Avoid cold beverages',
      lifestyleAdvice: 'Sleep with head elevated;Avoid dust exposure',
    },
    {
      tagName: 'Cough',
      specialty: 'General Practice',
      description: 'Dry/productive cough support',
      medications: [
        'Alex Syrup (After Food, 5 days)',
        'Azithral 500 Tablet (After Food, 3 days)',
      ],
      nutritionAdvice: 'Warm saline gargles;Take honey with warm water if suitable',
      lifestyleAdvice: 'Avoid smoke and irritants;Rest voice and stay hydrated',
    },
    {
      tagName: 'Headache',
      specialty: 'General Practice',
      description: 'Basic headache treatment plan',
      medications: [
        'Paracetamol 500mg (After Food, 3 days)',
        'Avil 25 Tablet (After Food, 2 days)',
      ],
      nutritionAdvice: 'Stay hydrated;Avoid skipping meals;Limit caffeine excess',
      lifestyleAdvice: 'Reduce screen time;Sleep adequately',
    },
    {
      tagName: 'Gastritis',
      specialty: 'Gastroenterology',
      description: 'Acidity and gastritis symptom support',
      medications: [
        'Aciloc 150 Tablet (Before Food, 7 days)',
        'Antacid Syrup (After Food, 5 days)',
      ],
      nutritionAdvice: 'Avoid spicy and oily foods;Eat small frequent meals;Avoid tea on empty stomach',
      lifestyleAdvice: 'Do not lie down immediately after meals;Avoid late-night dinners',
    },
  ];
}

function createSeedPrescription(doctorUserUid, patientName, patientPhone, patientAge, patientGender, diagnosis, medications, nutrientsAdvice, exerciseAdvice, createdAtOffsetDays = 0) {
  const createdAt = new Date(Date.now() - createdAtOffsetDays * 24 * 60 * 60 * 1000).toISOString();
  return {
    prescriptionUid: uid('rx'),
    doctorUserUid,
    patientName,
    patientPhone: normalizePhoneWithCountry(patientPhone),
    patientAge,
    patientGender,
    patientDateOfBirth: null,
    patientBloodGroup: null,
    diagnosis,
    symptoms: [],
    medications,
    nutrientsAdvice,
    exerciseAdvice,
    otherAdvice: null,
    createdAt,
    sentAt: createdAt,
    status: 'Prescribed',
  };
}

function createAdilSeedPrescription(doctorUserUid) {
  return {
    ...createSeedPrescription(
      doctorUserUid,
      'Adil Khan',
      '9012345678',
      28,
      'Male',
      'Dental Pain',
      [
        { name: 'Amoxicillin 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', instructions: 'After Food' },
        { name: 'Paracetamol 650mg', dosage: '650mg', frequency: '1-1-1', duration: '3 days', instructions: 'After Food' },
      ],
      'Soft diet;Avoid very hot or cold foods',
      'Follow up if pain persists',
      0,
    ),
    patientDateOfBirth: '1996-08-17',
    patientBloodGroup: 'B+',
    patientComplaint: 'Pain in upper right molar region for 3 days',
    patientAllergies: 'No known allergies',
  };
}

function buildInitialDb() {
  const doctorUserUid = 'doctor_demo_1';
  const receptionistUserUid = 'reception_demo_1';
  const smartTags = seedSmartTags();

  const demoPrescriptions = [
    createAdilSeedPrescription(doctorUserUid),
    createSeedPrescription(
      doctorUserUid,
      'Riya Sen',
      '9876543210',
      29,
      'Female',
      'Fever',
      [
        { name: 'Paracetamol 500mg', dosage: '500mg', frequency: '1-0-1', duration: '5 days', instructions: 'After Food' },
        { name: 'Cetzine Tablet', dosage: '', frequency: '0-0-1', duration: '3 days', instructions: 'Before Food' },
      ],
      'Drink warm water frequently;Take adequate rest',
      'Bed rest until symptoms improve',
      0,
    ),
    createSeedPrescription(
      doctorUserUid,
      'Arjun Rao',
      '9123456780',
      41,
      'Male',
      'Cold',
      [
        { name: 'Ascoril LS Syrup', dosage: '10 ml', frequency: '1-1-1', duration: '5 days', instructions: 'After Food' },
      ],
      'Do steam inhalation twice daily;Avoid cold beverages',
      'Sleep with head elevated',
      1,
    ),
    createSeedPrescription(
      doctorUserUid,
      'Neha Kapoor',
      '9988776655',
      35,
      'Female',
      'Headache',
      [
        { name: 'Paracetamol 500mg', dosage: '500mg', frequency: '1-0-1', duration: '3 days', instructions: 'After Food' },
      ],
      'Stay hydrated;Avoid skipping meals',
      'Reduce screen time',
      3,
    ),
  ];

  return {
    doctors: [
      {
        userUid: doctorUserUid,
        username: 'demo.doctor',
        password: 'Demo@123',
        phoneNumber: '9999999999',
        role: 'doctor',
      },
    ],
    receptionists: [
      {
        userUid: receptionistUserUid,
        doctorUserUid,
        name: 'Priya Frontdesk',
        phone: '9000000001',
        password: 'Demo@123',
      },
    ],
    onboarding: {
      [doctorUserUid]: {
        personalDetails: {
          fullName: 'Aarav Mehta',
          medicalRegistrationNumber: 'WBMC-2024-1199',
          dateOfBirth: '1988-03-14',
          qualification: 'MBBS, MD (General Medicine)',
          clinicName: 'EasyPrescribe Demo Clinic',
          address: '12 Lake View Road',
          city: 'Kolkata',
          state: 'West Bengal',
          clinicContactNumber: '9830012345',
          clinicLogo: '',
          digitalSignature: '',
        },
        expertises: ['general-practice', 'gastroenterology'],
        smartTags,
        personalDetailsCompleted: true,
        expertiseCompleted: true,
        onboardingCompleted: true,
      },
    },
    queueEntries: [],
    prescriptions: demoPrescriptions,
    patients: [],
  };
}

function hydratePatientsFromPrescriptions(db) {
  const map = new Map();

  db.prescriptions.forEach((prescription) => {
    const localPhone = normalizePhone(prescription.patientPhone);
    const key = localPhone || `${prescription.patientName}_${prescription.doctorUserUid}`;
    const existing = map.get(key) || {
      uid: uid('patient'),
      fullName: prescription.patientName,
      name: prescription.patientName,
      phone: localPhone,
      gender: prescription.patientGender || '',
      age: prescription.patientAge || '',
      dateOfBirth: prescription.patientDateOfBirth || '',
      bloodGroup: prescription.patientBloodGroup || '',
      createdAt: prescription.createdAt,
      updatedAt: prescription.createdAt,
      lastVisitDate: prescription.createdAt,
      totalVisits: 0,
      prescriptionCount: 0,
      doctorUserUid: prescription.doctorUserUid,
      status: 'treated',
    };

    existing.totalVisits += 1;
    existing.prescriptionCount += 1;
    existing.updatedAt = prescription.createdAt;
    existing.lastVisitDate = prescription.createdAt;
    existing.dateOfBirth = prescription.patientDateOfBirth || existing.dateOfBirth || '';
    existing.bloodGroup = prescription.patientBloodGroup || existing.bloodGroup || '';
    existing.complaint = prescription.diagnosis || existing.complaint || '';
    existing.allergies = prescription.patientAllergies || existing.allergies || '';
    map.set(key, existing);
  });

  db.patients = Array.from(map.values()).sort((a, b) => new Date(b.lastVisitDate || 0) - new Date(a.lastVisitDate || 0));
}

function readRawDb() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeRawDb(db) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function ensureDemoSeedData(db) {
  const doctorUserUid = 'doctor_demo_1';
  const hasAdilPrescription = db.prescriptions?.some((item) => item.doctorUserUid === doctorUserUid && item.patientName === 'Adil Khan');

  if (!hasAdilPrescription) {
    db.prescriptions = db.prescriptions || [];
    db.prescriptions.unshift(createAdilSeedPrescription(doctorUserUid));
    hydratePatientsFromPrescriptions(db);
  }

  return db;
}

export function getDb() {
  let db = readRawDb();
  if (!db) {
    db = buildInitialDb();
    hydratePatientsFromPrescriptions(db);
    writeRawDb(db);
  } else {
    const nextDb = ensureDemoSeedData(db);
    if (nextDb !== db) {
      db = nextDb;
    }
    writeRawDb(db);
  }
  return db;
}

export function updateDb(updater) {
  const current = getDb();
  const next = updater(deepClone(current));
  writeRawDb(next);
  return next;
}

export function resetDemoDb() {
  const db = buildInitialDb();
  hydratePatientsFromPrescriptions(db);
  writeRawDb(db);
  return db;
}

function getDoctorProfile(db, doctorUserUid) {
  return db.onboarding[doctorUserUid]?.personalDetails || null;
}

function buildDoctorSession(doctor) {
  return {
    userUid: doctor.userUid,
    username: doctor.username,
    fullName: doctor.fullName || '',
    role: 'doctor',
  };
}

function buildReceptionistSession(receptionist, db) {
  const doctorProfile = getDoctorProfile(db, receptionist.doctorUserUid);
  return {
    userUid: receptionist.userUid,
    doctorUserUid: receptionist.doctorUserUid,
    username: receptionist.name,
    fullName: receptionist.name,
    doctorName: doctorProfile?.fullName || 'Doctor',
    role: 'receptionist',
  };
}

function computeDashboardOverview(db, doctorUserUid, limit = 10) {
  const doctorProfile = getDoctorProfile(db, doctorUserUid);
  const prescriptions = db.prescriptions
    .filter((item) => item.doctorUserUid === doctorUserUid)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const patients = db.patients.filter((item) => item.doctorUserUid === doctorUserUid);
  const smartTags = db.onboarding[doctorUserUid]?.smartTags || [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaysPrescriptions = prescriptions.filter((item) => new Date(item.createdAt) >= startOfToday).length;

  return {
    doctorDisplayName: doctorProfile?.fullName || 'Doctor',
    stats: {
      todaysPrescriptions,
      trendDelta: Math.max(1, Math.min(12, todaysPrescriptions + 2)),
      totalPatients: patients.length,
      activeTags: smartTags.length,
    },
    recentActivity: prescriptions.slice(0, limit).map((item) => ({
      prescriptionUid: item.prescriptionUid,
      patientName: item.patientName,
      diagnosis: item.diagnosis,
      timestamp: item.createdAt,
      status: item.sentAt ? 'Prescribed' : 'Pending',
    })),
    landing: {
      patientsToday: todaysPrescriptions,
      averageConsultationMinutes: 11,
      syncStatus: 'Synced',
    },
  };
}

function upsertPatientFromPrescription(db, prescription) {
  const localPhone = normalizePhone(prescription.patientPhone);
  const existing = db.patients.find(
    (item) => item.doctorUserUid === prescription.doctorUserUid && normalizePhone(item.phone) === localPhone,
  );

  if (existing) {
    existing.fullName = prescription.patientName;
    existing.name = prescription.patientName;
    existing.gender = prescription.patientGender || existing.gender;
    existing.age = prescription.patientAge || existing.age;
    existing.dateOfBirth = prescription.patientDateOfBirth || existing.dateOfBirth;
    existing.bloodGroup = prescription.patientBloodGroup || existing.bloodGroup;
    existing.updatedAt = prescription.createdAt;
    existing.lastVisitDate = prescription.createdAt;
    existing.totalVisits = (existing.totalVisits || 0) + 1;
    existing.prescriptionCount = (existing.prescriptionCount || 0) + 1;
    existing.complaint = prescription.patientComplaint || prescription.diagnosis || existing.complaint || '';
    existing.allergies = prescription.patientAllergies || existing.allergies || '';
    return existing;
  }

  const patient = {
    uid: uid('patient'),
    fullName: prescription.patientName,
    name: prescription.patientName,
    phone: localPhone,
    gender: prescription.patientGender || '',
    age: prescription.patientAge || '',
    dateOfBirth: prescription.patientDateOfBirth || '',
    bloodGroup: prescription.patientBloodGroup || '',
    createdAt: prescription.createdAt,
    updatedAt: prescription.createdAt,
    lastVisitDate: prescription.createdAt,
    totalVisits: 1,
    prescriptionCount: 1,
    doctorUserUid: prescription.doctorUserUid,
    complaint: prescription.patientComplaint || prescription.diagnosis || '',
    allergies: prescription.patientAllergies || '',
    status: 'treated',
  };
  db.patients.unshift(patient);
  return patient;
}

function findPrescription(db, prescriptionUid) {
  return db.prescriptions.find((item) => item.prescriptionUid === prescriptionUid);
}

function findPatientByPhone(db, phone) {
  const local = normalizePhone(phone);
  if (!local) return null;
  return db.patients.find((item) => normalizePhone(item.phone) === local) || null;
}

async function searchMedicines(query, limit = MEDICINE_SEARCH_LIMIT_DEFAULT) {
  const names = await loadMedicineIndex();
  const normalized = String(query || '').trim().toLowerCase();
  if (!normalized) return [];

  const startsWith = [];
  const contains = [];

  names.forEach((name) => {
    const lower = name.toLowerCase();
    if (lower.startsWith(normalized)) {
      startsWith.push(name);
    } else if (lower.includes(normalized)) {
      contains.push(name);
    }
  });

  return [...startsWith, ...contains].slice(0, limit);
}

export async function demoApiRequest(method, path, body) {
  const [pathname, queryString = ''] = path.split('?');
  const query = new URLSearchParams(queryString);

  if (method === 'POST' && pathname === '/api/otp/send') {
    const phone = normalizePhone(body?.phoneNumber);
    const sessionId = uid('otp');
    otpSessions.set(sessionId, { phone, code: OTP_CODE, createdAt: Date.now() });
    return { sessionId, demoOtp: OTP_CODE };
  }

  if (method === 'POST' && pathname === '/api/otp/verify') {
    const phone = normalizePhone(body?.phoneNumber);
    const session = otpSessions.get(body?.sessionId);
    if (!session || session.phone !== phone) {
      throw new Error('OTP session expired. Please request again.');
    }
    if (String(body?.otp || '') !== session.code) {
      throw new Error('Invalid OTP. Use 123456 for demo.');
    }

    const db = updateDb((draft) => {
      let doctor = draft.doctors.find((item) => normalizePhone(item.phoneNumber) === phone);
      let registered = false;

      if (!doctor) {
        doctor = {
          userUid: uid('doctor'),
          username: `doctor.${phone.slice(-4)}`,
          password: 'Demo@123',
          phoneNumber: phone,
          role: 'doctor',
        };
        draft.doctors.push(doctor);
        draft.onboarding[doctor.userUid] = {
          personalDetails: {
            fullName: '',
            medicalRegistrationNumber: '',
            dateOfBirth: '',
            qualification: '',
            clinicName: '',
            address: '',
            city: '',
            state: '',
            clinicContactNumber: phone,
            clinicLogo: '',
            digitalSignature: '',
          },
          expertises: [],
          smartTags: [],
          personalDetailsCompleted: false,
          expertiseCompleted: false,
          onboardingCompleted: false,
        };
      } else {
        registered = !!draft.onboarding[doctor.userUid]?.onboardingCompleted;
      }

      otpSessions.delete(body.sessionId);
      draft.__response = { registered, session: buildDoctorSession(doctor) };
      return draft;
    });

    return db.__response;
  }

  if (method === 'POST' && pathname === '/api/auth/register') {
    const username = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');
    if (!username || !password) throw new Error('Username and password are required.');

    const db = updateDb((draft) => {
      if (draft.doctors.some((item) => item.username === username)) {
        throw new Error('Username already exists.');
      }
      const doctor = {
        userUid: uid('doctor'),
        username,
        password,
        phoneNumber: '',
        role: 'doctor',
      };
      draft.doctors.push(doctor);
      draft.onboarding[doctor.userUid] = {
        personalDetails: {
          fullName: titleCase(username.replace(/\./g, ' ')),
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
        },
        expertises: [],
        smartTags: [],
        personalDetailsCompleted: false,
        expertiseCompleted: false,
        onboardingCompleted: false,
      };
      draft.__response = buildDoctorSession(doctor);
      return draft;
    });
    return db.__response;
  }

  if (method === 'POST' && pathname === '/api/auth/login') {
    const username = String(body?.username || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const db = getDb();
    const doctor = db.doctors.find((item) => item.username === username && item.password === password);
    if (!doctor) throw new Error('Invalid username or password.');
    return buildDoctorSession(doctor);
  }

  if (method === 'POST' && pathname === '/api/auth/register-receptionist') {
    const doctorUserUid = body?.doctorUserUid;
    const name = String(body?.name || '').trim();
    const phone = normalizePhone(body?.phone);
    const password = String(body?.password || '');
    if (!doctorUserUid || !name || !phone || !password) {
      throw new Error('Please fill all receptionist fields.');
    }

    updateDb((draft) => {
      if (draft.receptionists.some((item) => normalizePhone(item.phone) === phone)) {
        throw new Error('Receptionist phone already exists.');
      }
      draft.receptionists.push({
        userUid: uid('reception'),
        doctorUserUid,
        name,
        phone,
        password,
      });
      return draft;
    });
    return { success: true };
  }

  if (method === 'POST' && pathname === '/api/auth/login-phone') {
    const phone = normalizePhone(body?.phone);
    const password = String(body?.password || '');
    const db = getDb();
    const receptionist = db.receptionists.find((item) => normalizePhone(item.phone) === phone && item.password === password);
    if (!receptionist) throw new Error('Invalid phone or password.');
    return buildReceptionistSession(receptionist, db);
  }

  if (method === 'POST' && pathname === '/api/onboarding/personal-details') {
    updateDb((draft) => {
      draft.onboarding[body.userUid] = draft.onboarding[body.userUid] || {
        personalDetails: {},
        expertises: [],
        smartTags: [],
        personalDetailsCompleted: false,
        expertiseCompleted: false,
        onboardingCompleted: false,
      };
      draft.onboarding[body.userUid].personalDetails = {
        ...draft.onboarding[body.userUid].personalDetails,
        ...body,
      };
      draft.onboarding[body.userUid].personalDetailsCompleted = true;
      draft.onboarding[body.userUid].onboardingCompleted =
        draft.onboarding[body.userUid].personalDetailsCompleted &&
        draft.onboarding[body.userUid].expertiseCompleted;
      const doctor = draft.doctors.find((item) => item.userUid === body.userUid);
      if (doctor) {
        doctor.fullName = body.fullName;
        if (body.clinicContactNumber) {
          doctor.phoneNumber = normalizePhone(body.clinicContactNumber);
        }
      }
      return draft;
    });
    return { success: true };
  }

  if (method === 'POST' && pathname === '/api/onboarding/expertise') {
    updateDb((draft) => {
      draft.onboarding[body.userUid] = draft.onboarding[body.userUid] || {
        personalDetails: {},
        expertises: [],
        smartTags: [],
        personalDetailsCompleted: false,
        expertiseCompleted: false,
        onboardingCompleted: false,
      };
      draft.onboarding[body.userUid].expertises = Array.isArray(body.expertises) ? body.expertises : [];
      draft.onboarding[body.userUid].expertiseCompleted = true;
      draft.onboarding[body.userUid].onboardingCompleted =
        draft.onboarding[body.userUid].personalDetailsCompleted &&
        draft.onboarding[body.userUid].expertiseCompleted;
      return draft;
    });
    return { success: true };
  }

  if (method === 'POST' && pathname === '/api/onboarding/tags') {
    updateDb((draft) => {
      draft.onboarding[body.userUid] = draft.onboarding[body.userUid] || {
        personalDetails: {},
        expertises: [],
        smartTags: [],
        personalDetailsCompleted: false,
        expertiseCompleted: false,
        onboardingCompleted: false,
      };
      draft.onboarding[body.userUid].smartTags = Array.isArray(body.smartTags) ? body.smartTags : [];
      if (draft.onboarding[body.userUid].personalDetailsCompleted && draft.onboarding[body.userUid].expertiseCompleted) {
        draft.onboarding[body.userUid].onboardingCompleted = true;
      }
      return draft;
    });
    return { success: true };
  }

  if (method === 'GET' && pathname.startsWith('/api/onboarding/')) {
    const userUid = pathname.replace('/api/onboarding/', '');
    const db = getDb();
    return deepClone(db.onboarding[userUid] || {});
  }

  if (method === 'GET' && pathname === '/api/dashboard/overview') {
    const doctorUserUid = query.get('doctorUserUid');
    const limit = Number(query.get('limit') || 10);
    return computeDashboardOverview(getDb(), doctorUserUid, limit);
  }

  if (method === 'GET' && pathname === '/api/patients') {
    const doctorUserUid = query.get('doctorUserUid');
    const db = getDb();
    return deepClone(
      db.patients
        .filter((item) => item.doctorUserUid === doctorUserUid)
        .sort((a, b) => new Date(b.lastVisitDate || 0) - new Date(a.lastVisitDate || 0)),
    );
  }

  if (method === 'GET' && pathname.startsWith('/api/patients/by-phone/')) {
    const phone = pathname.replace('/api/patients/by-phone/', '');
    const patient = findPatientByPhone(getDb(), phone);
    if (!patient) throw new Error('Patient not found');
    return {
      patientUid: patient.uid,
      fullName: patient.fullName,
      phone: patient.phone,
      gender: patient.gender,
      age: patient.age,
      dateOfBirth: patient.dateOfBirth || '',
      bloodGroup: patient.bloodGroup || '',
      complaint: patient.complaint || '',
      allergies: patient.allergies || '',
      lastVisitDate: patient.lastVisitDate || '',
      totalVisits: patient.totalVisits || 0,
      prescriptionCount: patient.prescriptionCount || 0,
    };
  }

  if (method === 'GET' && pathname === '/api/medicines/search') {
    const results = await searchMedicines(query.get('query') || '', Number(query.get('limit') || MEDICINE_SEARCH_LIMIT_DEFAULT));
    return { results };
  }

  if (method === 'POST' && pathname === '/api/prescriptions') {
    const createdAt = nowIso();
    const prescription = {
      ...body,
      prescriptionUid: uid('rx'),
      createdAt,
      sentAt: null,
      status: 'Prescribed',
    };

    updateDb((draft) => {
      draft.prescriptions.unshift(prescription);
      upsertPatientFromPrescription(draft, prescription);
      return draft;
    });

    return deepClone(prescription);
  }

  if (method === 'GET' && pathname === '/api/prescriptions') {
    const doctorUserUid = query.get('doctorUserUid');
    const db = getDb();
    return deepClone(
      db.prescriptions
        .filter((item) => item.doctorUserUid === doctorUserUid)
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    );
  }

  if (method === 'GET' && pathname.startsWith('/api/prescriptions/') && pathname.endsWith('/public')) {
    const prescriptionUid = pathname.replace('/api/prescriptions/', '').replace('/public', '');
    const db = getDb();
    const prescription = findPrescription(db, prescriptionUid);
    if (!prescription) throw new Error('Prescription not found');
    const doctorProfile = getDoctorProfile(db, prescription.doctorUserUid);
    return {
      ...deepClone(prescription),
      doctorName: doctorProfile?.fullName || '',
    };
  }

  if (method === 'POST' && pathname.startsWith('/api/prescriptions/') && pathname.endsWith('/send-whatsapp')) {
    const prescriptionUid = pathname.replace('/api/prescriptions/', '').replace('/send-whatsapp', '');
    const nextDb = updateDb((draft) => {
      const prescription = findPrescription(draft, prescriptionUid);
      if (!prescription) {
        throw new Error('Prescription not found.');
      }
      prescription.sentAt = nowIso();
      draft.__response = deepClone(prescription);
      return draft;
    });
    return nextDb.__response;
  }

  if (method === 'GET' && pathname.startsWith('/api/prescriptions/')) {
    const prescriptionUid = pathname.replace('/api/prescriptions/', '');
    const prescription = findPrescription(getDb(), prescriptionUid);
    if (!prescription) throw new Error('Prescription not found');
    return deepClone(prescription);
  }

  if (method === 'POST' && pathname === '/api/queue/add') {
    const createdAt = nowIso();
    const db = updateDb((draft) => {
      const existingQueue = draft.queueEntries.filter((item) => item.doctorUserUid === body.doctorUserUid);
      const tokenNumber = existingQueue.length ? Math.max(...existingQueue.map((item) => item.tokenNumber)) + 1 : 1;
      const patient = findPatientByPhone(draft, body.patientPhone);
      const entry = {
        queueEntryUid: uid('queue'),
        doctorUserUid: body.doctorUserUid,
        patientUid: patient?.uid || uid('patient'),
        patientName: body.patientName,
        patientPhone: normalizePhone(body.patientPhone),
        age: body.age || 0,
        gender: body.gender || '',
        complaint: body.complaint || '',
        allergies: body.allergies || '',
        priority: !!body.priority,
        status: 'WAITING',
        tokenNumber,
        createdAt,
      };
      draft.queueEntries.push(entry);

      if (!patient) {
        draft.patients.unshift({
          uid: entry.patientUid,
          fullName: body.patientName,
          name: body.patientName,
          phone: normalizePhone(body.patientPhone),
          gender: body.gender || '',
          age: body.age || '',
          dateOfBirth: '',
          bloodGroup: '',
          createdAt,
          updatedAt: createdAt,
          lastVisitDate: createdAt,
          totalVisits: 1,
          prescriptionCount: 0,
          doctorUserUid: body.doctorUserUid,
          complaint: body.complaint || '',
          allergies: body.allergies || '',
          status: 'waiting',
        });
      } else {
        patient.fullName = body.patientName || patient.fullName;
        patient.name = body.patientName || patient.name;
        patient.gender = body.gender || patient.gender;
        patient.age = body.age || patient.age;
        patient.complaint = body.complaint || patient.complaint || '';
        patient.allergies = body.allergies || patient.allergies || '';
        patient.updatedAt = createdAt;
      }

      draft.__response = deepClone(entry);
      return draft;
    });

    return db.__response;
  }

  if (method === 'GET' && pathname === '/api/queue/today') {
    const doctorUserUid = query.get('doctorUserUid');
    const db = getDb();
    return deepClone(
      db.queueEntries
        .filter((item) => item.doctorUserUid === doctorUserUid)
        .sort((a, b) => a.tokenNumber - b.tokenNumber),
    );
  }

  if (method === 'PATCH' && pathname === '/api/queue/status') {
    const nextDb = updateDb((draft) => {
      const entry = draft.queueEntries.find((item) => item.queueEntryUid === body.queueEntryUid);
      if (!entry) throw new Error('Queue entry not found');
      entry.status = body.status;
      draft.__response = deepClone(entry);
      return draft;
    });
    return nextDb.__response;
  }

  if (method === 'POST' && pathname === '/api/queue/call-next') {
    const nextDb = updateDb((draft) => {
      const waiting = draft.queueEntries
        .filter((item) => item.doctorUserUid === body.doctorUserUid && item.status === 'WAITING')
        .sort((a, b) => {
          if (a.priority && !b.priority) return -1;
          if (!a.priority && b.priority) return 1;
          return a.tokenNumber - b.tokenNumber;
        });

      if (!waiting.length) {
        throw new Error('No patients waiting in queue.');
      }

      const entry = waiting[0];
      entry.status = 'WITH_DOCTOR';
      draft.__response = deepClone(entry);
      return draft;
    });
    return nextDb.__response;
  }

  throw new Error(`Demo API route not implemented: ${method} ${pathname}`);
}
