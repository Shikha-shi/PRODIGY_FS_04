from fastapi import WebSocket


# WebSocket Connection Manager

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[
            int,
            list[WebSocket]
        ] = {}


    # Connect Client

    async def connect(
        self,
        room_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        self.active_connections.setdefault(
            room_id,
            []
        ).append(websocket)


    # Disconnect Client

    def disconnect(
        self,
        room_id: int,
        websocket: WebSocket
    ):
        connections = self.active_connections.get(
            room_id
        )

        if not connections:
            return

        if websocket in connections:
            connections.remove(websocket)

        if not connections:
            del self.active_connections[room_id]


    # Broadcast Message

    async def broadcast(
        self,
        room_id: int,
        message: dict
    ):
        connections = self.active_connections.get(
            room_id,
            []
        )

        for connection in connections:
            await connection.send_json(message)


manager = ConnectionManager()