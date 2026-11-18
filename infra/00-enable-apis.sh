#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="ai-builder-sql-copilot"

echo "Enabling core Google Cloud APIs on ${PROJECT_ID}..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  aiplatform.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  cloudtrace.googleapis.com \
  clouderrorreporting.googleapis.com \
  iamcredentials.googleapis.com \
  airquality.googleapis.com \
  texttospeech.googleapis.com \
  --project="${PROJECT_ID}"

echo "APIs enabled successfully."
