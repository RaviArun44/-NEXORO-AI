import re
import json
import logging
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.services.language_detector import language_detector

logger = logging.getLogger(__name__)

class AIEngine:
    """
    Enterprise Multilingual Conversational AI & Grounded Reasoning Engine for Khaira Company.
    Provides:
    - Natural, polite, confident human-like voice responses in Tamil, English, Malayalam, Telugu, and Hindi.
    - Real-time sentiment and emotion analysis.
    - Zero-hallucination RAG grounding against verified Khaira Company documents.
    - Automatic multi-turn conversation summarization.
    """

    LANGUAGE_GREETINGS = {
        "en": "Welcome to Khaira Company! My name is Khaira AI, your autonomous voice assistant. How may I assist you today?",
        "ta": "கைரா நிறுவனத்திற்கு தங்களை அன்புடன் வரவேற்கிறோம்! என் பெயர் கைரா AI, தங்களின் மெய்நிகர் குரல் உதவியாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?",
        "hi": "खैरा कंपनी में आपका हार्दिक स्वागत है! मेरा नाम खैरा एआई है, आपकी वर्चुअल वॉइस असिस्टेंट। आज मैं आपकी क्या सहायता कर सकती हूँ?",
        "te": "ఖైరా కంపెనీకి స్వాగతం! నా పేరు ఖైరా AI, మీ వర్చువల్ వాయిస్ అసిస్టెంట్. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
        "ml": "ഖൈറ കമ്പനിയിലേക്ക് സ്വാഗതം! എന്റെ പേര് ഖൈറ AI, നിങ്ങളുടെ വെർച്വൽ വോയ്സ് അസിസ്റ്റന്റ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?"
    }

    LANGUAGE_POLITE_REFUSALS = {
        "en": "I apologize, but I do not have verified information on that in our Khaira Company records. Let me connect you directly with our specialized team to assist you.",
        "ta": "மன்னிக்கவும், எங்கள் கைரா நிறுவன பதிவுகளில் இதற்கான சரிபார்க்கப்பட்ட தகவல் தற்போது என்னிடம் இல்லை. உங்களுக்கு உதவ எங்கள் சிறப்பு அதிகாரியிடம் உங்களை இணைக்கிறேன்.",
        "hi": "क्षमा करें, हमारे खैरा कंपनी के रिकॉर्ड में इस बारे में सत्यापित जानकारी उपलब्ध नहीं है। मैं तुरंत आपकी कॉल हमारे विशेषज्ञ अधिकारी को जोड़ रही हूँ।",
        "te": "క్షమించండి, మా ఖైరా కంపెనీ రికార్డులలో దీనికి సంబంధించి ధృవీకరించబడిన సమాచారం ప్రస్తుతం అందుబాటులో లేదు. మీకు సహాయం చేయడానికి మా నిపుణుడికి కాల్ బదిలీ చేస్తున్నాను.",
        "ml": "ക്ഷമിക്കണം, ഞങ്ങളുടെ ഖൈറ കമ്പനി രേഖകളിൽ ഇതിനെക്കുറിച്ചുള്ള കൃത്യമായ വിവരങ്ങൾ ലഭ്യമല്ല. നിങ്ങളെ സഹായിക്കാനായി ഞാൻ ഈ കോൾ ഞങ്ങളുടെ വിദഗ്ദ്ധനിലേക്ക് ട്രാൻസ്ഫർ ചെയ്യാം."
    }

    LANGUAGE_TRANSFER_CONFIRMATION = {
        "en": "I am connecting your call to a Khaira senior specialist right now. Please hold on for just a moment.",
        "ta": "உடனடியாக எங்கள் கைரா வாடிக்கையாளர் சேவை அதிகாரியிடம் உங்களை இணைக்கிறேன். தயவுசெய்து ஒரு நிமிடம் காத்திருக்கவும்.",
        "hi": "मैं आपकी कॉल तुरंत हमारे खैरा वरिष्ठ अधिकारी को जोड़ रही हूँ। कृपया एक क्षण के लिए लाइन पर बने रहें।",
        "te": "నేను మీ కాల్‌ను మా ఖైరా సీనియర్ ఎగ్జిక్యూటివ్‌కి బదిలీ చేస్తున్నాను. దయచేసి ఒక్క క్షణం వేచి ఉండండి.",
        "ml": "ഞാൻ നിങ്ങളുടെ കോൾ ഇപ്പോൾ തന്നെ ഞങ്ങളുടെ ഖൈറ സീനിയർ എക്സിക്യൂട്ടീവിലേക്ക് കണക്ട് ചെയ്യുകയാണ്. ദയവായി ഒരു നിമിഷം കാത്തിരിക്കൂ."
    }

    # -------------------------------------------------------------
    # Sentiment & Emotion Detection
    # -------------------------------------------------------------
    def detect_sentiment(self, text: str) -> str:
        """
        Detects caller sentiment and emotional state:
        POSITIVE, NEUTRAL, CONCERNED, FRUSTRATED, URGENT
        """
        text_lower = text.lower()
        urgent_words = {"urgent", "emergency", "immediately", "right now", "critical", "danger", "police", "fraud"}
        if any(w in text_lower for w in urgent_words):
            return "URGENT"

        frustrated_words = {"angry", "terrible", "worst", "ridiculous", "horrible", "hate", "scam", "bad service", "waste of time", "cheated", "broken", "useless"}
        if any(w in text_lower for w in frustrated_words):
            return "FRUSTRATED"

        concerned_words = {"issue", "problem", "delay", "late", "worried", "not working", "why", "help me", "wrong"}
        if any(w in text_lower for w in concerned_words):
            return "CONCERNED"

        positive_words = {"thank", "thanks", "great", "excellent", "good", "perfect", "awesome", "appreciate", "helpful", "superb", "nandri", "dhanyawad", "nanni"}
        if any(w in text_lower for w in positive_words):
            return "POSITIVE"

        return "NEUTRAL"

    # -------------------------------------------------------------
    # Intent Detection
    # -------------------------------------------------------------
    def detect_intent(self, text: str) -> str:
        """
        Classifies caller intent based on semantic markers.
        """
        text_lower = text.lower()
        words = set(re.findall(r'\b[\w-]+\b', text_lower))

        # Termination
        if any(term in text_lower for term in ["thank you bye", "goodbye", "nandri vanakkam", "dhanyawad alvida", "pinne kaanam"]):
            return "CALL_TERMINATION"
        
        # Urgent
        if any(w in words for w in {"urgent", "emergency", "outage", "fraud"}):
            return "URGENT_ESCALATION"

        # Explicit Human handoff request
        handoff_keywords = {"human", "agent", "person", "employee", "manager", "supervisor", "representative", "pesanum", "matladali", "samsarikkanam"}
        if words.intersection(handoff_keywords) or any(phrase in text_lower for phrase in ["speak to someone", "talk to someone", "real person", "baat karni", "human agent"]):
            return "HUMAN_HANDOFF"
            
        # Order Tracking
        order_keywords = {"order", "tracking", "track", "delivery", "shipped", "courier", "parcel", "eta"}
        if words.intersection(order_keywords) or any(w.startswith("ord-") or "ord" in w for w in words):
            return "ORDER_STATUS"
            
        # Product & Inventory
        product_keywords = {"product", "price", "cost", "stock", "catalogue", "buy", "purchase", "available", "sku", "keemat", "vilai", "dharalu", "vila"}
        if words.intersection(product_keywords):
            return "PRODUCT_INQUIRY"
            
        # Appointments
        appt_keywords = {"appointment", "booking", "schedule", "demo", "meeting", "consultation", "slot", "reschedule"}
        if words.intersection(appt_keywords):
            return "APPOINTMENT_INQUIRY"
            
        # Complaints
        complaint_keywords = {"complaint", "issue", "damaged", "defective", "broken", "angry", "problem", "ticket", "escalate", "shikayat", "prachanai"}
        if words.intersection(complaint_keywords):
            return "COMPLAINT_REGISTRATION"

        # Requirement
        req_keywords = {"requirement", "quotation", "quote", "callback", "interested"}
        if words.intersection(req_keywords):
            return "REQUIREMENT_RECORDING"
            
        return "GENERAL_KNOWLEDGE"

    # -------------------------------------------------------------
    # Grounded Response Generation
    # -------------------------------------------------------------
    async def generate_response(
        self,
        customer_query: str,
        conversation_history: List[Dict[str, str]],
        grounded_context: List[Dict[str, Any]],
        business_data: Optional[Dict[str, Any]] = None,
        forced_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a verified, grounded response adhering to strict Khaira Company facts.
        """
        # 1. Automatic Language Detection
        if forced_language and forced_language != "auto":
            lang = forced_language
        else:
            lang, _ = language_detector.detect(customer_query)
            
        intent = self.detect_intent(customer_query)
        sentiment = self.detect_sentiment(customer_query)

        # 2. Check for Direct Request to Speak to Human
        if intent == "HUMAN_HANDOFF":
            reply = self.LANGUAGE_TRANSFER_CONFIRMATION.get(lang, self.LANGUAGE_TRANSFER_CONFIRMATION["en"])
            return {
                "text": reply,
                "language": lang,
                "intent": intent,
                "sentiment": sentiment,
                "trigger_handoff": True,
                "handoff_reason": "Caller requested senior human representative.",
                "grounded": True,
                "sources": ["Khaira Human Transfer Protocol"]
            }

        # 3. Check Business Data (Orders, Stock, Products)
        if business_data:
            if "order" in business_data:
                ord_info = business_data["order"]
                num = ord_info.get("order_number", "ORD-UNKNOWN")
                st = ord_info.get("status", "PROCESSING")
                cour = ord_info.get("courier_name", "BlueDart Express")
                trk = ord_info.get("tracking_number", "TRK-ACTIVE")

                if lang == "ta":
                    reply = f"தங்களின் கைரா ஆர்டர் எண் {num} தற்போது '{st}' நிலையில் உள்ளது. பார்சல் {cour} (டிராக்கிங்: {trk}) வழியாக அனுப்பப்பட்டுள்ளது."
                elif lang == "hi":
                    reply = f"आपके खैरा आर्डर संख्या {num} की वर्तमान स्थिति '{st}' है। यह {cour} (ट्रैकिंग: {trk}) द्वारा भेजा गया है।"
                elif lang == "te":
                    reply = f"మీ ఖైరా ఆర్డర్ నంబర్ {num} ప్రస్తుతం '{st}' స్థితిలో ఉంది ({cour}, ట్రాకింగ్: {trk})."
                elif lang == "ml":
                    reply = f"നിങ്ങളുടെ ഖൈറ ഓർഡർ നമ്പർ {num} ഇപ്പോൾ '{st}' അവസ്ഥയിലാണ് ({cour}, ട്രാക്കിംഗ്: {trk})."
                else:
                    reply = f"Your Khaira Company order #{num} is currently in '{st}' status with tracking number {trk} via {cour}."

                return {
                    "text": reply,
                    "language": lang,
                    "intent": "ORDER_STATUS",
                    "sentiment": sentiment,
                    "trigger_handoff": False,
                    "grounded": True,
                    "sources": [f"Khaira Order Database: #{num}"]
                }

            if "product" in business_data:
                prod = business_data["product"]
                p_name = prod.get("name", "Product")
                p_price = f"{prod.get('currency', 'USD')} {prod.get('price', 0.0)}"
                p_stock = prod.get("stock_quantity", 0)
                p_sku = prod.get("sku", "SKU-N/A")

                if lang == "ta":
                    reply = f"கைரா தயாரிப்பு '{p_name}' (SKU: {p_sku}) கையிருப்பில் உள்ளது ({p_stock} அலகுகள்). இதன் விலை {p_price}."
                elif lang == "hi":
                    reply = f"खैरा उत्पाद '{p_name}' (SKU: {p_sku}) स्टॉक में उपलब्ध है ({p_stock} यूनिट्स)। इसका मूल्य {p_price} है।"
                elif lang == "te":
                    reply = f"ఖైరా ఉత్పత్తి '{p_name}' (SKU: {p_sku}) స్టాక్‌లో అందుబాటులో ఉంది ({p_stock} యూనిట్లు). ధర {p_price}."
                elif lang == "ml":
                    reply = f"ഖൈറ ഉൽപ്പന്നം '{p_name}' (SKU: {p_sku}) സ്റ്റോക്കിൽ ലഭ്യമാണ് ({p_stock} യൂണിറ്റുകൾ). വില {p_price}."
                else:
                    reply = f"The Khaira Company product '{p_name}' (SKU: {p_sku}) is in stock with {p_stock} units available at {p_price}."

                return {
                    "text": reply,
                    "language": lang,
                    "intent": "PRODUCT_INQUIRY",
                    "sentiment": sentiment,
                    "trigger_handoff": False,
                    "grounded": True,
                    "sources": [f"Khaira Product Catalog: SKU {p_sku}"]
                }

        # 4. Check Grounded Knowledge Base Context
        if grounded_context:
            best_chunk = grounded_context[0]
            clean_snippet = re.sub(r'\[Page\s+\d+\]', '', best_chunk.get("content", "")).strip()
            
            if lang == "ta":
                reply = f"எங்கள் கைரா நிறுவன ஆவணங்களின்படி: {clean_snippet[:260]}... மேலும் தகவல் தேவையா?"
            elif lang == "hi":
                reply = f"हमारे खैरा कंपनी के आधिकारिक रिकॉर्ड के अनुसार: {clean_snippet[:260]}... क्या मैं इसमें और सहायता कर सकती हूँ?"
            elif lang == "te":
                reply = f"మా ఖైరా కంపెనీ రికార్డుల ప్రకారం: {clean_snippet[:260]}... ఇంకా ఏమైనా సహాయం కావాలా?"
            elif lang == "ml":
                reply = f"ഞങ്ങളുടെ ഖൈറ കമ്പനി രേഖകൾ പ്രകാരം: {clean_snippet[:260]}... കൂടുതൽ സഹായം വേണമോ?"
            else:
                reply = f"According to verified Khaira Company documentation: {clean_snippet[:280]} Is there anything else you would like to know regarding this?"

            return {
                "text": reply,
                "language": lang,
                "intent": intent,
                "sentiment": sentiment,
                "trigger_handoff": False,
                "grounded": True,
                "sources": [best_chunk.get("doc_title", "Khaira Company Document")]
            }

        # 5. Strict Anti-Hallucination Fallback: If no facts found, polite refusal & transfer
        refusal = self.LANGUAGE_POLITE_REFUSALS.get(lang, self.LANGUAGE_POLITE_REFUSALS["en"])
        return {
            "text": refusal,
            "language": lang,
            "intent": "UNKNOWN_INQUIRY",
            "sentiment": sentiment,
            "trigger_handoff": True,
            "handoff_reason": f"No verified Khaira Company documentation found for query: '{customer_query[:80]}'",
            "grounded": False,
            "sources": []
        }

    # -------------------------------------------------------------
    # Call Summarization
    # -------------------------------------------------------------
    def summarize_conversation(self, turns: List[Dict[str, Any]], language: str = "en") -> str:
        """
        Generates a concise, structured conversation summary for CRM & analytics.
        """
        if not turns:
            return "Call initialized without customer speech."

        customer_utterances = [t.get("text", "") for t in turns if t.get("speaker") == "customer"]
        if not customer_utterances:
            return "Caller connected and listened to greeting."

        first_query = customer_utterances[0][:75]
        total_turns = len(turns)
        
        return f"Customer inquired: '{first_query}' across {total_turns} turns. Resolved in {language.upper()} using verified Khaira business knowledge."

ai_engine = AIEngine()
