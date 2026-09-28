from collections import defaultdict

from fastapi import WebSocket


# WebSocket Connection Manager

class ConnectionManager:

    def __init__(self):
        self.room_connections: dict[
            int,
            list[WebSocket]
        ] = defaultdict(list)

        self.conversation_connections: dict[
            int,
            list[WebSocket]
        ] = defaultdict(list)

        self.user_connections: dict[
            int,
            list[WebSocket]
        ] = defaultdict(list)

    # Connect Room

    async def connect_room(
        self,
        room_id: int,
        user_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        self.room_connections[
            room_id
        ].append(websocket)

        self.user_connections[
            user_id
        ].append(websocket)

    # Connect Conversation

    async def connect_conversation(
        self,
        conversation_id: int,
        user_id: int,
        websocket: WebSocket
    ):
        await websocket.accept()

        self.conversation_connections[
            conversation_id
        ].append(websocket)

        self.user_connections[
            user_id
        ].append(websocket)

    # Disconnect Client

    def disconnect(
        self,
        websocket: WebSocket,
        user_id: int,
        room_id: int | None = None,
        conversation_id: int | None = None
    ):
        groups = []

        if room_id is not None:
            groups.append(
                self.room_connections[room_id]
            )

        if conversation_id is not None:
            groups.append(
                self.conversation_connections[
                    conversation_id
                ]
            )

        groups.append(
            self.user_connections[user_id]
        )

        for group in groups:
            if websocket in group:
                group.remove(websocket)

        if (
            room_id is not None
            and not self.room_connections[room_id]
        ):
            self.room_connections.pop(
                room_id,
                None
            )

        if (
            conversation_id is not None
            and not self.conversation_connections[
                conversation_id
            ]
        ):
            self.conversation_connections.pop(
                conversation_id,
                None
            )

        if not self.user_connections[user_id]:
            self.user_connections.pop(
                user_id,
                None
            )

    # Broadcast Room

    async def broadcast_room(
        self,
        room_id: int,
        message: dict
    ):
        for connection in list(
            self.room_connections.get(
                room_id,
                []
            )
        ):
            await connection.send_json(message)

    # Broadcast Conversation

    async def broadcast_conversation(
        self,
        conversation_id: int,
        message: dict
    ):
        for connection in list(
            self.conversation_connections.get(
                conversation_id,
                []
            )
        ):
            await connection.send_json(message)

    # Send User Notification

    async def send_to_user(
        self,
        user_id: int,
        message: dict
    ):
        for connection in list(
            self.user_connections.get(
                user_id,
                []
            )
        ):
            await connection.send_json(message)

    # Online Status

    def is_online(
        self,
        user_id: int
    ) -> bool:
        return bool(
            self.user_connections.get(
                user_id
            )
        )


manager = ConnectionManager()