# Deployment Guide

This repo is split into:
- `frontend/`: React + Vite app for Vercel.
- `backend/`: Express + MongoDB API for Render.

## Security check
- `.env` and `backend/.env` are ignored by git via `.gitignore`.
- No production secrets should be committed in this repo.
- Use the `.env.example` files as templates only.

## Backend deployment on Render
1. Sign in to Render and create a new Web Service.
2. Select your GitHub repo and choose the branch to deploy.
3. Set the root directory to `backend`.
4. Use these settings:
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Branch: `main` (or your deployment branch)
5. Add the environment variables in Render Dashboard:
   - `MONGO_URI` = your MongoDB connection string
   - `JWT_SECRET` = a strong random secret
   - `FRONTEND_URL` = `https://<your-vercel-domain>`
6. Optionally add:
   - `NODE_ENV=production`
   - `PORT=10000` (Render provides a port automatically, but this can be left unset)
7. Deploy.

### Why these env vars
- `MONGO_URI` is only used by the backend.
- `JWT_SECRET` is used to sign auth tokens.
- `FRONTEND_URL` allows CORS and email links to work from Render.

## Frontend deployment on Vercel
1. In Vercel, create a new project and import this repo.
2. Set the root directory to `frontend`.
3. Framework: `Vite`
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add environment variable:
   - `VITE_API_URL` = `https://<your-backend>.onrender.com/api`
7. Deploy.

### Notes
- The frontend reads `VITE_API_URL` during build and uses it for all API calls.
- If this env var is missing in production, the app will attempt to call a relative `/api` path.

## Local development
- Backend: `cd backend && npm install && npm run dev`
- Frontend: `cd frontend && npm install && npm run dev`

### Local environment examples
- `backend/.env.example`
- `frontend/.env.example`

## Verify connectivity
- After Render deploy, open `https://<your-backend>.onrender.com/api/health`
- After Vercel deploy, open the frontend and verify API requests succeed.
- Make sure the Render backend CORS settings include your Vercel site.

## Important
- Do not commit actual `.env` files.
- Use strong values for `JWT_SECRET` and `MONGO_URI`.
- If a secret was ever exposed publicly, rotate it immediately.
