# NagarSetu

NagarSetu is a civic procedure navigation platform that helps citizens find, understand, and complete public-service workflows such as trade licenses, water connections, and property tax procedures. It combines a modern web frontend with a FastAPI backend and a retrieval-augmented generation (RAG) layer grounded in official municipal and civic documents.

The app is designed to be checklist-first, source-aware, and transparent about when it is operating in demo mode or using retrieved evidence.

## Why NagarSetu?

Citizens often face fragmented and confusing government processes:

- scattered rules across municipal websites and notices
- unclear document requirements
- inconsistent guidance across departments
- difficulty tracking progress across multi-step procedures

NagarSetu simplifies this by turning civic procedures into:

- a conversational assistant
- a verified checklist of required steps
- a cited source trail for each answer
- persistent progress tracking across sessions

## Key Features

- Civic procedure guidance grounded in official municipal sources
- Hybrid retrieval using vector search and BM25 keyword matching
- Response verification layer to reduce hallucinations and ungrounded claims
- Actionable step-by-step checklist for civic tasks
- Secure user authentication and session-based progress tracking
- Demo mode for offline or zero-network environments
- Responsive frontend built with Next.js and Tailwind CSS
- FastAPI backend with structured API routes for chat and progress

## Architecture

NagarSetu is composed of three primary layers:

- Frontend: Next.js application for the user interface
- Backend: FastAPI service for auth, chat, and progress APIs
- RAG pipeline: retrieval + verification + scope checks over civic data

### High-level flow

1. User asks a civic procedure question from the frontend
2. The backend validates the request and checks scope
3. Relevant municipal content is retrieved using hybrid search
4. Retrieved chunks are verified against the user query and source material
5. A grounded answer and checklist are returned to the user
6. Progress is saved for the current authenticated or demo session

## Tech Stack

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Lucide icons

### Backend

- Python 3
- FastAPI
- Uvicorn
- SQLite for local persistence
- Optional PostgreSQL support through database configuration

### Retrieval & AI

- ChromaDB
- BM25-based keyword retrieval
- Groq or Gemini-based LLM generation
- RAG verification and scope-gating logic

## Workflow

[![Architecture diagram of auroravane/nagarsetu](https://gitdiagram.com/auroravane/nagarsetu/diagram.png)](https://gitdiagram.com/auroravane/nagarsetu?utm_source=readme&utm_medium=picture)

[![Architecture diagram](https://gitdiagram.com/diagram-badge.svg)](https://gitdiagram.com/auroravane/nagarsetu?utm_source=readme&utm_medium=badge)
## Repository Structure

```text
NagarSetu/
├── backend/
│   ├── db/
│   ├── evals/
│   ├── llm/
│   ├── models/
│   ├── rag/
│   ├── routers/
│   ├── tests/
│   ├── __init__.py
│   ├── main.py
│   └── requirements.txt
├── data/
├── docs/
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── public/
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── pitch/
├── scripts/
├── .env.example
├── .gitignore
├── Procfile
├── README.md
├── requirements.txt
└── ...
```

## Quick Start

### Prerequisites

Before running the project, make sure you have installed:

- Python 3.10+
- Node.js 18+
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Auroravane/NagarSetu.git
cd NagarSetu
```

### 2. Configure environment variables

Copy the example environment file and adjust values as needed:

```bash
cp .env.example .env
```

The example file includes configuration for:

- Groq or Gemini API keys
- demo mode flags
- storage paths
- frontend API URL

If no API key is provided, the app can automatically fall back to demo mode.

### 3. Install backend dependencies

```bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
# or .venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

## Run the Application

### Start the backend

From the project root:

```bash
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### Start the frontend

In a second terminal:

```bash
cd frontend
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Production / Static Build

The frontend can be built for production with:

```bash
cd frontend
npm run build
```

The backend can serve a built frontend if static assets are available in the configured output directory.

## Demo Mode

The project supports a demo mode designed for local testing or offline environments. When no usable LLM key is configured, the app warns and switches into a safe demo flow that uses bundled data instead of making external calls.

This is useful for:

- hackathon demos
- local testing without live credentials
- offline validation of the UX and flow

## Documentation

The repository includes additional documentation in the `docs/` folder:

- `docs/demo-script.md` — demo walkthrough and presentation flow
- `docs/implementation-baseline.md` — project architecture and baseline notes
- `docs/security-findings.md` — security review and findings
- `docs/testing.md` — testing guidance and validation notes

## Project Goals

NagarSetu aims to make public service guidance more accessible and actionable by combining:

- civic data retrieval
- grounded response generation
- procedure tracking
- secure user-level state
- transparent AI behavior

It is intended for use in civic-tech, governance, and public service accessibility scenarios.

## Notes

- The project is structured for both local development and demonstration environments.
- Environment files and secrets should never be committed to source control.
- Use the included `.env.example` as a template for local configuration.

## Contributing

Contributions are welcome. If you want to extend the project:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Validate locally with tests and build checks
5. Open a pull request with a clear description

## Contact

Project repository: https://github.com/Auroravane/NagarSetu
