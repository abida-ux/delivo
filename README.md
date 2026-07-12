# Delivo

A full-stack food delivery application with a React/Vite frontend and an Express/MongoDB backend.

## Structure

- frontend/: Vite + React app for deployment on Vercel
- backend/: Express + MongoDB API for deployment on Render/Railway/etc.

## Development

Frontend:
- cd frontend
- npm install
- npm run dev

Backend:
- cd backend
- npm install
- npm run dev

## Environment

- Frontend uses VITE_API_URL for the API base URL.
- Backend uses its own .env file with MONGO_URI, PORT, JWT_SECRET, and FRONTEND_URL.
