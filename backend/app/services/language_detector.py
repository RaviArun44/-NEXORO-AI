import re
from typing import Dict, Tuple

class MultilingualDetector:
    """
    Detects language among English (en), Tamil (ta), Hindi (hi), Telugu (te), and Malayalam (ml).
    Supports native Unicode script analysis and Latin transliterated keywords (Tanglish, Hinglish, etc.).
    """
    
    NATIVE_RANGES = {
        "ta": re.compile(r'[\u0B80-\u0BFF]'), # Tamil
        "hi": re.compile(r'[\u0900-\u097F]'), # Devanagari / Hindi
        "te": re.compile(r'[\u0C00-\u0C7F]'), # Telugu
        "ml": re.compile(r'[\u0D00-\u0D7F]'), # Malayalam
    }
    
    LATIN_KEYWORDS = {
        "ta": [
            "vanakkam", "nandri", "eppadi", "irukinga", "sollunga", "ennoda", "order", 
            "theriyuma", "romba", "nalla", "illai", "aama", "kedaikkuma", "pesanum",
            "vilai", "enna", "ungalukku", "thodarbu"
        ],
        "hi": [
            "namaste", "namaskar", "kaise", "kya", "mera", "meri", "hai", "karo", "kripya",
            "chahiye", "dhanyawad", "shukriya", "batao", "batayein", "nahi", "haan",
            "kitna", "keemat", "madad", "baat"
        ],
        "te": [
            "namaskaram", "ela", "unnaru", "cheppandi", "naa", "kavale", "dhanyavadalu",
            "enti", "ledu", "avunu", "kavali", "sahayam", "matladali", "dharalu"
        ],
        "ml": [
            "namaskaram", "sukhamano", "parayu", "ente", "venam", "nanni", "illa", "athe",
            "enthane", "sahayam", "samsarikkanam", "vila"
        ]
    }

    LANGUAGE_NAMES = {
        "en": "English",
        "ta": "Tamil (தமிழ்)",
        "hi": "Hindi (हिन्दी)",
        "te": "Telugu (తెలుగు)",
        "ml": "Malayalam (മലയാളം)"
    }

    @classmethod
    def detect(cls, text: str) -> Tuple[str, float]:
        """
        Detects primary language code and confidence score (0.0 - 1.0).
        """
        if not text or not text.strip():
            return "en", 1.0
            
        clean_text = text.strip()
        total_chars = len(clean_text)
        
        # 1. Check native Unicode scripts first
        script_counts: Dict[str, int] = {}
        for lang, pattern in cls.NATIVE_RANGES.items():
            matches = len(pattern.findall(clean_text))
            if matches > 0:
                script_counts[lang] = matches
                
        if script_counts:
            dominant_lang = max(script_counts, key=script_counts.get)
            ratio = script_counts[dominant_lang] / max(1, (total_chars * 0.4))
            return dominant_lang, min(1.0, 0.75 + (ratio * 0.25))

        # 2. Check transliterated Latin keywords (Tanglish, Hinglish, etc.)
        lower_words = set(re.findall(r'\b\w+\b', clean_text.lower()))
        translit_scores: Dict[str, int] = {}
        for lang, keywords in cls.LATIN_KEYWORDS.items():
            overlap = len(lower_words.intersection(set(keywords)))
            if overlap > 0:
                translit_scores[lang] = overlap

        if translit_scores:
            dominant_translit = max(translit_scores, key=translit_scores.get)
            count = translit_scores[dominant_translit]
            confidence = min(0.92, 0.60 + (count * 0.15))
            return dominant_translit, confidence

        # Default fallback to English
        return "en", 0.90

language_detector = MultilingualDetector()

