import pytest
from app.services.language_detector import language_detector

def test_language_detection_native_scripts():
    # Tamil
    ta_text = "வணக்கம், என் ஆர்டர் நிலவரம் என்ன?"
    lang, conf = language_detector.detect(ta_text)
    assert lang == "ta"
    assert conf >= 0.75

    # Hindi
    hi_text = "नमस्ते, मुझे अपने पार्सल की स्थिति जाननी है।"
    lang, conf = language_detector.detect(hi_text)
    assert lang == "hi"
    assert conf >= 0.75

    # Telugu
    te_text = "నమస్కారం, నా ఆర్డర్ ఎప్పుడు వస్తుంది?"
    lang, conf = language_detector.detect(te_text)
    assert lang == "te"
    assert conf >= 0.75

    # Malayalam
    ml_text = "നമസ്കാരം, എന്റെ ഓർഡർ വിവരങ്ങൾ അറിയണം."
    lang, conf = language_detector.detect(ml_text)
    assert lang == "ml"
    assert conf >= 0.75

    # English
    en_text = "Hello, what is the warranty policy for your AI gateway?"
    lang, conf = language_detector.detect(en_text)
    assert lang == "en"

def test_transliterated_scripts():
    # Tanglish
    tanglish = "vanakkam, ennoda order status theriyuma?"
    lang, _ = language_detector.detect(tanglish)
    assert lang == "ta"

    # Hinglish
    hinglish = "namaste, mera order kab aayega?"
    lang, _ = language_detector.detect(hinglish)
    assert lang == "hi"

    # Teluglish (Telugu-English)
    teluglish = "namaskaram, naa product delivery eppudu vastundi?"
    lang, _ = language_detector.detect(teluglish)
    assert lang == "te"

    # Manglish (Malayalam-English)
    manglish = "namaskaram, ente complaint status onnu parayamo?"
    lang, _ = language_detector.detect(manglish)
    assert lang == "ml"

def test_code_mixed_marker_detection():
    # Detect code-mixing marker
    mixed_ta, lang_ta = language_detector.is_code_mixed("Please order status sollunga")
    assert mixed_ta is True
    assert lang_ta == "ta"

    mixed_hi, lang_hi = language_detector.is_code_mixed("Tracking details turant bataiye")
    assert mixed_hi is True
    assert lang_hi == "hi"

    mixed_te, lang_te = language_detector.is_code_mixed("Delivery updates eppudu cheppandi")
    assert mixed_te is True
    assert lang_te == "te"

def test_conversational_language_continuity():
    # Previous turn was Tamil; current turn is generic affirmation "yes sure"
    lang, _ = language_detector.detect("yes", previous_language="ta")
    assert lang == "ta"

    lang_hi, _ = language_detector.detect("ok", previous_language="hi")
    assert lang_hi == "hi"

def test_runtime_language_extension():
    # Extensible architecture: register Kannada
    language_detector.register_language(
        code="kn",
        name="Kannada (ಕನ್ನಡ)",
        script_regex=r'[\u0C80-\u0CFF]',
        keywords=["namaskara", "hegiddeera", "nanna", "beku"]
    )
    kn_text = "ನಮಸ್ಕಾರ, ನನ್ನ ಆರ್ಡರ್ ವಿವರ ಬೇಕು"
    lang, conf = language_detector.detect(kn_text)
    assert lang == "kn"
    assert conf >= 0.75
