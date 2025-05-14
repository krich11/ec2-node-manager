#!/usr/bin/python3

# backend/main.py

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import queue
import threading
import time

app = FastAPI()
message_queue_in = queue.Queue()

def handleNodeAction(msg):
    match msg['message']:
        case "start":
            print(f"Node Action: {msg['message']}")
        case "provisioning":
            print(f"Node Action: {msg['message']}")
        case _:
            print(f"Unknown Node Action message: {msg['message']}")


def handleMessagesIn():
    while True:
        msg = message_queue_in.get()
        if msg['type'] == "STOP": 
            print("Handler stopping.")
            break
        print(f"Processing message: {msg['type']} / {msg['message']}")
        match msg['type']:
            case "node_action":
                print("Handling Node Action")
                handleNodeAction(msg)
            case _:
                print("Unknown websocket message")

        time.sleep(1) # simulate work, can remove
        print("Message done, removing from queue.")
        message_queue_in.task_done()


handler_thread = threading.Thread(target=handleMessagesIn, daemon=True)
handler_thread.start()

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
    try:
        while True:
            # Listen for messages from the frontend (even if you ignore them)
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
                print("Received from frontend:", data)

                msg = json.loads(data)
                print(f"Message: {msg}")

                match msg['type']:
                    case "node_action":
                        print(f"Node Action: {msg['message']}")
                        message_queue_in.put(msg)
                    case _:
                        print("Unknown websocket message")

            except asyncio.TimeoutError:
                # Timeout just means no message from frontend — that's fine
                pass

            # Send a node update every 5 seconds
            #await websocket.send_json({
            #    "type": "add_node",
            #    "node": {
            #        "id": "node-123",
            #        "data": {"label": "Live Node"},
            #        "position": {"x": 100, "y": 100}
            #    }
            #})

    except Exception as e:
        print("WebSocket error:", e)


