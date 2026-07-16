# Email migration report

## Summary
- The backend originally sent verification and password reset emails through SMTP using Nodemailer.
- The new architecture uses an external Railway microservice for SMTP delivery.
- The existing auth flow, user model, token generation, and API structure remain intact.

## Current email flows
1. Registration creates a verification code and sends it via the backend email wrapper.
2. Password reset requests send a reset code via the backend email wrapper.
3. The backend now calls the Railway email service over HTTPS instead of connecting directly to SMTP.

## Files changed
- backend/config/emailService.js
- backend/services/emailClient.js
- backend/server.js
- backend/.env.example
- delivo-email-service/*
