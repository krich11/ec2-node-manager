#!/usr/bin/python3
from fastapi import FastAPI

app = FastAPI()

@app.get("/api/status")
def get_status():
    return {"status": "EC2 Node Manager backend running"}
