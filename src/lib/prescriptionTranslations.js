/**
 * Static translations for prescription terms.
 * Keys are English strings; values are objects keyed by language code.
 *
 * Fields that are NOT translated: medicine name, dosage/qty, header, footer.
 * Fields translated: section headings, field labels, frequency (Morning/Afternoon/Night),
 *   timing (Before Food, After Food, etc.), duration ("Days"), advice text.
 */

const LANGUAGES = [
  { code: 'kn', label: 'ಕನ್ನಡ', labelEn: 'Kannada' },
  { code: 'hi', label: 'हिन्दी', labelEn: 'Hindi' },
  { code: 'ta', label: 'தமிழ்', labelEn: 'Tamil' },
  { code: 'te', label: 'తెలుగు', labelEn: 'Telugu' },
  { code: 'ml', label: 'മലയാളം', labelEn: 'Malayalam' },
];

const DICT = {
  // Section headings
  'Patient Information': {
    kn: 'ರೋಗಿಯ ಮಾಹಿತಿ', hi: 'रोगी की जानकारी', ta: 'நோயாளி தகவல்', te: 'రోగి సమాచారం', ml: 'രോഗി വിവരങ്ങൾ',
  },
  'Medication Details': {
    kn: 'ಔಷಧ ವಿವರಗಳು', hi: 'दवा विवरण', ta: 'மருந்து விவரங்கள்', te: 'మందుల వివరాలు', ml: 'മരുന്ന് വിവരങ്ങൾ',
  },
  'Nutrition Advice': {
    kn: 'ಪೋಷಣೆ ಸಲಹೆ', hi: 'पोषण सलाह', ta: 'ஊட்டச்சத்து ஆலோசனை', te: 'పోషణ సలహా', ml: 'പോഷകാഹാര ഉപദേശം',
  },
  'Exercise & Activity': {
    kn: 'ವ್ಯಾಯಾಮ ಮತ್ತು ಚಟುವಟಿಕೆ', hi: 'व्यायाम और गतिविधि', ta: 'உடற்பயிற்சி & செயல்பாடு', te: 'వ్యాయామం & కార్యకలాపం', ml: 'വ്യായാമവും പ്രവർത്തനവും',
  },

  // Patient info labels
  'Patient Name': {
    kn: 'ರೋಗಿಯ ಹೆಸರು', hi: 'रोगी का नाम', ta: 'நோயாளியின் பெயர்', te: 'రోగి పేరు', ml: 'രോഗിയുടെ പേര്',
  },
  'Age / Gender': {
    kn: 'ವಯಸ್ಸು / ಲಿಂಗ', hi: 'आयु / लिंग', ta: 'வயது / பாலினம்', te: 'వయస్సు / లింగం', ml: 'പ്രായം / ലിംഗം',
  },
  'Date': {
    kn: 'ದಿನಾಂಕ', hi: 'तारीख', ta: 'தேதி', te: 'తేదీ', ml: 'തീയതി',
  },
  'Patient ID': {
    kn: 'ರೋಗಿ ಐಡಿ', hi: 'रोगी आईडी', ta: 'நோயாளி ஐடி', te: 'రోగి ఐడి', ml: 'രോഗി ഐഡി',
  },

  // Table headers
  'Medicine Name': {
    kn: 'ಔಷಧದ ಹೆಸರು', hi: 'दवा का नाम', ta: 'மருந்தின் பெயர்', te: 'మందు పేరు', ml: 'മരുന്നിന്റെ പേര്',
  },
  'Qty / Dose': {
    kn: 'ಪ್ರಮಾಣ / ಡೋಸ್', hi: 'मात्रा / खुराक', ta: 'அளவு / மருந்தளவு', te: 'మోతాదు / డోస్', ml: 'അളവ് / ഡോസ്',
  },
  'Frequency': {
    kn: 'ಆವರ್ತನ', hi: 'आवृत्ति', ta: 'அடிக்கடி', te: 'ఆవృత్తి', ml: 'ആവൃത്തി',
  },
  'Duration': {
    kn: 'ಅವಧಿ', hi: 'अवधि', ta: 'கால அளவு', te: 'వ్యవధి', ml: 'കാലാവധി',
  },

  // Frequency terms
  'Morning': {
    kn: 'ಬೆಳಿಗ್ಗೆ', hi: 'सुबह', ta: 'காலை', te: 'ఉదయం', ml: 'രാവിലെ',
  },
  'Afternoon': {
    kn: 'ಮಧ್ಯಾಹ್ನ', hi: 'दोपहर', ta: 'மதியம்', te: 'మధ్యాహ్నం', ml: 'ഉച്ച',
  },
  'Night': {
    kn: 'ರಾತ್ರಿ', hi: 'रात', ta: 'இரவு', te: 'రాత్రి', ml: 'രാത്രി',
  },

  // Timing
  'Before Food': {
    kn: 'ಊಟಕ್ಕೆ ಮೊದಲು', hi: 'खाने से पहले', ta: 'உணவுக்கு முன்', te: 'భోజనానికి ముందు', ml: 'ഭക്ഷണത്തിന് മുമ്പ്',
  },
  'After Food': {
    kn: 'ಊಟದ ನಂತರ', hi: 'खाने के बाद', ta: 'உணவுக்குப் பின்', te: 'భోజనం తర్వాత', ml: 'ഭക്ഷണത്തിന് ശേഷം',
  },
  'With Food': {
    kn: 'ಊಟದೊಂದಿಗೆ', hi: 'खाने के साथ', ta: 'உணவுடன்', te: 'భోజనంతో', ml: 'ഭക്ഷണത്തോടൊപ്പം',
  },
  'Empty Stomach': {
    kn: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ', hi: 'खाली पेट', ta: 'வெறும் வயிற்றில்', te: 'ఖాళీ కడుపుతో', ml: 'വെറും വയറ്റിൽ',
  },
  'As Needed': {
    kn: 'ಅಗತ್ಯವಿದ್ದಂತೆ', hi: 'आवश्यकतानुसार', ta: 'தேவையான போது', te: 'అవసరమైనప్పుడు', ml: 'ആവശ്യാനുസരണം',
  },
  'SOS': {
    kn: 'ಅಗತ್ಯವಿದ್ದಾಗ', hi: 'आवश्यकतानुसार', ta: 'அவசரத்தில்', te: 'అవసరమైనపుడు', ml: 'ആവശ്യമുള്ളപ്പോൾ',
  },

  // Duration
  'Days': {
    kn: 'ದಿನಗಳು', hi: 'दिन', ta: 'நாட்கள்', te: 'రోజులు', ml: 'ദിവസങ്ങൾ',
  },

  // Gender
  'Male': {
    kn: 'ಪುರುಷ', hi: 'पुरुष', ta: 'ஆண்', te: 'పురుషుడు', ml: 'പുരുഷൻ',
  },
  'Female': {
    kn: 'ಮಹಿಳೆ', hi: 'महिला', ta: 'பெண்', te: 'స్త్రీ', ml: 'സ്ത്രീ',
  },
  'Other': {
    kn: 'ಇತರೆ', hi: 'अन्य', ta: 'மற்றவை', te: 'ఇతరం', ml: 'മറ്റുള്ളവ',
  },
};

/**
 * Translate a string using the static dictionary.
 * Returns the original string if no translation is found.
 */
export function t(text, langCode) {
  if (!langCode || langCode === 'en') return text;
  return DICT[text]?.[langCode] || text;
}

/**
 * Translate a frequency label like "Morning, Afternoon & Night (After Food)".
 * Translates each part individually using the dictionary.
 */
export function translateFrequency(freqLabel, langCode) {
  if (!langCode || langCode === 'en') return freqLabel;

  let result = freqLabel;
  // Translate timing in parentheses first
  const timingMatch = result.match(/\(([^)]+)\)/);
  if (timingMatch) {
    const translated = t(timingMatch[1], langCode);
    result = result.replace(`(${timingMatch[1]})`, `(${translated})`);
  }
  // Translate frequency words
  ['Morning', 'Afternoon', 'Night'].forEach((word) => {
    result = result.replace(new RegExp(`\\b${word}\\b`, 'g'), t(word, langCode));
  });
  return result;
}

/**
 * Translate duration like "5 Days" → "5 ದಿನಗಳು"
 */
export function translateDuration(durationStr, langCode) {
  if (!langCode || langCode === 'en' || !durationStr) return durationStr;
  return durationStr.replace(/\bDays?\b/gi, t('Days', langCode));
}

export { LANGUAGES };
