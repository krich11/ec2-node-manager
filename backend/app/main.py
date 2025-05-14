#!/usr/bin/python3

# backend/main.py

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio

app = FastAPI()

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    while True:
        # Send a node update every 5 seconds for demo
        await asyncio.sleep(5)
        await websocket.send_json({
            "type": "add_node",
            "node": {
                "id": "node-123",
                "data": {"label": "Live Node"},
                "position": {"x": 100, "y": 100}
            }
        })

@app.get("/api/status")
def get_status():
    return {"status": "EC2 Node Manager backend running"}

