#!/usr/bin/env bash
set -e
BASE_URL=${1:-http://localhost:4000}
API_KEY=${2:-replace-with-secret}

curl -X POST "$BASE_URL/api/send-verification" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"email":"user@example.com","token":"123456"}'

echo

curl -X POST "$BASE_URL/api/send-password-reset" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"email":"user@example.com","token":"654321"}'

echo

curl -X POST "$BASE_URL/api/send-welcome" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"email":"user@example.com","name":"Delivo User"}'

echo
