from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import engine
from models import Base
from routers import conversations, messages, auth
from seed import seed_database
Base.metadata.create_all(bind=engine)
seed_database()

app = FastAPI(title="Signal Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations.router)
app.include_router(messages.router)
app.include_router(auth.router)


class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, conversation_id: int, websocket: WebSocket):
        await websocket.accept()

        if conversation_id not in self.active_connections:
            self.active_connections[conversation_id] = []

        self.active_connections[conversation_id].append(websocket)

    def disconnect(self, conversation_id: int, websocket: WebSocket):
        if conversation_id in self.active_connections:
            self.active_connections[conversation_id].remove(websocket)

            if len(self.active_connections[conversation_id]) == 0:
                del self.active_connections[conversation_id]

    async def broadcast(self, conversation_id: int, message: dict):
        if conversation_id in self.active_connections:
            for connection in self.active_connections[conversation_id]:
                await connection.send_json(message)


manager = ConnectionManager()


@app.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    await manager.connect(conversation_id, websocket)

    try:
        while True:
            data = await websocket.receive_json()
            await manager.broadcast(conversation_id, data)

    except WebSocketDisconnect:
        manager.disconnect(conversation_id, websocket)


@app.get("/")
def home():
    return {"message": "Signal Clone Backend Running"}