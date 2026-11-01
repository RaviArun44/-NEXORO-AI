# Khaira AI Voice Automation Platform
## Enterprise-Level Multilingual AI Voice Agent for Khaira Company

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/khaira-company)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)
[![Edge-TTS](https://img.shields.io/badge/Neural_TTS-Microsoft_Edge-0078D7.svg)](https://github.com/rany2/edge-tts)

The **Khaira AI Voice Automation Platform** is an enterprise-grade autonomous voice receptionist and conversational automation platform custom-built for **Khaira Company**. It automatically handles thousands of concurrent incoming and outgoing customer calls 24 hours a day, 7 days a week across **English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), and Malayalam (മലയാളം)** with automatic language detection, grounded retrieval-augmented generation (RAG) against verified company documents, and autonomous business workflows (Orders, Inventory, Appointments, Complaints, Urgency, Follow-ups).

---

## 1. Executive Summary & Objective

Khaira Company receives thousands of customer inquiries daily. Handling these high call volumes through human agents alone creates severe bottlenecks, long caller hold times, high operational overhead, and inconsistent customer experiences.

This platform replaces routine human call-answering with an **autonomous AI voice agent** that:
1. **Communicates Naturally**: Conducts natural, human-like voice conversations with ultra-low turn latency (< 200ms).
2. **Auto-Detects Language**: Identifies native scripts and colloquial transliterations (Tanglish, Hinglish, Teluglish, Manglish) without cumbersome IVR menus.
3. **Handles Interruptions (Barge-In)**: Callers can interrupt the AI at any second; voice synthesis immediately cancels.
4. **Executes Autonomous Workflows**: Automatically tracks orders, checks live inventory, registers complaint tickets, and books consultation appointments.
5. **Enforces Zero-Hallucination Grounding**: All business answers are strictly verified against uploaded Khaira Company policies and catalogs before answering.
6. **Scales to Thousands of Concurrent Calls**: Asynchronous priority queue manager, worker pool, and token-bucket rate limiter.

---

## 2. System Architecture

```
[Customer Telephony & Browser Ingress]
   ├── Browser WebRTC Softphone / Audio Streaming WebSocket
   ├── Telephony Ingress (Asterisk ARI / FreeSWITCH ESL / SIP Trunk)
   └── Rate Limiter & Concurrency Semaphore Controller (1,000+ Concurrent Calls)
             │
             ▼
[FastAPI Asynchronous Gateway & Core Engine]
   ├── Voice Activity Detection (VAD) & Energy-Based Noise Filtering
   ├── Real-Time Language Identification (Native Unicode + Phonetic Transliteration)
   ├── Full-Duplex Conversation Orchestrator & Dialog State Machine
   │     │
   │     ├── Autonomous Business Workflow Engine:
   │     │     ├── Order & Courier Tracking Workflow (ORD-#)
   │     │     ├── Product Catalog & Stock Lookup (SKU & Pricing)
   │     │     ├── Complaint & Escalation Ticket Registration (TKT-#)
   │     │     ├── Consultation & Demo Booking Scheduler (APT-#)
   │     │     ├── Emergency & High-Urgency Outage Escalation (URG-#)
   │     │     └── Natural Call Termination & Closing
   │     │
   │     └── Zero-Hallucination RAG Engine:
   │           ├── PDF, DOCX, TXT Semantic Passage Chunking
   │           ├── 128-Dimensional Normalized Semantic Hash Embeddings
   │           └── Cosine Similarity Search (Confidence Threshold >= 0.65)
   │
   └── Multilingual Neural Text-to-Speech (Edge-TTS)
         ├── Tamil: ta-IN-PallaviNeural
         ├── Hindi: hi-IN-SwaraNeural
         ├── Telugu: te-IN-ShrutiNeural
         ├── Malayalam: ml-IN-SobhanaNeural
         └── English: en-IN-NeerjaNeural / en-US-JennyNeural
             │
             ▼
[Persistence Layer & Real-Time Dashboard]
   ├── PostgreSQL 16 (Production) / SQLite Async (Local Development)
   ├── Audit Logs, Call Recordings & Turn-by-Turn Transcripts
   └── React 19 + TypeScript + Tailwind CSS Admin Dashboard
```

---

## 3. Core Multilingual Capabilities

| Language | Native Script | Romanized Transliteration | Neural Voice Persona | Example Query Handled |
|---|---|---|---|---|
| **Tamil** | தமிழ் | Tanglish | `ta-IN-PallaviNeural` | "வணக்கம், என் ஆர்டர் ORD-739120 எங்கே உள்ளது?" |
| **English** | Latin | Indian / Global English | `en-IN-NeerjaNeural` | "What is your hardware warranty and SLA policy?" |
| **Hindi** | हिन्दी | Hinglish | `hi-IN-SwaraNeural` | "नमस्ते, मेरे आर्डर ORD-849201 की स्थिति बताइए।" |
| **Telugu** | తెలుగు | Teluglish | `te-IN-ShrutiNeural` | "నమస్కారం, నా ఉత్పత్తి డెలివరీ ఎప్పుడు వస్తుంది?" |
| **Malayalam** | മലയാളം | Manglish | `ml-IN-SobhanaNeural` | "നമസ്കാരം, എന്റെ ഓർഡർ വിവരങ്ങൾ അറിയണം." |

### Code-Mixed & Language Switching Features:
- **Code-Mixing Support**: Understands colloquial phrases mixing English with native words (e.g., *"order status sollunga"*, *"delivery eppudu vastundi"*, *"parcel kab tak aayega"*).
- **Seamless Mid-Call Switching**: If a customer starts in English and switches to Tamil, the AI detects the transition and responds in Tamil without losing context.
- **Contextual Continuity**: Preserves the active language when customer offers brief acknowledgments (*"ok"*, *"yes"*, *"sure"*).
- **Extensible Architecture**: Allows administrators to register additional Indian languages (Kannada, Marathi, Bengali, Gujarati) and international languages via API.

---

## 4. High-Volume Call Handling & Scalability Architecture

To process thousands of simultaneous customer conversations without server crashes:

1. **Async Concurrency Semaphore**: Limits concurrent active LLM/TTS generation slots (`MAX_CONCURRENT_CALLS=1000`) to guarantee deterministic memory usage.
2. **Priority Call Queue**: High-urgency callers and VIP customers jump ahead in the waiting queue (`asyncio.PriorityQueue`).
3. **Sliding-Window Rate Limiting**: Token-bucket algorithm prevents phone spam and DDoS flooding (`RATE_LIMIT_PER_MINUTE=120`).
4. **Heartbeat & TTL Session Cleanup**: Automatically purges stale or dropped call sessions after 30 minutes of inactivity.
5. **Fault Tolerance & Exponential Retries**: Speech synthesis and database operations utilize automatic retries with exponential backoff.
6. **Built-in Concurrent Load Simulator**: Test 50, 150, 300, or 1,000 simultaneous calls via `/api/v1/calls/simulate-load`.

---

## 5. Autonomous Customer Interaction Workflows

The AI agent executes concrete business logic directly from speech:

1. **Order & Shipping Tracking**: Extracts order number (e.g. `ORD-849201`), queries live database, and answers with status, courier partner, tracking code, and ETA.
2. **Product Catalog & Stock Inquiries**: Checks SKU (`NEX-VOICE-PRO`, `NEX-AUDIO-HD`), quotes unit pricing, and confirms live warehouse stock.
3. **Complaint & Support Ticket Registration**: Classifies problem severity, creates ticket (`TKT-XXXXXX`) in database, and sets priority (`URGENT`, `HIGH`, `MEDIUM`, `LOW`).
4. **Appointment & Consultation Booking**: Validates slot availability, registers appointment (`APT-XXXXX`), and schedules automated voice reminder.
5. **Emergency Escalation**: Identifies critical outages, fraud, or system downtime, immediately logs emergency ticket (`URG-XXXXXX`), and triggers high-priority alerts.
6. **Natural Call Wrap-Up & Closing**: Recognizes conversational closing markers (*"thank you bye"*, *"nandri vanakkam"*, *"dhanyawad"*) and closes the call gracefully.

---

## 6. Grounded RAG Knowledge Base

- **Multi-Format Ingestion**: Upload PDF, DOCX, and TXT files directly from the dashboard.
- **Passage Chunking**: Sliding-window semantic chunking with overlapping context boundaries.
- **128-Dimensional Hash Vector Embeddings**: Fast, offline, zero-dependency cosine similarity search.
- **Strict Anti-Hallucination Gate**: If cosine similarity is below threshold ($\ge 0.65$), the agent politely refuses to guess and transfers the inquiry.

---

## 7. Real-Time Admin Dashboard (16 Modules)

| # | Module | Route | Functionality |
|---|---|---|---|
| 1 | **Dashboard Overview** | `/dashboard` | Live genuine KPIs, active concurrency, queue size, CSAT, recent call logs |
| 2 | **Live Voice Studio** | `/live-calls` | Interactive 2-way voice softphone, waveform visualizer, barge-in, STT/TTS |
| 3 | **Call History** | `/calls` | Filterable call history, multi-turn transcript viewer, AI summaries |
| 4 | **Customer Management** | `/customers` | CRM records, outbound consent toggles, DND status, call history |
| 5 | **Products & Inventory** | `/products` | Catalogue, SKU search, live inventory quantity, stock status |
| 6 | **Orders & Tracking** | `/orders` | Order fulfillment, tracking numbers, status update actions |
| 7 | **Appointments** | `/appointments` | Slot availability checker, appointment booking, rescheduling |
| 8 | **Complaints Desk** | `/complaints` | Ticket registration, priority levels, escalation, resolution notes |
| 9 | **Human Handoff Desk** | `/handoff` | Real-time queue for transferred calls, accept/reject controls |
| 10 | **Knowledge Base** | `/knowledge` | PDF/DOCX/TXT uploader, chunk inspector, semantic search tester |
| 11 | **Outbound Campaigns** | `/campaigns` | Automated outbound calling wizard, consent checks, batch launch |
| 12 | **Employee Staff** | `/employees` | Staff roster, department routing, live presence status (Available/Busy) |
| 13 | **Analytics & Reports** | `/analytics` | Recharts graphs: hourly trends, language distribution pie chart, query categories |
| 14 | **Company Settings** | `/settings` | Profile, business hours, greeting templates, SIP gateway config |
| 15 | **AI Configuration** | `/ai-config` | Voice persona selector per language, confidence threshold slider |
| 16 | **Authentication** | `/login` | Secure JWT login & registration with demo auto-fill credentials |

---

## 8. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0 (Async), Pydantic v2, WebSockets.
- **Database**: PostgreSQL 16 (production) with automatic SQLite async fallback for local zero-dependency development.
- **Speech Engine**: Microsoft Edge Neural TTS, Faster-Whisper ASR, Web Speech API.
- **Telephony**: High-Volume Async Queue Manager, WebRTC Audio Softphone, SIP/VoIP Adapter.

---

## 9. Local Development & Installation Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.10 or Python 3.11

### Step 1: Backend Setup
```bash
cd backend
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows PowerShell:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend initializes the database schema and seeds Khaira Company demo data automatically on first launch.
API Documentation is available at: `http://127.0.0.1:8000/docs`.

### Step 2: Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Default Login Credentials:
- **Email**: `admin@khairacompany.com` (or `admin@nexora.ai`)
- **Password**: `Admin@123`

---

## 10. Verification & Test Suite

Run the full pytest suite (24 automated tests):
```bash
cd backend
.\venv\Scripts\python.exe -m pytest -v
```

### Test Coverage Highlights:
- `test_health_endpoint`: Validates Khaira platform service health and language catalog.
- `test_auth_login`: Validates JWT token issuance and RBAC credentials.
- `test_dashboard_kpis`: Validates computed metrics and latency stats.
- `test_live_call_cycle`: Simulates complete live voice call start, turn execution, and wrap-up.
- `test_queue_priority_ordering`: Verifies VIP/Urgent callers jump ahead in queue.
- `test_rate_limiting`: Confirms caller rate-limiting threshold enforcement.
- `test_concurrency_slots_and_metrics`: Validates semaphore capacity bounds.
- `test_high_volume_concurrency_simulation`: Stress-tests 100 simultaneous concurrent calls with 100% success rate.
- `test_language_detection_native_scripts`: Tests Tamil, Hindi, Telugu, Malayalam, and English detection.
- `test_transliterated_scripts`: Tests Tanglish, Hinglish, Teluglish, and Manglish recognition.
- `test_code_mixed_marker_detection`: Tests code-mixed sentences.
- `test_conversational_language_continuity`: Verifies language retention across turns.
- `test_runtime_language_extension`: Validates dynamic runtime registration of Kannada.
- `test_order_status_workflow`: Validates autonomous order tracking in English and Tamil.
- `test_complaint_registration_workflow`: Validates automated ticket generation (`TKT-XXXXXX`).
- `test_appointment_booking_workflow`: Validates demo consultation booking (`APT-XXXXX`).
- `test_urgent_emergency_escalation`: Validates emergency escalation (`URG-XXXXXX`).
- `test_call_termination_wrap_up`: Validates natural call wrap-up and closing.

---

## 11. Production Deployment Guide

### Using Docker Compose:
```bash
# Set production credentials in backend/.env
docker compose up -d --build
```
This deploys:
- PostgreSQL 16 container with persistent volumes
- FastAPI production backend on port 8000
- Nginx frontend production container on port 80

### Indian Regulatory Compliance:
- **DPDPA 2023**: Every caller has explicit opt-in/opt-out consent tracking in the CRM.
- **TRAI DND Scrubbing**: Automated outbound voice campaigns scrub numbers against National Do-Not-Disturb registry before dialing.
- **Call Recording Consent**: Automatic voice disclosure played before audio capture begins.
