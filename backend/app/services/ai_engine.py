import re
import json
import logging
from typing import Dict, Any, List, Optional
import httpx
from app.core.config import settings
from app.services.language_detector import language_detector

logger = logging.getLogger(__name__)

class AIEngine:
    """
    Intelligent Multilingual Conversation & Grounded Response Generator for NEXORA AI.
    Adheres strictly to Anti-Hallucination & Retrieval-Based Grounding rules.
    Supports English, Tamil, Hindi, Telugu, and Malayalam.
    """

    LANGUAGE_POLITE_REFUSALS = {
        "en": "I apologize, but I do not have verified information on that in our company records. Let me transfer you to our specialist who can assist you directly.",
        "ta": "மன்னிக்கவும், எங்கள் நிறுவன பதிவுகளில் இதற்கான சரிபார்க்கப்பட்ட தகவல் தற்போது என்னிடம் இல்லை. உங்களுக்கு உதவ எங்கள் நிபுணரிடம் இந்த அழைப்பை உடனடியாக இணைக்கிறேன்.",
        "hi": "क्षमा करें, हमारी कंपनी के रिकॉर्ड में इस बारे में सत्यापित जानकारी उपलब्ध नहीं है। मैं तुरंत आपकी कॉल हमारे विशेषज्ञ को स्थानांतरित कर रहा हूँ।",
        "te": "క్షమించండి, మా కంపెనీ రికార్డులలో దీనికి సంబంధించి ధృవీకరించబడిన సమాచారం ప్రస్తుతం అందుబాటులో లేదు. మీకు సహాయం చేయడానికి మా నిపుణుడికి కాల్ బదిలీ చేస్తున్నాను.",
        "ml": "ക്ഷമിക്കണം, ഞങ്ങളുടെ കമ്പനി രേഖകളിൽ ഇതിനെക്കുറിച്ചുള്ള കൃത്യമായ വിവരങ്ങൾ ലഭ്യമല്ല. നിങ്ങളെ സഹായിക്കാനായി ഞാൻ ഈ കോൾ ഞങ്ങളുടെ വിദഗ്ദ്ധനിലേക്ക് ട്രാൻസ്ഫർ ചെയ്യാം."
    }

    LANGUAGE_GREETINGS = {
        "en": "Welcome to NEXORA Tech Enterprises! My name is Nexora, your AI virtual receptionist. How may I assist you today?",
        "ta": "நெಕ್ஸோரா டெக் நிறுவனத்திற்கு தங்களை அன்புடன் வரவேற்கிறோம்! என் பெயர் நெக்ஸோரா, தங்களின் AI மெய்நிகர் வரவேற்பாளர். இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?",
        "hi": "नेक्सोरा टेक एंटरप्राइजेज में आपका स्वागत है! मेरा नाम नेक्सोरा है, आपकी एआई वर्चुअल रिसेप्शनिस्ट। आज मैं आपकी क्या सहायता कर सकती हूँ?",
        "te": "నెక్సోరా టెక్ ఎంటర్‌ప్రైజెస్‌కు స్వాగతం! నా పేరు నెక్సోరా, మీ AI వర్చువల్ రిసెప్షనిస్ట్. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
        "ml": "നെക്സോറ ടെക് എന്റർപ്രൈസസിലേക്ക് സ്വാഗതം! എന്റെ പേര് നെക്സോറ, നിങ്ങളുടെ AI വെർച്വൽ റിസപ്ഷനിസ്റ്റ്. ഇന്ന് ഞാൻ നിങ്ങളെ എങ്ങനെ സഹായിക്കണം?"
    }

    LANGUAGE_TRANSFER_CONFIRMATION = {
        "en": "I am connecting your call to our customer support specialist right now. Please hold on for just a moment.",
        "ta": "உடனடியாக எங்கள் வாடிக்கையாளர் சேவை அதிகாரியிடம் உங்களை இணைக்கிறேன். தயவுசெய்து ஒரு நிமிடம் காத்திருக்கவும்.",
        "hi": "मैं आपकी कॉल तुरंत हमारे कस्टमर सपोर्ट अधिकारी को जोड़ रहा हूँ। कृपया एक क्षण के लिए लाइन पर बने रहें।",
        "te": "నేను మీ కాల్‌ను మా కస్టమర్ సపోర్ట్ ఎగ్జిక్యూటివ్‌కి బదిలీ చేస్తున్నాను. దయచేసి ఒక్క క్షణం వేచి ఉండండి.",
        "ml": "ഞാൻ നിങ്ങളുടെ കോൾ ഇപ്പോൾ തന്നെ ഞങ്ങളുടെ കസ്റ്റമർ സപ്പോർട്ട് എക്സിക്യൂട്ടീവിലേക്ക് കണക്ട് ചെയ്യുകയാണ്. ദയവായി ഒരു നിമിഷം കാത്തിരിക്കൂ."
    }

    def detect_intent(self, text: str) -> str:
        """
        Classifies caller intent based on semantic markers.
        """
        text_lower = text.lower()
        words = set(re.findall(r'\b[\w-]+\b', text_lower))
        
        # Human handoff request (whole words or specific key phrases)
        handoff_keywords = {"human", "agent", "person", "employee", "manager", "supervisor", "representative", "pesanum", "matladali", "samsarikkanam"}
        if words.intersection(handoff_keywords) or any(phrase in text_lower for phrase in ["speak to someone", "talk to someone", "real person", "baat karni"]):
            return "HUMAN_HANDOFF"
            
        # Order Tracking
        order_keywords = {"order", "tracking", "track", "delivery", "shipped", "courier", "parcel"}
        if words.intersection(order_keywords) or any(w.startswith("ord-") for w in words):
            return "ORDER_STATUS"
            
        # Product & Inventory
        product_keywords = {"product", "price", "cost", "stock", "catalogue", "buy", "purchase", "available", "sku", "keemat", "vilai", "dharalu"}
        if words.intersection(product_keywords):
            return "PRODUCT_INQUIRY"
            
        # Appointments
        appt_keywords = {"appointment", "booking", "schedule", "demo", "meeting", "consultation", "slot", "reschedule", "cancel"}
        if words.intersection(appt_keywords):
            return "APPOINTMENT_INQUIRY"
            
        # Payments & Billing
        payment_keywords = {"payment", "invoice", "receipt", "bill", "refund", "charged", "paid"}
        if words.intersection(payment_keywords):
            return "PAYMENT_INQUIRY"
            
        # Complaints
        complaint_keywords = {"complaint", "issue", "damaged", "defective", "broken", "angry", "problem", "ticket", "escalate"}
        if words.intersection(complaint_keywords):
            return "COMPLAINT_REGISTRATION"
            
        return "GENERAL_KNOWLEDGE"

    async def generate_response(
        self,
        customer_query: str,
        conversation_history: List[Dict[str, str]],
        grounded_context: List[Dict[str, Any]],
        business_data: Optional[Dict[str, Any]] = None,
        forced_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generates a verified, grounded response adhering to strict business facts.
        """
        # 1. Automatic Language Detection
        if forced_language and forced_language != "auto":
            lang = forced_language
        else:
            lang, _ = language_detector.detect(customer_query)
            
        intent = self.detect_intent(customer_query)

        # 2. Check for Direct Request to Speak to Human
        if intent == "HUMAN_HANDOFF":
            reply = self.LANGUAGE_TRANSFER_CONFIRMATION.get(lang, self.LANGUAGE_TRANSFER_CONFIRMATION["en"])
            return {
                "text": reply,
                "language": lang,
                "intent": intent,
                "trigger_handoff": True,
                "handoff_reason": "Caller explicitly requested to speak with a human representative.",
                "grounded": True,
                "sources": []
            }

        # 3. Check Business Data (Orders, Stock, Appointments, Complaints)
        if business_data:
            if "order" in business_data:
                ord_info = business_data["order"]
                if lang == "ta":
                    reply = f"தங்களின் ஆர்டர் எண் {ord_info['order_number']} தற்போது '{ord_info['status']}' நிலையில் உள்ளது. பார்சல் {ord_info['courier_name']} மூலம் அனுப்பப்பட்டுள்ளது."
                elif lang == "hi":
                    reply = f"आपके आर्डर संख्या {ord_info['order_number']} की स्थिति '{ord_info['status']}' है। यह {ord_info['courier_name']} द्वारा भेजा गया है।"
                elif lang == "te":
                    reply = f"మీ ఆర్డర్ నంబర్ {ord_info['order_number']} ప్రస్తుతం '{ord_info['status']}' స్థితిలో ఉంది."
                elif lang == "ml":
                    reply = f"നിങ്ങളുടെ ഓർഡർ നമ്പർ {ord_info['order_number']} ഇപ്പോൾ '{ord_info['status']}' അവസ്ഥയിലാണ്."
                else:
                    reply = f"Your order #{ord_info['order_number']} is currently in '{ord_info['status']}' status with tracking number {ord_info.get('tracking_number', 'N/A')} via {ord_info.get('courier_name', 'our carrier')}."

                return {
                    "text": reply,
                    "language": lang,
                    "intent": "ORDER_STATUS",
                    "trigger_handoff": False,
                    "grounded": True,
                    "sources": [f"Order Database: #{ord_info['order_number']}"]
                }

            if "product" in business_data:
                prod = business_data["product"]
                if lang == "ta":
                    reply = f"தயாரிப்பு '{prod['name']}' கையிருப்பில் உள்ளது ({prod['stock_quantity']} அலகுகள்). இதன் விலை {prod['currency']} {prod['price']}."
                elif lang == "hi":
                    reply = f"उत्पाद '{prod['name']}' स्टॉक में उपलब्ध है ({prod['stock_quantity']} यूनिट्स)। इसकी कीमत {prod['currency']} {prod['price']} है।"
                elif lang == "te":
                    reply = f"ఉత్పత్తి '{prod['name']}' స్టాక్‌లో అందుబాటులో ఉంది. ధర {prod['currency']} {prod['price']}."
                elif lang == "ml":
                    reply = f"ഉൽപ്പന്നം '{prod['name']}' സ്റ്റോക്കിൽ ലഭ്യമാണ്. വില {prod['currency']} {prod['price']}."
                else:
                    reply = f"The product '{prod['name']}' (SKU: {prod['sku']}) is in stock with {prod['stock_quantity']} units available. The price is {prod['currency']} {prod['price']}."

                return {
                    "text": reply,
                    "language": lang,
                    "intent": "PRODUCT_INQUIRY",
                    "trigger_handoff": False,
                    "grounded": True,
                    "sources": [f"Product Catalog: SKU {prod['sku']}"]
                }

        # 4. Check Grounded Knowledge Base Context
        if grounded_context:
            best_chunk = grounded_context[0]
            # Use top chunk knowledge
            extracted_snippet = best_chunk.get("content", "").strip()
            # Clean up page headers if any
            clean_snippet = re.sub(r'\[Page\s+\d+\]', '', extracted_snippet).strip()
            
            if lang == "ta":
                reply = f"எங்கள் நிறுவன ஆவணங்களின்படி: {clean_snippet[:260]}... மேலும் தகவல் தேவையா?"
            elif lang == "hi":
                reply = f"हमारी कंपनी के आधिकारिक दस्तावेजों के अनुसार: {clean_snippet[:260]}... क्या मैं इसमें और सहायता कर सकती हूँ?"
            elif lang == "te":
                reply = f"మా కంపెనీ రికార్డుల ప్రకారం: {clean_snippet[:260]}... ఇంకా ఏమైనా సహాయం కావాలా?"
            elif lang == "ml":
                reply = f"ഞങ്ങളുടെ കമ്പനി രേഖകൾ പ്രകാരം: {clean_snippet[:260]}... കൂടുതൽ സഹായം വേണമോ?"
            else:
                reply = f"According to our verified company policy: {clean_snippet[:280]} Is there anything else you would like to know regarding this?"

            return {
                "text": reply,
                "language": lang,
                "intent": intent,
                "trigger_handoff": False,
                "grounded": True,
                "sources": [best_chunk.get("doc_title", "Knowledge Document")]
            }

        # 5. Strict Anti-Hallucination Fallback: If no facts found, trigger human handoff!
        refusal = self.LANGUAGE_POLITE_REFUSALS.get(lang, self.LANGUAGE_POLITE_REFUSALS["en"])
        return {
            "text": refusal,
            "language": lang,
            "intent": "UNKNOWN_INQUIRY",
            "trigger_handoff": True,
            "handoff_reason": f"No verified company knowledge found for query: '{customer_query[:80]}'",
            "grounded": False,
            "sources": []
        }

ai_engine = AIEngine()
