import { useEffect, useRef, useState } from "react";

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


/* Chat Page */

function Chat() {
  const { user, token } = useAuth();

  const [rooms, setRooms] = useState<
    {
      id: number;
      name: string;
      description: string | null;
    }[]
  >([]);

  const [selectedRoom, setSelectedRoom] = useState<
    number | null
  >(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);


  /* Load Chat Rooms */

  useEffect(() => {
    if (!token) {
      return;
    }

    const loadRooms = async () => {
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

      if (data.length > 0) {
        setSelectedRoom(data[0].id);
      }
    };

    loadRooms();
  }, [token]);

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
    if (!selectedRoom || !user) {
      return;
    }

    const socket = new WebSocket(
      `ws://localhost:8000/ws/rooms/${selectedRoom}`
    );

    socketRef.current = socket;

    socket.onopen = () => {
  setConnected(true);
};

    socket.onmessage = (event) => {
      const incomingMessage =
        JSON.parse(event.data);

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
  }, [selectedRoom, user]);


  /* Send Message */

  const sendMessage = () => {
    const content = message.trim();

    if (!content || !user) {
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
        user_id: user.id,
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
            disabled={!connected}
          >
            Send
          </button>
        </form>

      </section>

    </main>
  );
}

export default Chat;