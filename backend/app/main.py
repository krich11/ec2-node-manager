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


async def handleNodeAction(msg):
    match msg['message']:
        case "start":
            print(f"Node Action: {msg['message']}")
            rtnmsg = {"type": "set-status", "id": msg['id'], "message": "running"};
            await message_queue_out.put(rtnmsg)
        case "provision":
            print(f"Node Action: {msg['message']}")
            rtnmsg = {"type": "set-status", "id": msg['id'], "message": "warning"};
            await message_queue_out.put(rtnmsg)
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
                await handleNodeAction(msg)
            case _:
                print("Unknown websocket message")

        time.sleep(1) # simulate work, can remove
        print("Message done, removing from queue.")
        message_queue_in.task_done()


asyncio.create_task(handleMessagesIn())
#asyncio.create_task(handleMessagesOut())

# Allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

'''
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
'''

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected")

    try:
        while True:
            # Create two tasks: one for receiving messages, one for checking outgoing queue
            receive_task = asyncio.create_task(websocket.receive_text())
            outgoing_check_task = asyncio.create_task(check_outgoing_messages(websocket))

            # Wait for either task to complete
            done, pending = await asyncio.wait(
                [receive_task, outgoing_check_task],
                return_when=asyncio.FIRST_COMPLETED
            )

            # Cancel the pending task
            for task in pending:
                task.cancel()

            # Handle the completed task(s)
            for task in done:
                if task is receive_task:
                    # Process the received message
                    try:
                        data = task.result()
                        msg = json.loads(data)
                        print(f"Received message: {msg}")
                        match msg.get('type'):
                            case "node_action" | "another message type" | "yet another type":
                                await message_queue_in.put(msg)
                            case _:
                                print("Unknown message type:", msg)
                    except Exception as e:
                        print(f"Error processing message: {str(e)}")
                        # Re-raise if it's a disconnect error to break the loop
                        if "disconnect" in str(e).lower():
                            raise

    except WebSocketDisconnect:
        print("WebSocket disconnected gracefully.")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
    finally:
        print("WebSocket connection closed")

async def check_outgoing_messages(websocket: WebSocket):
    """Helper function to check for outgoing messages"""
    try:
        # Wait a short time for any outgoing messages
        await asyncio.sleep(0.1)

        # Check the queue for any messages to send
        try:
            msg_out = message_queue_out.get_nowait()
            await websocket.send_json(msg_out)
            message_queue_out.task_done()
            return True  # Message was sent
        except asyncio.QueueEmpty:
            return False  # No message was available

    except Exception as e:
        print(f"Error sending outgoing message: {str(e)}")
        raise  # Re-raise to handle disconnect in the main loop
