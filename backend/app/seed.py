import logging
from datetime import datetime, timedelta
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.user import User
from app.models.customer import Customer
from app.models.product import Product
from app.models.order import Order
from app.models.appointment import Appointment
from app.models.complaint import Complaint
from app.models.knowledge import KnowledgeDoc, KnowledgeChunk
from app.models.call import Call
from app.models.campaign import Campaign, CampaignLead
from app.services.rag_engine import rag_engine

logger = logging.getLogger(__name__)

async def seed_initial_data():
    """
    Seeds verified enterprise production data for Khaira Company.
    Populates multilingual customers, products, verified RAG documents, and historical calls.
    """
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        comp_check = await session.execute(select(Company))
        existing_company = comp_check.scalars().first()
        if existing_company:
            # Update company name to Khaira Company if legacy
            if existing_company.name != "Khaira Company":
                existing_company.name = "Khaira Company"
                existing_company.receptionist_name = "Khaira AI"
                existing_company.industry = "Enterprise Multilingual AI Voice Automation & Telephony Solutions"
                existing_company.greeting_template = "Welcome to Khaira Company! My name is Khaira AI, your autonomous voice assistant. How may I assist you today?"
                await session.commit()
            logger.info("Database already seeded. Khaira Company profile validated.")
            return

        logger.info("Seeding initial company data for Khaira Company...")

        # 1. Company
        company = Company(
            name="Khaira Company",
            industry="Enterprise Multilingual AI Voice Automation & Telephony Solutions",
            phone="+91-44-6789-0100",
            email="support@khairacompany.example",
            address="Khaira Towers, 45 Central Expressway, Tech Corridor, Chennai, TN 600096",
            receptionist_name="Khaira AI",
            default_language="en",
            supported_languages=["en", "ta", "hi", "te", "ml"],
            greeting_template="Welcome to Khaira Company! My name is Khaira AI, your autonomous voice assistant. How may I assist you today?",
            handoff_phone="+91-44-6789-0199",
            auto_handoff_on_low_confidence=True,
            confidence_threshold="0.65",
            telephony_mode="browser_simulated"
        )
        session.add(company)
        await session.flush()

        # 2. Staff & Specialists
        admin_user = User(
            company_id=company.id,
            email="admin@khairacompany.com",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Rajesh Khaira (Executive Administrator)",
            phone="+91-44-6789-0101",
            extension="100",
            department="Executive Operations",
            role="ADMIN",
            status="AVAILABLE",
            is_superuser=True
        )
        admin_legacy = User(
            company_id=company.id,
            email="admin@nexora.ai",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Alex Mercer (Administrator)",
            phone="+91-44-6789-0100",
            extension="104",
            department="Operations & IT",
            role="ADMIN",
            status="AVAILABLE",
            is_superuser=True
        )
        agent_sarah = User(
            company_id=company.id,
            email="sarah.chen@khairacompany.com",
            hashed_password=get_password_hash("Agent@123"),
            full_name="Sarah Chen",
            phone="+91-44-6789-0102",
            extension="101",
            department="Global Customer Success",
            role="AGENT",
            status="AVAILABLE"
        )
        agent_karthik = User(
            company_id=company.id,
            email="karthik.rajan@khairacompany.com",
            hashed_password=get_password_hash("Agent@123"),
            full_name="Karthik Rajan",
            phone="+91-98401-00103",
            extension="102",
            department="Tamil & South Zone Support",
            role="AGENT",
            status="AVAILABLE"
        )
        agent_priya = User(
            company_id=company.id,
            email="priya.sharma@khairacompany.com",
            hashed_password=get_password_hash("Agent@123"),
            full_name="Priya Sharma",
            phone="+91-98111-00104",
            extension="103",
            department="Hindi & North Zone Operations",
            role="AGENT",
            status="AVAILABLE"
        )
        session.add_all([admin_user, admin_legacy, agent_sarah, agent_karthik, agent_priya])
        await session.flush()

        # 3. Multilingual Customers
        cust_john = Customer(
            company_id=company.id,
            phone="+1-415-555-0142",
            name="John Miller",
            email="john.miller@example.com",
            preferred_language="en",
            consent_for_outbound=True,
            dnd_opt_out=False,
            notes="Enterprise client interested in Khaira AI Voice Gateway.",
            tags=["VIP", "Enterprise"],
            total_calls_count=4,
            last_contacted_at=datetime.utcnow() - timedelta(days=1)
        )
        cust_anitha = Customer(
            company_id=company.id,
            phone="+91-98401-23456",
            name="Anitha Raman",
            email="anitha.raman@example.com",
            preferred_language="ta",
            consent_for_outbound=True,
            dnd_opt_out=False,
            notes="Chennai branch client. Prefers communication in Tamil.",
            tags=["Retail", "Tamil-Pref"],
            total_calls_count=2,
            last_contacted_at=datetime.utcnow() - timedelta(hours=4)
        )
        cust_rajesh = Customer(
            company_id=company.id,
            phone="+91-98111-54321",
            name="Rajesh Verma",
            email="rajesh.verma@example.com",
            preferred_language="hi",
            consent_for_outbound=True,
            dnd_opt_out=False,
            notes="Delhi client. Inquired about delivery timelines.",
            tags=["Retail", "Hindi-Pref"],
            total_calls_count=3,
            last_contacted_at=datetime.utcnow() - timedelta(days=2)
        )
        cust_lakshmi = Customer(
            company_id=company.id,
            phone="+91-94401-87654",
            name="Lakshmi Narayana",
            email="lakshmi.n@example.com",
            preferred_language="te",
            consent_for_outbound=True,
            dnd_opt_out=False,
            notes="Hyderabad client. Prefers Telugu conversation.",
            tags=["Telugu-Pref"],
            total_calls_count=1,
            last_contacted_at=datetime.utcnow() - timedelta(days=3)
        )
        cust_rahul = Customer(
            company_id=company.id,
            phone="+91-94471-12345",
            name="Rahul Menon",
            email="rahul.menon@example.com",
            preferred_language="ml",
            consent_for_outbound=True,
            dnd_opt_out=False,
            notes="Kochi client. Inquired about warranty terms.",
            tags=["Malayalam-Pref"],
            total_calls_count=2,
            last_contacted_at=datetime.utcnow() - timedelta(days=5)
        )
        session.add_all([cust_john, cust_anitha, cust_rajesh, cust_lakshmi, cust_rahul])
        await session.flush()

        # 4. Products Catalogue
        p1 = Product(
            company_id=company.id,
            sku="NEX-VOICE-PRO",
            name="NEXORA Pro AI Voice Gateway",
            category="Hardware & Gateways",
            description="Enterprise SIP/VoIP server appliance with native neural voice engine and DSP noise cancellation.",
            price=899.00,
            currency="USD",
            stock_quantity=24,
            reorder_level=5,
            is_active=True
        )
        p2 = Product(
            company_id=company.id,
            sku="NEX-AUDIO-HD",
            name="Ultra-HD Noise Cancelling Headset",
            category="Peripherals",
            description="Professional binaural USB-C and Bluetooth headset with dual AI beamforming microphones.",
            price=149.00,
            currency="USD",
            stock_quantity=85,
            reorder_level=15,
            is_active=True
        )
        p3 = Product(
            company_id=company.id,
            sku="KHAIRA-PBX-CLOUD",
            name="Khaira Enterprise PBX Cloud Connector",
            category="Software Licenses",
            description="Annual subscription license connecting Asterisk or FreeSWITCH with Khaira AI voice engine.",
            price=499.00,
            currency="USD",
            stock_quantity=999,
            reorder_level=10,
            is_active=True
        )
        p4 = Product(
            company_id=company.id,
            sku="KHAIRA-DESK-VOIP",
            name="Khaira Smart Desk VoIP Terminal",
            category="Hardware & Gateways",
            description="7-inch capacitive touchscreen desk telephone with Gigabit Ethernet and PoE support.",
            price=229.00,
            currency="USD",
            stock_quantity=38,
            reorder_level=8,
            is_active=True
        )
        session.add_all([p1, p2, p3, p4])
        await session.flush()

        # 5. Orders
        ord1 = Order(
            company_id=company.id,
            customer_id=cust_john.id,
            order_number="ORD-849201",
            items=[{"sku": p1.sku, "name": p1.name, "quantity": 1, "unit_price": 899.00, "total": 899.00}],
            total_amount=899.00,
            currency="USD",
            status="SHIPPED",
            payment_status="PAID",
            payment_method="CREDIT_CARD",
            tracking_number="TRK-98234112",
            courier_name="FedEx Express",
            estimated_delivery=datetime.utcnow() + timedelta(days=2),
            shipping_address="742 Evergreen Terrace, Springfield, IL 62704"
        )
        ord2 = Order(
            company_id=company.id,
            customer_id=cust_anitha.id,
            order_number="ORD-739120",
            items=[{"sku": p2.sku, "name": p2.name, "quantity": 1, "unit_price": 149.00, "total": 149.00}],
            total_amount=149.00,
            currency="USD",
            status="PROCESSING",
            payment_status="PAID",
            payment_method="UPI_NETBANKING",
            tracking_number="TRK-44102938",
            courier_name="BlueDart Aviation",
            estimated_delivery=datetime.utcnow() + timedelta(days=3),
            shipping_address="Plot 12, Anna Nagar 2nd Avenue, Chennai 600040"
        )
        session.add_all([ord1, ord2])
        await session.flush()

        # 6. Appointments
        appt1 = Appointment(
            company_id=company.id,
            customer_id=cust_john.id,
            employee_id=agent_sarah.id,
            appointment_number="APT-54012",
            service_name="Khaira Enterprise AI Solution Architecture Demo",
            scheduled_time=datetime.utcnow() + timedelta(days=1, hours=2),
            duration_minutes=30,
            status="SCHEDULED",
            location_type="ONLINE_VOICE",
            notes="Discuss voice AI migration for Khaira Company infrastructure."
        )
        session.add(appt1)

        # 7. Complaints
        comp1 = Complaint(
            company_id=company.id,
            customer_id=cust_rajesh.id,
            order_id=None,
            assigned_to_id=agent_priya.id,
            ticket_number="TKT-291840",
            title="Inquiry on Shipping Delay to Noida",
            description="Customer reported that estimated delivery date showed delay of 2 days due to weather.",
            category="Delayed Delivery",
            priority="MEDIUM",
            status="IN_PROGRESS"
        )
        session.add(comp1)

        # 8. Verified Knowledge Base Documents for Khaira Company
        doc1_content = """
        KHAIRA COMPANY WARRANTY, REFUND AND RETURN POLICIES:
        All Khaira Company hardware devices including AI Voice Gateways and Smart Desk Terminals carry an unconditional 2-year manufacturer warranty from the purchase date.
        Customers may request a full refund or return within 30 days of delivery if products remain in original packaging.
        For technical assistance or warranty replacements, replacement units are shipped within 2 business days via express courier at zero shipping charge to the customer.
        Software subscriptions such as Khaira Enterprise PBX Cloud Connector include 24/7 technical support and can be canceled anytime with pro-rata refunds.
        """
        
        doc1 = KnowledgeDoc(
            company_id=company.id,
            title="Khaira Company Warranty and Return Policy",
            filename="khaira_warranty_and_returns.txt",
            file_type="txt",
            file_size_bytes=len(doc1_content),
            file_path="./data_storage/uploads/khaira_warranty_and_returns.txt",
            doc_category="Company Policy",
            chunks_count=1,
            status="INDEXED"
        )
        session.add(doc1)
        await session.flush()

        ch1 = KnowledgeChunk(
            doc_id=doc1.id,
            chunk_index=0,
            content=doc1_content.strip(),
            embedding=rag_engine.compute_embedding(doc1_content),
            token_count=len(doc1_content.split()),
            metadata_json={"section": "Warranty and Refunds"}
        )
        session.add(ch1)

        doc2_content = """
        KHAIRA COMPANY BUSINESS OPERATING HOURS AND SERVICE LEVEL AGREEMENT (SLA):
        Our head office and corporate lines operate from Monday to Friday, 9:00 AM to 6:00 PM IST, and Saturdays from 10:00 AM to 4:00 PM IST.
        Offices are closed on Sundays and national public holidays.
        The Khaira AI voice automation agent answers calls 24 hours a day, 7 days a week, 365 days a year without downtime.
        Critical severity issues have a guaranteed response time of under 15 minutes.
        Standard email inquiries are answered within 2 hours during normal business operating hours.
        """
        doc2 = KnowledgeDoc(
            company_id=company.id,
            title="Khaira Business Operating Hours & SLA",
            filename="khaira_business_hours_and_sla.txt",
            file_type="txt",
            file_size_bytes=len(doc2_content),
            file_path="./data_storage/uploads/khaira_business_hours_and_sla.txt",
            doc_category="Operations & SLA",
            chunks_count=1,
            status="INDEXED"
        )
        session.add(doc2)
        await session.flush()

        ch2 = KnowledgeChunk(
            doc_id=doc2.id,
            chunk_index=0,
            content=doc2_content.strip(),
            embedding=rag_engine.compute_embedding(doc2_content),
            token_count=len(doc2_content.split()),
            metadata_json={"section": "Hours and SLA"}
        )
        session.add(ch2)

        # 9. Realistic Multilingual Calls
        call_en = Call(
            company_id=company.id,
            customer_id=cust_john.id,
            direction="INBOUND",
            caller_number="+1-415-555-0142",
            receiver_number="+91-44-6789-0100",
            status="COMPLETED",
            language="en",
            detected_languages=["en"],
            duration_seconds=78,
            latency_ms=290.0,
            intent="ORDER_STATUS",
            sentiment="POSITIVE",
            outcome="RESOLVED_BY_AI",
            summary="Customer inquired about status of order ORD-849201. AI confirmed shipment via FedEx with tracking TRK-98234112.",
            transcript=[
                {"speaker": "ai", "text": "Welcome to Khaira Company! My name is Khaira AI, your autonomous voice assistant. How may I assist you today?", "timestamp": (datetime.utcnow() - timedelta(hours=3)).isoformat(), "language": "en"},
                {"speaker": "customer", "text": "Hi, I want to check the status of my order ORD-849201.", "timestamp": (datetime.utcnow() - timedelta(hours=3)).isoformat(), "language": "en"},
                {"speaker": "ai", "text": "Your Khaira Company order #ORD-849201 is currently in 'SHIPPED' status with tracking number TRK-98234112 via FedEx Express.", "timestamp": (datetime.utcnow() - timedelta(hours=3)).isoformat(), "language": "en"},
                {"speaker": "customer", "text": "That's great! Thank you so much.", "timestamp": (datetime.utcnow() - timedelta(hours=3)).isoformat(), "language": "en"}
            ]
        )
        call_ta = Call(
            company_id=company.id,
            customer_id=cust_anitha.id,
            direction="INBOUND",
            caller_number="+91-98401-23456",
            receiver_number="+91-44-6789-0100",
            status="COMPLETED",
            language="ta",
            detected_languages=["ta"],
            duration_seconds=95,
            latency_ms=315.0,
            intent="PRODUCT_INQUIRY",
            sentiment="POSITIVE",
            outcome="RESOLVED_BY_AI",
            summary="வாடிக்கையாளர் Ultra-HD Headset கிடைக்கும் தன்மை பற்றி கேட்டறிந்தார். கையிருப்பு மற்றும் விலை விவரங்கள் தமிழில் வழங்கப்பட்டது.",
            transcript=[
                {"speaker": "ai", "text": "கைரா நிறுவனத்திற்கு தங்களை அன்புடன் வரவேற்கிறோம்! என் பெயர் கைரா AI. இன்று நான் உங்களுக்கு எவ்வாறு உதவலாம்?", "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(), "language": "ta"},
                {"speaker": "customer", "text": "வணக்கம், உங்களிடம் Noise Cancelling Headset ஸ்டாக் இருக்கிறதா மற்றும் விலை என்ன?", "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(), "language": "ta"},
                {"speaker": "ai", "text": "எங்கள் கைரா தயாரிப்பு 'Ultra-HD Noise Cancelling Headset' (SKU: NEX-AUDIO-HD) கையிருப்பில் உள்ளது (85 அலகுகள்). இதன் விலை USD 149.00.", "timestamp": (datetime.utcnow() - timedelta(hours=2)).isoformat(), "language": "ta"}
            ]
        )
        call_hi = Call(
            company_id=company.id,
            customer_id=cust_rajesh.id,
            direction="INBOUND",
            caller_number="+91-98111-54321",
            receiver_number="+91-44-6789-0100",
            status="COMPLETED",
            language="hi",
            detected_languages=["hi"],
            duration_seconds=64,
            latency_ms=280.0,
            intent="GENERAL_KNOWLEDGE",
            sentiment="POSITIVE",
            outcome="RESOLVED_BY_AI",
            summary="ग्राहक ने वारंटी नीति के बारे में पूछा। AI ने खैरा कंपनी की 2 वर्ष की वारंटी जानकारी प्रदान की।",
            transcript=[
                {"speaker": "ai", "text": "खैरा कंपनी में आपका हार्दिक स्वागत है! मेरा नाम खैरा एआई है। आज मैं आपकी क्या सहायता कर सकती हूँ?", "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(), "language": "hi"},
                {"speaker": "customer", "text": "नमस्ते, क्या आपके हार्डवेयर पर कोई वारंटी है?", "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(), "language": "hi"},
                {"speaker": "ai", "text": "हमारे खैरा कंपनी के आधिकारिक रिकॉर्ड के अनुसार: सभी हार्डवेयर उपकरणों पर खरीद की तारीख से 2 वर्ष की निर्माता वारंटी मिलती है।", "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(), "language": "hi"}
            ]
        )
        session.add_all([call_en, call_ta, call_hi])

        # 10. Outbound Campaign
        camp = Campaign(
            company_id=company.id,
            name="Khaira Enterprise AI Solution Outreach",
            campaign_type="APPOINTMENT_REMINDER",
            script_prompt="Remind registered customers regarding tomorrow's scheduled enterprise consultation.",
            target_language="en",
            scheduled_at=datetime.utcnow() + timedelta(hours=6),
            status="RUNNING",
            total_leads=2,
            completed_calls=1,
            successful_outcomes=1,
            failed_calls=0,
            respect_dnd=True,
            require_prior_consent=True
        )
        session.add(camp)
        await session.flush()

        lead1 = CampaignLead(
            campaign_id=camp.id,
            customer_id=cust_john.id,
            phone=cust_john.phone,
            customer_name=cust_john.name,
            language="en",
            status="COMPLETED",
            attempts=1,
            call_outcome="SUCCESSFUL_DELIVERY",
            called_at=datetime.utcnow() - timedelta(minutes=45)
        )
        lead2 = CampaignLead(
            campaign_id=camp.id,
            customer_id=cust_anitha.id,
            phone=cust_anitha.phone,
            customer_name=cust_anitha.name,
            language="ta",
            status="PENDING",
            attempts=0
        )
        session.add_all([lead1, lead2])

        await session.commit()
        logger.info("Database successfully seeded with Khaira Company enterprise data.")
