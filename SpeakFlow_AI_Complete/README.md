# SpeakFlow AI

A multilingual speech-to-text web application built with React, FastAPI, WebSockets, Faster-Whisper, and SQLAlchemy. Audio is captured as 16 kHz mono PCM and sent over a WebSocket. The backend transcribes overlapping rolling windows to provide incremental updates, then saves the final session to a relational database.

## Features
- Microphone capture in the browser.
- Incremental transcription updates while recording (rolling 8-second windows, refreshed every 4 seconds).
- Automatic language detection or a selected language (Hindi, English, Tamil, Telugu, Bengali, Marathi).
- Local open-source Faster-Whisper inference; no paid speech API.
- Persistent transcription history.
- CRUD: create automatically on completion, list/search, read one, edit, delete.
- SQLite for local development; PostgreSQL supported using `DATABASE_URL`.
- Dockerfiles for backend and frontend.

## Architecture
Browser microphone -> Web Audio API (PCM16, 16 kHz mono) -> WebSocket -> FastAPI -> overlapping WAV windows -> Faster-Whisper -> partial UI updates. On stop, the complete recording is transcribed and stored in SQLAlchemy-backed SQLite/PostgreSQL. REST endpoints power history CRUD.

## Requirements
- Python 3.11 recommended
- Node.js 20+
- FFmpeg installed and on PATH (also installed in backend Docker image)
- Microphone access (localhost or HTTPS)

## Local setup (Windows CMD)

### 1. Backend
```cmd
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
python -m uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000  
Swagger: http://127.0.0.1:8000/docs

The first transcription downloads the selected Whisper model. The `base` model is a reasonable CPU starting point. Set `WHISPER_MODEL=tiny` for faster/lower-memory testing or `small` for potentially better accuracy at greater cost.

### 2. Frontend (new terminal)
```cmd
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:5173

Optional `frontend/.env`:
```env
VITE_API_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000
```
For production, use HTTPS API and WSS WebSocket URLs.

## Database
By default, SQLite creates `backend/speakflow.db` when the backend starts. PostgreSQL:
```env
DATABASE_URL=postgresql+psycopg://USERNAME:PASSWORD@HOST:5432/speakflow
```
Create the database first. For a production system, use Alembic migrations instead of relying on `create_all`.

## REST API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/transcriptions` | Create record |
| GET | `/api/transcriptions?q=term&skip=0&limit=50` | List/search |
| GET | `/api/transcriptions/{id}` | Read one |
| PUT | `/api/transcriptions/{id}` | Update title/text |
| DELETE | `/api/transcriptions/{id}` | Delete record |
| GET | `/api/health` | Health check |
| WS | `/ws/transcribe` | PCM streaming transcription |

## Important engineering notes
- This is incremental rolling-window transcription, not guaranteed word-by-word streaming. Faster-Whisper is an offline inference engine. The UI updates after each audio window has been processed.
- The final transcript is generated from the complete recording to reduce errors caused by rolling-window overlap/revisions.
- Browser capture resamples audio to 16 kHz using a simple sample-selection resampler. For production audio quality, replace it with a high-quality polyphase resampler and AudioWorklet.
- The websocket currently keeps session audio in memory. Add authentication, per-user ownership, rate limits, quotas, and object storage before public multi-user deployment.
- SQLAlchemy `create_all` is suitable for this assignment/demo. Use Alembic migrations for schema evolution.
- For Hindi-English code-switching, use `auto` language detection and test with actual mixed-language recordings. Accuracy depends on microphone quality, accents, and model size.

## Deployment
Deploy backend and frontend separately:
1. Provision a PostgreSQL database and set `DATABASE_URL`.
2. Deploy `backend/` using `backend/Dockerfile`. Set `WHISPER_MODEL`, `WHISPER_DEVICE=cpu`, `WHISPER_COMPUTE_TYPE=int8`, and `FRONTEND_ORIGINS` to the deployed frontend origin.
3. Deploy `frontend/` as a static Vite site. Set build-time variables:
   - `VITE_API_URL=https://YOUR-BACKEND-DOMAIN`
   - `VITE_WS_URL=wss://YOUR-BACKEND-DOMAIN`
4. Rebuild the frontend after setting environment variables.
5. Confirm `/api/health`, `/docs`, browser microphone permissions, WSS connection, and CRUD history.
6. Check host CPU/RAM/disk limits. Whisper model downloads and inference can exceed small free-tier resource limits. A free tier may sleep, have no persistent disk, or prohibit long-running CPU inference; choose a host that permits the workload.

## GitHub
Push the project:
```cmd
git add .
git commit -m "Complete SpeakFlow AI with incremental transcription and CRUD history"
git push origin main
```

## License
For educational and hiring-assignment use. Verify model and dependency licenses before commercial redistribution.
