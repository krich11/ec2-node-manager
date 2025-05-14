#!/usr/bin/python3

# backend/main.py

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import queue
import threading
import time
from starlette.websockets import WebSocketDisconnect

app = FastAPI()
message_queue_in = asyncio.Queue()
message_queue_out = asyncio.Queue()



def handleNodePropertySet(msg):
    message_queue_in.put(msg)


def handleNodeAction(msg):
    match msg['message']:
        case "start":
            print(f"Node Action: {msg['message']}")
        case "provision":
            print(f"Node Action: {msg['message']}")
            await message_queue_out.put("provision return message")
        case _:
            print(f"Unknown Node Action message: {msg['message']}")



async def handleMessagesIn():
    while True:
        msg = await message_queue_in.get()
        if msg['type'] == "STOP": 
            print("Handler stopping.")
            break
        print(f"Processing inbound message: {msg['type']} / {msg['message']}")
        match msg['type']:
            case "node_action":
                print("Handling Node Action")
                handleNodeAction(msg)
            case _:
                print("Unknown websocket message")

        time.sleep(1) # simulate work, can remove
        print("Message done, removing from queue.")
        message_queue_in.task_done()

'''
async def handleMessagesOut():
    while True:
        msg = message_queue_out.get()
        print(f"Processing outbound message: {msg['type']} / {msg['message']}")
        handlePropertySet('{ "status": "warning" }')
        time.sleep(1) # simulate work, can remove
        print("Message queued for sending.")
'''

asyncio.create_task(handleMessagesIn())
#asyncio.create_task(handleMessagesOut())

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
            # 1. Try receiving a message from frontend
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)
                msg = json.loads(data)

                match msg.get('type'):
                    case "node_action" | "another message type" | "yet another type":
                        await message_queue_in.put(msg)
                    case _:
                        print("Unknown message type:", msg)

            except asyncio.TimeoutError:
                # No message received within timeout — that's fine
                pass

            # 2. Check if there's a message to send back
            try:
                msg_out = message_queue_out.get_nowait()
                await websocket.send_json(msg_out)
            except asyncio.QueueEmpty:
                pass

    except WebSocketDisconnect:
        print("WebSocket disconnected.")
    except Exception as e:
        print("WebSocket error:", e)
