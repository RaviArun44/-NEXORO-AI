# NEXORA AI: Intelligent Multilingual AI Receptionist & Business Communication Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/nexora-ai)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org)

**NEXORA AI** is an enterprise-grade virtual receptionist and business communication platform. It handles natural two-way voice conversations 24/7 across **English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), and Malayalam (മലയാളം)** with automatic language detection, grounded retrieval-augmented generation (RAG) against uploaded company documents, business operations integration (CRM, Inventory, Orders, Appointments, Complaints), and intelligent human handoff.

---

## 1. Key Capabilities & Features

### 🎙️ AI Voice Receptionist & Full-Duplex Dialogue
- **Two-Way Voice Conversations**: Natural dialogue with real-time speech-to-text (STT) and neural text-to-speech (TTS).
- **Multilingual Support**: First-class support for English, Tamil (தமிழ்), Hindi (हिन्दी), Telugu (తెలుగు), and Malayalam (മലയാളം).
- **Automatic Language Identification**: Detects native scripts as well as transliterated variations (Tanglish, Hinglish, Teluglish, Manglish).
- **Interruption & Barge-in Handling**: Callers can interrupt the AI at any moment; active speech playback halts immediately.
- **Configurable Company Personas**: Company-specific greetings, operating hours, and voice characteristics.

### 📚 Grounded Knowledge Base (Zero-Hallucination RAG)
- **Multi-Format Ingestion**: Upload PDF, DOCX, and TXT files (Product Catalogues, FAQs, Return Policies, SLAs).
- **Semantic Chunking & Offline Vector Indexing**: 128-dimensional semantic hash embeddings with normalized cosine similarity search.
- **Strict Anti-Hallucination Policy**: If verified company documents do not contain the answer or confidence is $< 0.65$, NEXORA politely refuses to speculate and triggers an automatic human transfer.

### 🏢 Enterprise Business Operations Hub
- **Customer CRM**: Automatic caller identification, interaction timeline, and regulatory consent tracking.
- **Products & Live Inventory**: SKU lookup, live stock checks, price quotation, and low-stock reorder warnings.
- **Order Management & Tracking**: Real-time order status checks (`CONFIRMED`, `SHIPPED`, `DELIVERED`) and courier tracking.
- **Appointment Scheduling**: Available slot checks, real-time booking, cancellation, and automated voice reminders.
- **Complaints & Escalation**: Customer ticket registration, priority levels (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), and resolution logging.

### 🤝 Intelligent Human Handoff Desk
- **Context Preservation**: Packages customer profile, last 3 conversational turns, and AI summary before dispatch.
- **Real-Time Staff Alerts**: Push notifications and audio chimes via WebSockets to available human specialists.
- **Accept / Reject / Return Workflow**: Employees can claim transferred calls directly from their browser dashboard.

### 📞 Authorized Outbound Voice Campaigns
- Automated outbound calls for appointment reminders, order updates, payment reminders, and customer feedback.
- **Regulatory Compliance**: Strictly verifies prior customer consent and Do-Not-Disturb (DND) status before dialing.

---

## 2. System Architecture

```
[Customer Ingress]
   ├── Browser WebRTC / Audio WebSocket Softphone
   └── Telephony Adapter (Asterisk ARI / FreeSWITCH ESL / SIP Trunk)
             │
             ▼
[FastAPI Asynchronous Gateway]
   ├── Speech-to-Text & Transliterated Language Detector
   ├── Conversation Orchestrator (Dialog State Machine)
   ├── RAG Engine (PDF/DOCX/TXT Parser & Vector Similarity)
   ├── Business Hub (CRM, Products, Orders, Appointments, Complaints)
   ├── Anti-Hallucination Policy & Human Handoff Dispatch
   └── Neural Text-to-Speech (Multilingual Voice Synthesis)
             │
             ▼
[Persistence Layer]
   ├── PostgreSQL / SQLite (Relational Schemas & Multi-Tenant Data)
   ├── Vector Embedding Store (Cosine Similarity Matches)
   └── Audit & Call Recording Archive
```

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, SQLAlchemy 2.0 (Async), Pydantic v2, WebSockets.
- **Database**: PostgreSQL 16 (production) with automatic SQLite async fallback for local zero-dependency development.
- **AI & Speech**: Offline RAG vector engine, Faster-Whisper pipeline, Web Speech / Edge-TTS synthesis, Ollama LLM integration.
- **Telephony**: Modular Telephony Gateway layer supporting Browser Simulated WebRTC, Asterisk, FreeSWITCH, and SIP Trunks.

---

## 4. 16 Integrated Dashboard Modules

| # | Module | Route | Functionality |
|---|---|---|---|
| 1 | **Main Dashboard** | `/dashboard` | Live genuine KPIs, active call volume, CSAT, recent call logs |
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
| 13 | **Analytics & Reports** | `/analytics` | Recharts graphs: hourly trends, language distribution pie chart, CSAT |
| 14 | **Company Settings** | `/settings` | Profile, business hours, greeting templates, SIP gateway config |
| 15 | **AI Configuration** | `/ai-config` | Voice persona selector per language, confidence threshold slider |
| 16 | **Authentication** | `/login` | Secure JWT login & registration with demo auto-fill credentials |

---

## 5. Operational Cost Analysis & Realities

While NEXORA AI leverages open-source engines (FastAPI, Faster-Whisper, Piper, PostgreSQL, React) to eliminate paid commercial per-token LLM charges, deploying a voice platform requires physical infrastructure:

| Infrastructure Component | Estimated Monthly Cost | Notes |
|---|---|---|
| **GPU Inference Host** (T4 / A10G) | \$120 - \$280 / mo | Runs Faster-Whisper and Ollama local LLM with $< 350$ms latency |
| **Cloud Application Server** (4 vCPU, 8GB RAM) | \$40 - \$80 / mo | Runs FastAPI backend, PostgreSQL, and Nginx frontend |
| **SIP Trunking & DID Phone Numbers** | \$0.008 - \$0.015 / min | Inbound / Outbound carrier telephony rates (Twilio, Telnyx, Bandwidth) |
| **SSL / Domain / Object Storage** | \$10 - \$20 / mo | Call audio recording storage and SSL certificates |
| **Total Estimated Operating Cost** | **~\$180 - \$400 / mo** | Eliminates \$0.06/min per-seat proprietary AI agent SaaS fees |

---

## 6. Local Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js v18+ and npm
- (Optional) PostgreSQL 16 & Ollama

### Step 1: Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install "email-validator>=2.0.0"

# Copy environment configuration
cp .env.example .env

# Run database schema migration & seed demo data
python -c "
import sys, asyncio
sys.path.insert(0, '.')
from app.core.database import engine, Base
from app.seed import seed_initial_data
async def init():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    await seed_initial_data()
asyncio.run(init())
"

# Start FastAPI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### Step 2: Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Web application will be accessible at: `http://localhost:5173`

### Demo Credentials
- **Admin Email**: `admin@nexora.ai`
- **Password**: `Admin@123`
*(A quick auto-fill button is available directly on the login screen).*

---

## 7. Running Automated Tests

Run the backend test suite:
```bash
cd backend
.\venv\Scripts\pytest.exe -v
```

Verified test coverage:
- ✅ Health endpoint verification
- ✅ JWT Authentication & user authorization
- ✅ Real-time live call lifecycle (Start $\rightarrow$ Turn $\rightarrow$ End)
- ✅ Grounded RAG query against company documents
- ✅ Unknown-question refusal and automated human handoff trigger
- ✅ Multilingual detection across Tamil, English, Hindi, Telugu, Malayalam
- ✅ Transliterated keyword detection (Tanglish & Hinglish)
- ✅ Document chunking and 128-dimensional vector cosine search

---

## 8. Docker Deployment

Deploy the entire stack (PostgreSQL, Redis, FastAPI, Nginx Frontend, Ollama) via Docker Compose:
```bash
docker-compose up -d --build
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/docs`

---

## 9. License & Attribution
Designed and built for enterprise virtual receptionist and business communication automation.

