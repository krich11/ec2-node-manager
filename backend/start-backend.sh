#!/bin/bash

# Activate the virtual environment
source ./venv/bin/activate
cd app

# Optional: set environment variables
export ENV=production
export PORT=8000

# Start the FastAPI server
uvicorn main:app --host 0.0.0.0 --port $PORT --reload

cd ..
