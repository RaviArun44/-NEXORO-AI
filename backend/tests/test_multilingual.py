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
