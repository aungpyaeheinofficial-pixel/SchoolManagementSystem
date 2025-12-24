<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1PltupHOvpXtgOhfzgMzUNB8cgGIzfI1C

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Backend (New)

This repo now includes an optional backend API under `backend/` for:
- login (JWT): `POST /api/auth/login`
- dataset sync: `GET /api/sync/pull`, `POST /api/sync/push`

### Run backend locally

1. Install backend deps:
   `npm --prefix backend install`
2. Create env file:
   - copy `backend/env.example` → `backend/.env` (create it manually)
   - **change `JWT_SECRET`**
3. Generate Prisma + migrate:
   `npm run backend:prisma:generate`
   `npm run backend:prisma:migrate:dev`
4. Seed admin user + empty dataset:
   `npm run backend:seed`
5. Start:
   `npm run backend:dev`

### Frontend ↔ backend

Set `VITE_API_BASE_URL` for the frontend (example: `http://localhost:5600`) and the login form will authenticate against the backend.
After login, the app will pull server dataset once and then auto-push changes in the background (debounced).