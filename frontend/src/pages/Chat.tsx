import { useEffect, useRef, useState } from "react";


/* Chat Page */

interface Message {
  id: number;
  text: string;
  isOwn: boolean;
}


function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [connected, setConnected] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);

  const messageId = useRef(0);


  /* WebSocket Connection */

  useEffect(() => {
    const socket = new WebSocket(
      "ws://localhost:8000/ws/1"
    );

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const newMessage: Message = {
        id: messageId.current++,
        text: event.data,
        isOwn: false,
      };

      setMessages((current) => [
        ...current,
        newMessage,
      ]);
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, []);


  /* Send Message */

  const sendMessage = () => {
    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    if (
      socketRef.current?.readyState !==
      WebSocket.OPEN
    ) {
      return;
    }

    socketRef.current.send(trimmedMessage);

    setMessage("");
  };


  return (
    <main className="chat-page">

      <header className="chat-header">
        <div>
          <h1>Chirp</h1>
          <span>Room 1</span>
        </div>

        <span
          className={
            connected
              ? "connection online"
              : "connection offline"
          }
        >
          {connected
            ? "Connected"
            : "Disconnected"}
        </span>
      </header>


      <section className="messages">
        {messages.map((item) => (
          <div
            key={item.id}
            className={
              item.isOwn
                ? "message own"
                : "message"
            }
          >
            {item.text}
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
          placeholder="Type a message..."
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

    </main>
  );
}

export default Chat;