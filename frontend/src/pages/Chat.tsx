import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import { useAuth } from "../context/AuthContext";


/* Chat Message */

interface Message {
  id: number;
  content: string;
  sender_id: number;
  username: string;
  room_id: number;
  created_at: string;
}


/* Chat Room */

interface Room {
  id: number;
  name: string;
  description: string | null;
}


/* Chat Page */

function Chat() {
  const { user, token } = useAuth();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");

  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const [connected, setConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);


  /* Load Chat Rooms */

  const loadRooms = async () => {
    if (!token) {
      return;
    }

    const response = await fetch(
      "http://localhost:8000/rooms",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    setRooms(data);

    if (data.length > 0 && !selectedRoom) {
      setSelectedRoom(data[0].id);
    }
  };


  useEffect(() => {
    loadRooms();
  }, [token]);


  /* Create Chat Room */

  const createRoom = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!token || !roomName.trim()) {
      return;
    }

    const response = await fetch(
      "http://localhost:8000/rooms",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: roomName.trim(),
          description: roomDescription.trim() || null,
        }),
      }
    );

    if (!response.ok) {
      return;
    }

    const newRoom = await response.json();

    setRooms((current) => [
      newRoom,
      ...current,
    ]);

    setSelectedRoom(newRoom.id);

    setRoomName("");
    setRoomDescription("");
    setShowCreateRoom(false);
  };


  /* Load Room Messages */

  useEffect(() => {
    if (!selectedRoom || !token) {
      return;
    }

    const loadMessages = async () => {
      const response = await fetch(
        `http://localhost:8000/rooms/${selectedRoom}/messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setMessages(data);
    };

    loadMessages();
  }, [selectedRoom, token]);


  /* WebSocket Connection */

  useEffect(() => {
    if (!selectedRoom || !user || !token) {
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:8000/ws/rooms/${selectedRoom}?token=${token}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const incomingMessage = JSON.parse(event.data);

      setMessages((current) => [
        ...current,
        incomingMessage,
      ]);
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [selectedRoom, user, token]);


  /* Send Message */

  const sendMessage = () => {
    const content = message.trim();

    if (!content) {
      return;
    }

    if (
      socketRef.current?.readyState !==
      WebSocket.OPEN
    ) {
      return;
    }

    socketRef.current.send(
      JSON.stringify({
        content,
      })
    );

    setMessage("");
  };


  const activeRoom = rooms.find(
    (room) => room.id === selectedRoom
  );


  return (
    <main className="chat-page">

      <aside className="room-sidebar">

        <div className="sidebar-header">
          <h1>Chirp</h1>
          <span>Public Rooms</span>
        </div>

        <button
          className="create-room-button"
          onClick={() =>
            setShowCreateRoom((current) => !current)
          }
        >
          + Create Room
        </button>


        {showCreateRoom && (
          <form
            className="create-room-form"
            onSubmit={createRoom}
          >
            <input
              type="text"
              value={roomName}
              placeholder="Room name"
              maxLength={100}
              onChange={(event) =>
                setRoomName(event.target.value)
              }
            />

            <textarea
              value={roomDescription}
              placeholder="Description"
              maxLength={255}
              onChange={(event) =>
                setRoomDescription(event.target.value)
              }
            />

            <button type="submit">
              Create
            </button>
          </form>
        )}


        <div className="room-list">

          {rooms.map((room) => (
            <button
              key={room.id}
              className={
                selectedRoom === room.id
                  ? "room active"
                  : "room"
              }
              onClick={() =>
                setSelectedRoom(room.id)
              }
            >
              <strong>{room.name}</strong>

              {room.description && (
                <small>
                  {room.description}
                </small>
              )}
            </button>
          ))}

        </div>

      </aside>


      <section className="chat-container">

        <header className="chat-header">

          <div>
            <h2>
              {activeRoom?.name ||
                "Select a room"}
            </h2>

            <span>
              {connected
                ? "Connected"
                : "Disconnected"}
            </span>
          </div>

        </header>


        <section className="messages">

          {messages.length === 0 && (
            <div className="empty-messages">
              <h3>No messages yet</h3>
              <p>
                Start the conversation in this room.
              </p>
            </div>
          )}

          {messages.map((item) => (
            <div
              key={item.id}
              className={
                item.sender_id === user?.id
                  ? "message own"
                  : "message"
              }
            >
              <strong>
                {item.username}
              </strong>

              <p>{item.content}</p>

              <small>
                {new Date(
                  item.created_at
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
          ))}

        </section>


        <form
          className="message-form"
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage();
          }}
        >
          <input
            type="text"
            value={message}
            placeholder={
              connected
                ? "Type a message..."
                : "Connecting..."
            }
            disabled={!connected}
            onChange={(event) =>
              setMessage(event.target.value)
            }
          />

          <button
            type="submit"
            disabled={!connected || !message.trim()}
          >
            Send
          </button>
        </form>

      </section>

    </main>
  );
}

export default Chat;