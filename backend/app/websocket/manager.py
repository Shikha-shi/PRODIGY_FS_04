from fastapi import WebSocket


# WebSocket Connection Manager

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}


    # Connect Client

    async def connect(
        self,
        room_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        if room_id not in self.active_connections:
            self.active_connections[room_id] = []

        self.active_connections[room_id].append(websocket)


    # Disconnect Client

    def disconnect(
        self,
        room_id: int,
        websocket: WebSocket
    ):
        if room_id not in self.active_connections:
            return

        if websocket in self.active_connections[room_id]:
            self.active_connections[room_id].remove(websocket)

        if not self.active_connections[room_id]:
            del self.active_connections[room_id]


    # Broadcast Message

    async def broadcast(
        self,
        room_id: int,
        message: str
    ):
        connections = self.active_connections.get(
            room_id,
            []
        )

        for connection in connections:
            await connection.send_text(message)


manager = ConnectionManager()