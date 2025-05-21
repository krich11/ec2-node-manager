#!/usr/bin/python3

# backend/main.py

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
import time
from starlette.websockets import WebSocketDisconnect

app = FastAPI()
message_queue_in = asyncio.Queue()
message_queue_out = asyncio.Queue()

nodeList = []
edgeList = []


async def handleNodeAction(msg):
    match msg['message']:
        case "start":
            print(f"Node Action: {msg['message']}")
            rtnmsg = {"type": "set-status", "id": msg['id'], "message": "running"}
            await message_queue_out.put(rtnmsg)
        case "provision":
            print(f"Node Action: {msg['message']}")
            rtnmsg = {"type": "set-status", "id": msg['id'], "message": "warning"}
            await message_queue_out.put(rtnmsg)
        case "add_node":
            print(f"Node Action: {msg['message']}")

            rtnmsg = {"type": "set-status", "id": msg['id'], "message": "warning"}
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
        try:
            match msg['type']:
                case "node_action":
                    print("Handling Node Action")
                    await handleNodeAction(msg)
                case _:
                    print("Unknown websocket message")
            
            # Remove this sleep - it's causing the 1-second delay
            # time.sleep(1)  # simulate work, can remove
            
            print("Message done, removing from queue.")
            message_queue_in.task_done()
        except Exception as e:
            print(f"Error handling message: {str(e)}")
            message_queue_in.task_done()  # Still mark as done even if there was an error


# Create the handler task
async def startup_event():
    asyncio.create_task(handleMessagesIn())

app.add_event_handler("startup", startup_event)

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
            
            try:
                # Clean up cancelled tasks to avoid warnings
                await asyncio.gather(*pending, return_exceptions=True)
            except:
                pass
                
            # Handle the completed task(s)
            for task in done:
                if task is receive_task and not task.cancelled():
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
        # Poll the queue more frequently
        for _ in range(5):  # Try multiple quick checks instead of one longer wait
            try:
                msg_out = message_queue_out.get_nowait()
                await websocket.send_json(msg_out)
                message_queue_out.task_done()
                return True  # Message was sent
            except asyncio.QueueEmpty:
                await asyncio.sleep(0.01)  # Very short sleep between checks
        
        # If no message after multiple quick checks, wait a bit longer
        await asyncio.sleep(0.05)
        return False
            
    except Exception as e:
        print(f"Error sending outgoing message: {str(e)}")
        raise  # Re-raise to handle disconnect in the main loop
