const INDIC_CODES = {
  en: 'eng_Latn',
  hi: 'hin_Deva',
  kn: 'kan_Knda',
  ml: 'mal_Mlym',
  ta: 'tam_Taml',
  te: 'tel_Telu',
};

const API_BASE = import.meta.env.VITE_TRANSLATION_API_URL;

const LOCAL_LINE_TRANSLATIONS = {
  'Drink warm water frequently': {
    hi: 'बार-बार गुनगुना पानी पिएं',
    kn: 'ಮತ್ತೊಮ್ಮೆ ಮತ್ತೊಮ್ಮೆ ಬೆಚ್ಚಗಿನ ನೀರನ್ನು ಕುಡಿಯಿರಿ',
    ml: 'ഇടയ്ക്കിടെ ചൂടുവെള്ളം കുടിക്കുക',
    ta: 'அடிக்கடி வெதுவெதுப்பான தண்ணீர் குடிக்கவும்',
    te: 'తరచుగా గోరువెచ్చని నీరు తాగండి',
  },
  'Take adequate rest': {
    hi: 'पर्याप्त आराम करें',
    kn: 'ಸಾಕಷ್ಟು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ',
    ml: 'മതിയായ വിശ്രമം എടുക്കുക',
    ta: 'போதுமான ஓய்வு எடுத்துக்கொள்ளவும்',
    te: 'తగినంత విశ్రాంతి తీసుకోండి',
  },
  'Eat light home-cooked food': {
    hi: 'हल्का घर का बना भोजन लें',
    kn: 'ತಿಳಿ ಮನೆಯಲ್ಲೇ ಮಾಡಿದ ಆಹಾರ ಸೇವಿಸಿ',
    ml: 'ലഘുവായ വീട്ടിൽ തയ്യാറാക്കിയ ഭക്ഷണം കഴിക്കുക',
    ta: 'இலகுவான வீட்டில் செய்த உணவை சாப்பிடுங்கள்',
    te: 'తేలికపాటి ఇంటి వంట ఆహారం తీసుకోండి',
  },
  'Bed rest until temperature settles': {
    hi: 'बुखार कम होने तक बिस्तर पर आराम करें',
    kn: 'ಜ್ವರ ಇಳಿಯುವವರೆಗೆ ಹಾಸಿಗೆಯಲ್ಲಿ ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ',
    ml: 'ചൂട് കുറഞ്ഞുവരുന്നത് വരെ കിടപ്പുവിശ്രമം തുടരുക',
    ta: 'காய்ச்சல் குறையும் வரை படுக்கை ஓய்வு எடுத்துக்கொள்ளுங்கள்',
    te: 'జ్వరం తగ్గే వరకు బెడ్ రెస్ట్ తీసుకోండి',
  },
  'Monitor temperature twice daily': {
    hi: 'तापमान दिन में दो बार जांचें',
    kn: 'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ತಾಪಮಾನ ಪರಿಶೀಲಿಸಿ',
    ml: 'ദിവസത്തിൽ രണ്ടുതവണ താപനില പരിശോധിക്കുക',
    ta: 'நாளுக்கு இருமுறை வெப்பநிலையை பரிசோதிக்கவும்',
    te: 'రోజుకు రెండుసార్లు ఉష్ణోగ్రతను పరిశీలించండి',
  },
  'Do steam inhalation twice daily': {
    hi: 'दिन में दो बार भाप लें',
    kn: 'ದಿನಕ್ಕೆ ಎರಡು ಬಾರಿ ಉಸಿರಾಟಕ್ಕೆ ಆವಿ ತೆಗೆದುಕೊಳ್ಳಿ',
    ml: 'ദിവസത്തിൽ രണ്ടുതവണ വെയ്പർ/ഓളം എടുക്കുക',
    ta: 'நாளுக்கு இருமுறை நீராவி ஈர்க்கவும்',
    te: 'రోజుకు రెండుసార్లు ఆవిరి పీల్చండి',
  },
  'Drink warm fluids': {
    hi: 'गर्म तरल पदार्थ पिएं',
    kn: 'ಬೆಚ್ಚಗಿನ ದ್ರವಗಳನ್ನು ಕುಡಿಯಿರಿ',
    ml: 'ചൂടുള്ള ദ്രാവകങ്ങൾ കുടിക്കുക',
    ta: 'சூடான திரவங்களை குடிக்கவும்',
    te: 'వెచ్చని ద్రవాలు తాగండి',
  },
  'Avoid cold beverages': {
    hi: 'ठंडे पेय से बचें',
    kn: 'ತಣ್ಣನೆಯ ಪಾನೀಯಗಳನ್ನು ತಪ್ಪಿಸಿ',
    ml: 'തണുത്ത പാനീയങ്ങൾ ഒഴിവാക്കുക',
    ta: 'குளிர்ந்த பானங்களை தவிர்க்கவும்',
    te: 'చల్లని పానీయాలను నివారించండి',
  },
  'Sleep with head elevated': {
    hi: 'सिर ऊंचा रखकर सोएं',
    kn: 'ತಲೆಯನ್ನು ಎತ್ತಿ ಮಲಗಿರಿ',
    ml: 'തല ഉയർത്തി ഉറങ്ങുക',
    ta: 'தலை உயர்த்தி தூங்கவும்',
    te: 'తలను ఎత్తి పెట్టుకుని నిద్రించండి',
  },
  'Avoid dust exposure': {
    hi: 'धूल के संपर्क से बचें',
    kn: 'ಧೂಳಿನ ಸಂಪರ್ಕವನ್ನು ತಪ್ಪಿಸಿ',
    ml: 'പൊടി സമ്പർക്കം ഒഴിവാക്കുക',
    ta: 'தூசி தொடர்பை தவிர்க்கவும்',
    te: 'దుమ్ము సంపర్కాన్ని నివారించండి',
  },
  'Warm saline gargles': {
    hi: 'गुनगुने नमक वाले पानी से गरारे करें',
    kn: 'ಬೆಚ್ಚಗಿನ ಉಪ್ಪುನೀರಿನಿಂದ ಗರಗರಿಸಿ',
    ml: 'ചൂടുവെള്ള ഉപ്പുവെള്ള ഗാർഗിൾ ചെയ്യുക',
    ta: 'வெதுவெதுப்பான உப்பு நீரில் களக்கவும்',
    te: 'గోరువెచ్చని ఉప్పునీటితో గార్గిల్ చేయండి',
  },
  'Take honey with warm water if suitable': {
    hi: 'उपयुक्त हो तो गुनगुने पानी के साथ शहद लें',
    kn: 'ಒಪ್ಪುವಂತಿದ್ದರೆ ಬೆಚ್ಚಗಿನ ನೀರಿನೊಂದಿಗೆ ಜೇನು ಸೇವಿಸಿ',
    ml: 'ഒത്തുവരുന്നുവെങ്കിൽ ചൂടുവെള്ളത്തോടൊപ്പം തേൻ കഴിക്കുക',
    ta: 'ஏற்றதாக இருந்தால் வெதுவெதுப்பான நீருடன் தேன் எடுத்துக்கொள்ளவும்',
    te: 'అనుకూలమైతే గోరువెచ్చని నీటితో తేనె తీసుకోండి',
  },
  'Avoid smoke and irritants': {
    hi: 'धुएं और एलर्जी पैदा करने वाली चीजों से बचें',
    kn: 'ಹೊಗೆ ಮತ್ತು ಕಿರಿಕಿರಿ ಉಂಟುಮಾಡುವ ಪದಾರ್ಥಗಳನ್ನು ತಪ್ಪಿಸಿ',
    ml: 'പുകയും അസ്വസ്ഥത ഉണ്ടാക്കുന്ന കാര്യങ്ങളും ഒഴിവാക്കുക',
    ta: 'புகை மற்றும் எரிச்சல் தருவனவற்றை தவிர்க்கவும்',
    te: 'పొగ మరియు రెచ్చగొట్టే పదార్థాలను నివారించండి',
  },
  'Rest voice and stay hydrated': {
    hi: 'आवाज़ को आराम दें और शरीर में पानी की कमी न होने दें',
    kn: 'ಗಂಟಲಿಗೆ ವಿಶ್ರಾಂತಿ ನೀಡಿ ಮತ್ತು ದೇಹದಲ್ಲಿ ನೀರಿನ ಕೊರತೆ ಆಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ',
    ml: 'ശബ്ദത്തിന് വിശ്രമം നൽകി ശരീരത്തിലെ ജലാംശം നിലനിർത്തുക',
    ta: 'குரலுக்கு ஓய்வு கொடுத்து நீர்ச்சத்தை பேணவும்',
    te: 'గొంతుకు విశ్రాంతి ఇచ్చి దేహంలో తేమ నిల్వ ఉండేలా చూడండి',
  },
  'Stay hydrated': {
    hi: 'पर्याप्त पानी पिएं',
    kn: 'ದೇಹದಲ್ಲಿ ನೀರಿನ ಮಟ್ಟವನ್ನು ಕಾಪಾಡಿಕೊಳ್ಳಿ',
    ml: 'ശരീരത്തിൽ ജലാംശം നിലനിർത്തുക',
    ta: 'நீர்ச்சத்தை பேணுங்கள்',
    te: 'శరీరంలో తేమ నిల్వ ఉండేలా చూసుకోండి',
  },
  'Avoid skipping meals': {
    hi: 'भोजन छोड़ना बंद करें',
    kn: 'ಊಟ ಬಿಡುವುದನ್ನು ತಪ್ಪಿಸಿ',
    ml: 'ഭക്ഷണം ഒഴിവാക്കാതിരിക്കുക',
    ta: 'உணவை தவிர்க்க வேண்டாம்',
    te: 'భోజనం మానేయకుండా ఉండండి',
  },
  'Limit caffeine excess': {
    hi: 'अत्यधिक कैफीन से बचें',
    kn: 'ಅತಿಯಾದ ಕ್ಯಾಫಿನ್ ಸೇವನೆ ತಪ್ಪಿಸಿ',
    ml: 'അധിക കഫീൻ ഒഴിവാക്കുക',
    ta: 'அதிக காபீனை தவிர்க்கவும்',
    te: 'అధిక కాఫీన్‌ను నివారించండి',
  },
  'Reduce screen time': {
    hi: 'स्क्रीन समय कम करें',
    kn: 'ಸ್ಕ್ರೀನ್ ಸಮಯವನ್ನು ಕಡಿಮೆ ಮಾಡಿ',
    ml: 'സ്ക്രീൻ സമയം കുറയ്ക്കുക',
    ta: 'திரை நேரத்தை குறைக்கவும்',
    te: 'స్క్రీన్ టైమ్ తగ్గించండి',
  },
  'Sleep adequately': {
    hi: 'पर्याप्त नींद लें',
    kn: 'ಸಾಕಷ್ಟು ನಿದ್ರೆ ಮಾಡಿರಿ',
    ml: 'മതിയായ ഉറക്കം ഉറപ്പാക്കുക',
    ta: 'போதுமான தூக்கம் பெறுங்கள்',
    te: 'తగినంత నిద్రపోండి',
  },
  'Avoid spicy and oily foods': {
    hi: 'मसालेदार और तैलीय भोजन से बचें',
    kn: 'ಖಾರದ ಮತ್ತು ಎಣ್ಣೆಯ ಆಹಾರವನ್ನು ತಪ್ಪಿಸಿ',
    ml: 'കാരം കൂടിയതും എണ്ണയേറിയതുമായ ഭക്ഷണം ഒഴിവാക്കുക',
    ta: 'காரமான மற்றும் எண்ணெய் உணவுகளை தவிர்க்கவும்',
    te: 'మసాలా మరియు నూనె పదార్థాలు ఉన్న ఆహారాన్ని నివారించండి',
  },
  'Eat small frequent meals': {
    hi: 'थोड़ा-थोड़ा करके बार-बार खाएं',
    kn: 'ಸ್ವಲ್ಪಸ್ವಲ್ಪವಾಗಿ ಅನೇಕ ಬಾರಿ ಊಟ ಮಾಡಿ',
    ml: 'ചെറുതായി പലവട്ടം ഭക്ഷണം കഴിക്കുക',
    ta: 'சிறிய அளவில் அடிக்கடி உணவு எடுத்துக்கொள்ளவும்',
    te: 'చిన్న చిన్న పరిమాణాల్లో తరచుగా భోజనం చేయండి',
  },
  'Avoid tea on empty stomach': {
    hi: 'खाली पेट चाय न पिएं',
    kn: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ಚಹಾ ಕುಡಿಯಬೇಡಿ',
    ml: 'വെറും വയറ്റിൽ ചായ കുടിക്കരുത്',
    ta: 'வெறும் வயிற்றில் தேநீர் குடிக்க வேண்டாம்',
    te: 'ఖాళీ కడుపుతో టీ తాగవద్దు',
  },
  'Do not lie down immediately after meals': {
    hi: 'भोजन के तुरंत बाद न लेटें',
    kn: 'ಊಟದ ತಕ್ಷಣ ಮಲಗಬೇಡಿ',
    ml: 'ഭക്ഷണത്തിന് ഉടൻ ശേഷം കിടക്കരുത്',
    ta: 'உணவுக்குப் பிறகு உடனே படுக்க வேண்டாம்',
    te: 'భోజనం చేసిన వెంటనే పడుకోకండి',
  },
  'Avoid late-night dinners': {
    hi: 'देर रात का भोजन करने से बचें',
    kn: 'ತಡರಾತ್ರಿ ಊಟವನ್ನು ತಪ್ಪಿಸಿ',
    ml: 'വൈകിയ രാത്രി ഭക്ഷണം ഒഴിവാക്കുക',
    ta: 'இரவு தாமதமாக உணவு சாப்பிட வேண்டாம்',
    te: 'రాత్రి ఆలస్యంగా భోజనం చేయడం నివారించండి',
  },
};

function translateLocally(line, targetLang) {
  return LOCAL_LINE_TRANSLATIONS[String(line || '').trim()]?.[targetLang] || null;
}

async function translateViaIndicTrans(lines, targetLang) {
  const source_language = INDIC_CODES.en;
  const target_language = INDIC_CODES[targetLang];

  const response = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      source_language,
      target_language,
      text: lines,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed with ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data?.translations)) return data.translations;
  if (Array.isArray(data?.translated_text)) return data.translated_text;
  if (Array.isArray(data)) return data;

  throw new Error('Unexpected translation response format');
}

async function translateViaGoogle(lines, targetLang) {
  const results = await Promise.all(
    lines.map(async (line) => {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(line)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Translate returned ${response.status}`);
      }
      const data = await response.json();
      return (data[0] || []).map((segment) => segment[0]).join('');
    }),
  );

  return results;
}

export async function translateLines(lines, targetLang) {
  if (targetLang === 'en' || !lines.length) {
    return lines;
  }

  const resolved = new Array(lines.length);
  const unresolved = [];

  lines.forEach((line, index) => {
    const local = translateLocally(line, targetLang);
    if (local) {
      resolved[index] = local;
      return;
    }
    unresolved.push({ index, line });
  });

  if (!unresolved.length) {
    return resolved;
  }

  try {
    const pendingLines = unresolved.map((item) => item.line);
    const translated = API_BASE
      ? await translateViaIndicTrans(pendingLines, targetLang)
      : await translateViaGoogle(pendingLines, targetLang);

    unresolved.forEach((item, idx) => {
      resolved[item.index] = translated[idx] || item.line;
    });
  } catch {
    unresolved.forEach((item) => {
      resolved[item.index] = item.line;
    });
  }

  return resolved.map((line, index) => line || lines[index]);
}
