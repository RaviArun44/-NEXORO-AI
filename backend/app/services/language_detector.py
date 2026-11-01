import re
from typing import Dict, Tuple, List, Optional, Set

class MultilingualDetector:
    """
    Enterprise-Grade Multilingual & Code-Mixed Language Identification Engine for Khaira Company.
    Supports:
    - Native scripts: Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), Malayalam (മലയാളം), English.
    - Romanized / Transliterated colloquialisms: Tanglish, Hinglish, Teluglish, Manglish.
    - Code-mixed sentences (e.g. "order status theriyuma", "delivery eppudu vastundi", "parcel kab milega").
    - Mid-call seamless language switching detection.
    - Extensible architecture for registering additional Indian (Kannada, Marathi, Bengali, Gujarati)
      and International (Spanish, French, Arabic, German) languages.
    """
    
    NATIVE_RANGES: Dict[str, re.Pattern] = {
        "ta": re.compile(r'[\u0B80-\u0BFF]'), # Tamil
        "hi": re.compile(r'[\u0900-\u097F]'), # Devanagari / Hindi & Marathi
        "te": re.compile(r'[\u0C00-\u0C7F]'), # Telugu
        "ml": re.compile(r'[\u0D00-\u0D7F]'), # Malayalam
        "kn": re.compile(r'[\u0C80-\u0CFF]'), # Kannada (extensible)
        "bn": re.compile(r'[\u0980-\u09FF]'), # Bengali (extensible)
        "gu": re.compile(r'[\u0A80-\u0AFF]'), # Gujarati (extensible)
        "ar": re.compile(r'[\u0600-\u06FF]'), # Arabic (extensible)
    }
    
    LATIN_KEYWORDS: Dict[str, List[str]] = {
        "ta": [
            "vanakkam", "nandri", "eppadi", "irukinga", "sollunga", "ennoda", "order", 
            "theriyuma", "romba", "nalla", "illai", "aama", "kedaikkuma", "pesanum",
            "vilai", "enna", "ungalukku", "thodarbu", "enakku", "epdi", "irukku", "kudunga",
            "theriyum", "thappa", "panradhu", "ippo", "naalaikku", "neram",
            "varuma", "illaye", "solla", "mudiyuma", "panreenga", "konjam", "kaelunga",
            "pathil", "solunga", "vanga", "ponga", "parunga", "venum", "edhuvum",
            "vaanga", "kooda", "kaetka", "sevai", "kattanam", "anuppunga", "thirumba"
        ],
        "hi": [
            "namaste", "namaskar", "kaise", "kya", "mera", "meri", "hai", "karo", "kripya",
            "chahiye", "dhanyawad", "shukriya", "batao", "batayein", "nahi", "haan",
            "kitna", "keemat", "madad", "baat", "karna", "kab", "aayega", "hoga", "mujhe",
            "aapka", "kijiye", "bataiye", "samay", "milna", "shikayat", "bhejo", "paise",
            "sahi", "galat", "thik", "achha", "suneye", "boliye", "kripaya", "suvidha",
            "sampark", "pata", "adhikari", "turant", "pahunchega", "jaankari", "bataen"
        ],
        "te": [
            "namaskaram", "ela", "unnaru", "cheppandi", "naa", "kavale", "dhanyavadalu",
            "enti", "ledu", "avunu", "kavali", "sahayam", "matladali", "dharalu", "eppudu",
            "vastundi", "chudandi", "naku", "meeru", "teliyadu", "cheyandi", "adagali",
            "koddiga", "cheppara", "samacharam", "viluva", "dhanyavadamulu", "ippudu",
            "repati", "samayam", "kharchu", "sahayamu", "vivaralu", "paristithi"
        ],
        "ml": [
            "namaskaram", "sukhamano", "parayu", "ente", "venam", "nanni", "illa", "athe",
            "enthane", "sahayam", "samsarikkanam", "vila", "eppozhum", "varum", "ariyamo",
            "karyam", "parayamo", "choikkanam", "pettannu", "onnu", "cheyyamo", "innu",
            "naale", "samayam", "pasham", "thirike", "parayan", "njan", "enthaanu"
        ],
        "kn": [
            "namaskara", "hegiddeera", "nanna", "beku", "dhanyavada", "illa", "houdu",
            "enu", "sahaya", "mathanadabeku", "bele", "yaavaga", "baruththe", "thiliyaadu"
        ]
    }

    LANGUAGE_NAMES: Dict[str, str] = {
        "en": "English",
        "ta": "Tamil (தமிழ்)",
        "hi": "Hindi (हिन्दी)",
        "te": "Telugu (తెలుగు)",
        "ml": "Malayalam (മലയാളം)",
        "kn": "Kannada (ಕನ್ನಡ)",
        "mr": "Marathi (मराठी)",
        "bn": "Bengali (বাংলা)",
        "gu": "Gujarati (ગુજરાતી)",
        "es": "Spanish (Español)",
        "fr": "French (Français)",
        "ar": "Arabic (العربية)"
    }

    # Code-mixed indicator tokens frequently paired with English
    CODE_MIX_MARKERS: Dict[str, Set[str]] = {
        "ta": {"sollunga", "theriyuma", "kedaikkuma", "irukku", "panreenga", "konjam", "venum", "ippo", "pesanum"},
        "hi": {"bataiye", "kripya", "chahiye", "aayega", "hoga", "madad", "shikayat", "batao", "turant"},
        "te": {"cheppandi", "eppudu", "vastundi", "kavali", "sahayam", "matladali", "vivaralu"},
        "ml": {"parayamo", "ariyamo", "venam", "samsarikkanam", "cheyyamo", "pettannu"}
    }

    def __init__(self):
        self._custom_keywords: Dict[str, List[str]] = {}

    def register_language(self, code: str, name: str, script_regex: Optional[str] = None, keywords: Optional[List[str]] = None):
        """
        Extensible registry method allowing runtime registration of new regional or international languages.
        """
        self.LANGUAGE_NAMES[code] = name
        if script_regex:
            self.NATIVE_RANGES[code] = re.compile(script_regex)
        if keywords:
            self.LATIN_KEYWORDS[code] = [k.lower() for k in keywords]

    def detect(self, text: str, previous_language: Optional[str] = None) -> Tuple[str, float]:
        """
        Detects primary language code and confidence score (0.0 - 1.0).
        Evaluates:
        1. Native Unicode script ranges (Tamil, Hindi, Telugu, Malayalam, etc.)
        2. Transliterated / romanized keywords (Tanglish, Hinglish, Teluglish, Manglish)
        3. Code-mixed English + Regional patterns
        4. Contextual stickiness with hysteresis (preserves language unless explicit switch detected)
        """
        if not text or not text.strip():
            return previous_language or "en", 1.0
            
        clean_text = text.strip()
        total_chars = len(clean_text)
        
        # 1. Check native Unicode scripts first
        script_counts: Dict[str, int] = {}
        for lang, pattern in self.NATIVE_RANGES.items():
            matches = len(pattern.findall(clean_text))
            if matches > 0:
                script_counts[lang] = matches
                
        if script_counts:
            dominant_lang = max(script_counts, key=script_counts.get)
            match_chars = script_counts[dominant_lang]
            ratio = match_chars / max(1, (total_chars * 0.35))
            confidence = min(1.0, 0.78 + (ratio * 0.22))
            return dominant_lang, round(confidence, 2)

        # 2. Check transliterated Latin keywords (Tanglish, Hinglish, etc.)
        lower_words = set(re.findall(r'\b[a-zA-Z]+\b', clean_text.lower()))
        translit_scores: Dict[str, int] = {}
        
        for lang, keywords in self.LATIN_KEYWORDS.items():
            # Match keywords
            matched_kw = lower_words.intersection(set(keywords))
            score = len(matched_kw)
            # Give bonus if code-mix marker is present
            if lang in self.CODE_MIX_MARKERS:
                marker_hits = lower_words.intersection(self.CODE_MIX_MARKERS[lang])
                score += len(marker_hits) * 2
            if score > 0:
                translit_scores[lang] = score

        if translit_scores:
            dominant_translit = max(translit_scores, key=translit_scores.get)
            count = translit_scores[dominant_translit]
            confidence = min(0.96, 0.65 + (count * 0.12))
            return dominant_translit, round(confidence, 2)

        # 3. If previous language was non-English and current query has generic English words (e.g. "yes", "ok", "sure", "no"),
        # maintain conversational language continuity unless clear English switch phrase appears
        generic_confirmations = {"yes", "ok", "okay", "no", "sure", "thanks", "thank you", "hello", "hi"}
        if previous_language and previous_language != "en":
            if lower_words.issubset(generic_confirmations):
                return previous_language, 0.85

        # Default fallback to English
        return "en", 0.90

    def is_code_mixed(self, text: str) -> Tuple[bool, Optional[str]]:
        """
        Determines whether a message is code-mixed (e.g. Tamil words written with English words).
        Returns (is_mixed, dominant_indian_lang).
        """
        words = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))
        for lang, markers in self.CODE_MIX_MARKERS.items():
            if words.intersection(markers):
                return True, lang
        return False, None

language_detector = MultilingualDetector()
