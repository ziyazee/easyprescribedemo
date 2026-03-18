import { useEffect, useMemo, useState } from 'react';
import { translateLines } from '../services/translationService';

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'kn', label: 'Kannada' },
  { code: 'ml', label: 'Malayalam' },
];

const ENGLISH_ADVICE = [
  'Drink plenty of warm water and stay hydrated.',
  'Avoid cold drinks, ice creams, and oily/spicy food for 5 days.',
  'Take steam inhalation twice daily.',
  'Review after 5 days if symptoms persist.',
];

// Fallback copy so language switching works immediately even without API config.
const FALLBACK_ADVICE = {
  hi: [
    'पर्याप्त मात्रा में गुनगुना पानी पिएं और हाइड्रेटेड रहें।',
    '5 दिनों तक ठंडे पेय, आइसक्रीम और तला-भुना/मसालेदार भोजन से बचें।',
    'दिन में दो बार भाप लें।',
    'लक्षण बने रहने पर 5 दिनों बाद पुनः जांच कराएं।',
  ],
  kn: [
    'ಹೆಚ್ಚಾಗಿ ಬಿಸಿಬಿಸಿ ನೀರು ಕುಡಿ ಮತ್ತು ದೇಹದಲ್ಲಿ ನೀರಿನ ಪ್ರಮಾಣ ಕಾಪಾಡಿ.',
    '5 ದಿನಗಳವರೆಗೆ ತಂಪು ಪಾನೀಯಗಳು, ಐಸ್ ಕ್ರೀಂ ಮತ್ತು ಎಣ್ಣೆ/ಖಾರ ಆಹಾರವನ್ನು ತಪ್ಪಿಸಿ.',
    'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಆವಿ ತೆಗೆದುಕೊಳ್ಳಿ.',
    'ಲಕ್ಷಣಗಳು ಮುಂದುವರಿದರೆ 5 ದಿನಗಳ ನಂತರ ಮರುಪರಿಶೀಲನೆಗೆ ಬನ್ನಿ.',
  ],
  ml: [
    'മതി വരുന്ന വിധം ഇളംചൂടുള്ള വെള്ളം കുടിച്ച് ശരീരത്തിലെ ജലാംശം നിലനിർത്തുക.',
    '5 ദിവസം തണുത്ത പാനീയങ്ങൾ, ഐസ്‌ക്രീം, എണ്ണയേറിയ/കാരം കൂടിയ ഭക്ഷണം ഒഴിവാക്കുക.',
    'ദിവസത്തിൽ രണ്ടുപ്രാവശ്യം സ്റ്റീം ഇൻഹലേഷൻ ചെയ്യുക.',
    'ലക്ഷണങ്ങൾ തുടർന്നാൽ 5 ദിവസത്തിന് ശേഷം വീണ്ടും പരിശോധനക്ക് വരിക.',
  ],
};

export function PrescriptionPreviewScreen({ onEdit }) {
  const [language, setLanguage] = useState('en');
  const [adviceLines, setAdviceLines] = useState(ENGLISH_ADVICE);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationNote, setTranslationNote] = useState('');

  const languageLabel = useMemo(
    () => LANGUAGE_OPTIONS.find((lang) => lang.code === language)?.label ?? 'English',
    [language],
  );

  useEffect(() => {
    let cancelled = false;

    async function runTranslation() {
      if (language === 'en') {
        setAdviceLines(ENGLISH_ADVICE);
        setTranslationNote('');
        return;
      }

      // Immediate fallback for good UX even when API is missing/unavailable.
      if (FALLBACK_ADVICE[language]) {
        setAdviceLines(FALLBACK_ADVICE[language]);
        setTranslationNote('Using built-in translation copy');
      }

      setIsTranslating(true);
      try {
        const translated = await translateLines(ENGLISH_ADVICE, language);
        if (!cancelled && Array.isArray(translated) && translated.length === ENGLISH_ADVICE.length) {
          setAdviceLines(translated);
          setTranslationNote('Translated via Indic service');
        }
      } catch {
        if (!cancelled) {
          setTranslationNote('Using fallback translation');
        }
      } finally {
        if (!cancelled) {
          setIsTranslating(false);
        }
      }
    }

    runTranslation();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div className="flex-1 flex flex-col min-h-0 pt-20 md:pt-24">
      <div className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1f7a5c]/10 text-[#1f7a5c]">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-tight">Rx Preview</h1>
                <p className="text-xs text-gray-500">Draft for Mr. Sharma</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500 hidden md:block">Language</label>
              <select
                className="h-10 rounded-lg border-gray-300 bg-white text-sm font-medium text-slate-700 focus:ring-[#1f7a5c] focus:border-[#1f7a5c]"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={onEdit}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">edit</span>
                <span className="hidden sm:inline">Edit</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50" type="button">
                <span className="material-symbols-outlined text-[20px]">print</span>
                <span className="hidden sm:inline">Print</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#1f7a5c] rounded-lg hover:bg-[#165942] shadow-sm" type="button">
                <span className="material-symbols-outlined text-[20px]">download</span>
                <span>Download PDF</span>
              </button>
            </div>
          </div>
          <div className="pb-3 text-xs text-slate-500">
            Advice language: <span className="font-semibold text-slate-700">{languageLabel}</span>
            {isTranslating ? <span className="ml-2 text-[#1f7a5c]">Translating...</span> : null}
            {translationNote ? <span className="ml-2">({translationNote})</span> : null}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-8 px-4 sm:px-6">
        <div className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-md p-12">
          <header className="flex flex-col sm:flex-row gap-6 justify-between items-start border-b-2 border-[#1f7a5c]/20 pb-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-lg bg-[#1f7a5c]/10 flex items-center justify-center text-[#1f7a5c] shrink-0 overflow-hidden">
                <span className="material-symbols-outlined text-4xl">local_hospital</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1f7a5c] tracking-tight">City Care Clinic</h2>
                <p className="text-sm text-gray-600 mt-1">123, Main Road, City Center, District</p>
                <p className="text-sm text-gray-600">Ph: +91 98765 43210</p>
                <p className="text-sm text-gray-600">Email: contact@citycare.com</p>
              </div>
            </div>
            <div className="text-right sm:text-right text-left">
              <h3 className="text-xl font-bold text-gray-900">Dr. Rajesh Kumar</h3>
              <p className="text-sm font-medium text-[#1f7a5c]">MBBS, MD (General Medicine)</p>
              <p className="text-sm text-gray-500 mt-1">Reg No: 2456789</p>
              <p className="text-sm text-gray-500">Consultant Physician</p>
            </div>
          </header>

          <section className="bg-gray-50 rounded border border-gray-100 p-4 mb-6 flex flex-wrap gap-y-4 justify-between items-center text-sm">
            <div className="flex gap-6 flex-wrap">
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider">Patient Name</span>
                <span className="font-semibold text-gray-900 text-lg">Mr. Sharma</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider">Age / Sex</span>
                <span className="font-medium text-gray-900">45 Yrs / Male</span>
              </div>
              <div>
                <span className="text-gray-500 block text-xs uppercase tracking-wider">Weight</span>
                <span className="font-medium text-gray-900">72 kg</span>
              </div>
            </div>
            <div>
              <span className="text-gray-500 block text-xs uppercase tracking-wider text-right">Date</span>
              <span className="font-medium text-gray-900">24 Oct 2023</span>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div>
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Diagnosis</h4>
              <p className="text-gray-900 font-medium">Viral Fever, Upper Respiratory Tract Infection</p>
            </div>
            <div className="sm:text-right">
              <h4 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Vitals</h4>
              <p className="text-gray-900 font-medium">BP: <span className="text-gray-700">120/80 mmHg</span> | Pulse: <span className="text-gray-700">72 bpm</span> | Temp: <span className="text-gray-700">100.2F</span></p>
            </div>
          </section>

          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-4xl font-serif font-bold text-[#1f7a5c] italic">Rx</h2>
            <div className="h-px bg-gray-200 flex-1 ml-4" />
          </div>

          <div className="overflow-hidden border border-gray-200 rounded-lg mb-8">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1f7a5c]/5 text-gray-700 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold">Medicine Name</th>
                  <th className="py-3 px-4 font-semibold">Dosage</th>
                  <th className="py-3 px-4 font-semibold w-24">Frequency</th>
                  <th className="py-3 px-4 font-semibold w-24">Duration</th>
                  <th className="py-3 px-4 font-semibold">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-4 px-4 text-center text-gray-500">1</td>
                  <td className="py-4 px-4"><span className="font-bold text-gray-900 block text-base">Tab. Dolo 650</span><span className="text-xs text-gray-500">(Paracetamol 650mg)</span></td>
                  <td className="py-4 px-4 text-gray-700">650mg</td>
                  <td className="py-4 px-4 font-mono font-medium text-[#1f7a5c]">1-0-1</td>
                  <td className="py-4 px-4 text-gray-700">3 Days</td>
                  <td className="py-4 px-4 text-gray-600">After Food</td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="py-4 px-4 text-center text-gray-500">2</td>
                  <td className="py-4 px-4"><span className="font-bold text-gray-900 block text-base">Cap. Amoxyclav 625</span><span className="text-xs text-gray-500">(Amoxycillin + Clavulanic Acid)</span></td>
                  <td className="py-4 px-4 text-gray-700">625mg</td>
                  <td className="py-4 px-4 font-mono font-medium text-[#1f7a5c]">1-0-1</td>
                  <td className="py-4 px-4 text-gray-700">5 Days</td>
                  <td className="py-4 px-4 text-gray-600">After Food</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 text-center text-gray-500">3</td>
                  <td className="py-4 px-4"><span className="font-bold text-gray-900 block text-base">Tab. Pantocid 40</span><span className="text-xs text-gray-500">(Pantoprazole 40mg)</span></td>
                  <td className="py-4 px-4 text-gray-700">40mg</td>
                  <td className="py-4 px-4 font-mono font-medium text-[#1f7a5c]">1-0-0</td>
                  <td className="py-4 px-4 text-gray-700">5 Days</td>
                  <td className="py-4 px-4 text-gray-600">Before Breakfast</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-[#1f7a5c]/5 rounded-lg p-5 border border-[#1f7a5c]/10 mb-8">
            <h5 className="text-[#1f7a5c] font-bold mb-3">Doctor's Advice / Diet</h5>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-1">
              {adviceLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
