import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  ChangeEvent,
  SubmitEvent,
} from "react";

import { useAuth } from "../context/AuthContext";

import type {
  Conversation,
  Message,
  Room,
  User,
} from "../types";


const API = "http://localhost:8000";


export default function Chat() {
  const {
    user,
    token,
    logout,
  } = useAuth();

  const [users, setUsers] =
    useState<User[]>([]);

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [rooms, setRooms] =
    useState<Room[]>([]);

  const [messages, setMessages] =
    useState<Message[]>([]);

  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState<number | null>(null);

  const [
    selectedRoom,
    setSelectedRoom,
  ] = useState<number | null>(null);

  const [mode, setMode] =
    useState<"private" | "room">(
      "private"
    );

  const [message, setMessage] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [roomName, setRoomName] =
    useState("");

  const [roomDescription, setRoomDescription] =
    useState("");

  const [showRoomForm, setShowRoomForm] =
    useState(false);

  const [connected, setConnected] =
    useState(false);

  const [notification, setNotification] =
    useState("");

  const [uploading, setUploading] =
    useState(false);

  const socketRef =
    useRef<WebSocket | null>(null);

  const notificationSocketRef =
    useRef<WebSocket | null>(null);


  /* Load Users */

  const loadUsers = async () => {
    if (!token) {
      return;
    }

    const response = await fetch(
      `${API}/users?search=${encodeURIComponent(search)}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      setUsers(
        await response.json()
      );
    }
  };


  /* Load Conversations */

  const loadConversations = async () => {
    if (!token) {
      return;
    }

    const response = await fetch(
      `${API}/conversations`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      setConversations(
        await response.json()
      );
    }
  };


  /* Load Rooms */

  const loadRooms = async () => {
    if (!token) {
      return;
    }

    const response = await fetch(
      `${API}/rooms`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      setRooms(
        await response.json()
      );
    }
  };


  useEffect(() => {
    loadUsers();
    loadConversations();
    loadRooms();
  }, [token]);


  /* Notification WebSocket */

  useEffect(() => {
    if (!token) {
      return;
    }

    const socket = new WebSocket(
      `${API.replace(
        "http",
        "ws"
      )}/ws/notifications?token=${token}`
    );

    notificationSocketRef.current =
      socket;

    socket.onmessage = (event) => {
      const data =
        JSON.parse(event.data);

      if (
        data.type ===
        "notification"
      ) {
        setNotification(
          `${data.username}: ${data.content}`
        );

        setTimeout(
          () => setNotification(""),
          3500
        );

        loadConversations();
      }
    };

    return () => {
      socket.close();
    };
  }, [token]);


  /* Active Chat WebSocket */

  useEffect(() => {
    if (
      !token ||
      (
        mode === "private" &&
        !selectedConversation
      ) ||
      (
        mode === "room" &&
        !selectedRoom
      )
    ) {
      return;
    }

    setMessages([]);
    setConnected(false);

    socketRef.current?.close();

    const target =
      mode === "private"
        ? `conversations/${selectedConversation}`
        : `rooms/${selectedRoom}`;

    const socket = new WebSocket(
      `${API.replace(
        "http",
        "ws"
      )}/ws/${target}?token=${token}`
    );

    socketRef.current =
      socket;

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (
      event
    ) => {
      const data =
        JSON.parse(event.data);

      if (
        data.type ===
        "message"
      ) {
        setMessages(
          current => [
            ...current,
            data,
          ]
        );

        if (
          mode === "private"
        ) {
          loadConversations();
        }
      }
    };

    socket.onclose = () => {
      setConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [
    mode,
    selectedConversation,
    selectedRoom,
    token,
  ]);


  /* Load Message History */

  useEffect(() => {
    if (!token) {
      return;
    }

    if (
      mode === "private" &&
      selectedConversation
    ) {
      fetch(
        `${API}/conversations/${selectedConversation}/messages`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      ).then(
        async response => {
          if (response.ok) {
            setMessages(
              await response.json()
            );
          }
        }
      );
    }

    if (
      mode === "room" &&
      selectedRoom
    ) {
      fetch(
        `${API}/rooms/${selectedRoom}/messages`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      ).then(
        async response => {
          if (response.ok) {
            setMessages(
              await response.json()
            );
          }
        }
      );
    }
  }, [
    mode,
    selectedConversation,
    selectedRoom,
    token,
  ]);


  /* Start Private Conversation */

  const startConversation = async (
    userId: number
  ) => {
    if (!token) {
      return;
    }

    const response = await fetch(
      `${API}/conversations`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      }
    );

    if (!response.ok) {
      return;
    }

    const conversation =
      await response.json();

    await loadConversations();

    setMode("private");
    setSelectedRoom(null);
    setSelectedConversation(
      conversation.id
    );
  };


  /* Create Room */

  const createRoom = async (
    event: SubmitEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !token ||
      !roomName.trim()
    ) {
      return;
    }

    const response = await fetch(
      `${API}/rooms`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          name: roomName.trim(),
          description:
            roomDescription.trim()
              || null,
        }),
      }
    );

    if (!response.ok) {
      return;
    }

    const room =
      await response.json();

    setRooms(
      current => [
        room,
        ...current,
      ]
    );

    setMode("room");
    setSelectedRoom(
      room.id
    );

    setSelectedConversation(
      null
    );

    setRoomName("");
    setRoomDescription("");
    setShowRoomForm(false);
  };


  /* Send Message */

  const sendMessage = () => {
    const content =
      message.trim();

    if (
      !content ||
      socketRef.current?.readyState
        !== WebSocket.OPEN
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


  /* Upload File */

  const uploadFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      !token ||
      mode !== "private" ||
      !selectedConversation
    ) {
      return;
    }

    setUploading(true);

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    const response =
      await fetch(
        `${API}/upload`,
        {
          method: "POST",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
          body: formData,
        }
      );

    if (
      response.ok &&
      socketRef.current?.readyState
        === WebSocket.OPEN
    ) {
      const data =
        await response.json();

      const type =
        file.type.startsWith(
          "image/"
        )
          ? "image"
          : "file";

      socketRef.current.send(
        JSON.stringify({
          content: file.name,
          message_type: type,
          attachment_url:
            data.url,
        })
      );
    }

    setUploading(false);

    event.target.value = "";
  };


  const activeTitle =
    mode === "private"
      ? conversations.find(
          conversation =>
            conversation.id ===
            selectedConversation
        )?.other_user.username
        || "Choose a conversation"
      : rooms.find(
          room =>
            room.id === selectedRoom
        )?.name
        || "Choose a room";


  return (
    <main className="chat-page">

      {notification && (
        <div className="toast">
          🔔 {notification}
        </div>
      )}


      <aside className="sidebar">

        <div className="sidebar-top">

          <div>
            <div className="brand">
              CHIRP
            </div>

            <span className="muted">
              Real-time connections
            </span>
          </div>

          <button
            className="icon-button"
            onClick={logout}
          >
            ↪
          </button>

        </div>


        <div className="profile-card">

          <div className="avatar">
            {user?.username
              .slice(0, 1)
              .toUpperCase()}
          </div>

          <div>
            <strong>
              {user?.username}
            </strong>

            <span>
              Online
            </span>
          </div>

        </div>


        <div className="section-tabs">

          <button
            className={
              mode === "private"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setMode("private")
            }
          >
            Chats
          </button>

          <button
            className={
              mode === "room"
                ? "tab active"
                : "tab"
            }
            onClick={() =>
              setMode("room")
            }
          >
            Rooms
          </button>

        </div>


        {mode === "private" ? (
          <>

            <div className="search-row">

              <input
                value={search}
                onChange={event =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Find people..."
                onKeyUp={loadUsers}
              />

            </div>


            <div className="list-title">
              Conversations
            </div>


            <div className="sidebar-list">

              {conversations.map(
                conversation => (
                  <button
                    key={
                      conversation.id
                    }
                    className={
                      selectedConversation
                        === conversation.id
                        ? "list-item selected"
                        : "list-item"
                    }
                    onClick={() => {
                      setSelectedConversation(
                        conversation.id
                      );

                      setSelectedRoom(
                        null
                      );
                    }}
                  >

                    <div className="avatar small">
                      {conversation
                        .other_user
                        .username
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="list-content">

                      <strong>
                        {
                          conversation
                            .other_user
                            .username
                        }
                      </strong>

                      <span>
                        {
                          conversation
                            .last_message
                          || "Start a conversation"
                        }
                      </span>

                    </div>

                    <i
                      className={
                        conversation
                          .other_user
                          .online
                          ? "online-dot"
                          : "offline-dot"
                      }
                    />

                  </button>
                )
              )}

            </div>


            <div className="list-title">
              People
            </div>


            <div className="sidebar-list">

              {users.map(
                person => (
                  <button
                    key={person.id}
                    className="list-item"
                    onClick={() =>
                      startConversation(
                        person.id
                      )
                    }
                  >

                    <div className="avatar small">
                      {person.username
                        .slice(0, 1)
                        .toUpperCase()}
                    </div>

                    <div className="list-content">

                      <strong>
                        {person.username}
                      </strong>

                      <span>
                        {person.online
                          ? "Online"
                          : "Offline"}
                      </span>

                    </div>

                    <i
                      className={
                        person.online
                          ? "online-dot"
                          : "offline-dot"
                      }
                    />

                  </button>
                )
              )}

            </div>

          </>
        ) : (
          <>

            <button
              className="create-button"
              onClick={() =>
                setShowRoomForm(
                  current => !current
                )
              }
            >
              + Create room
            </button>


            {showRoomForm && (
              <form
                className="room-form"
                onSubmit={createRoom}
              >

                <input
                  value={roomName}
                  onChange={event =>
                    setRoomName(
                      event.target.value
                    )
                  }
                  placeholder="Room name"
                  required
                />

                <input
                  value={roomDescription}
                  onChange={event =>
                    setRoomDescription(
                      event.target.value
                    )
                  }
                  placeholder="Description"
                />

                <button type="submit">
                  Create
                </button>

              </form>
            )}


            <div className="sidebar-list">

              {rooms.map(
                room => (
                  <button
                    key={room.id}
                    className={
                      selectedRoom ===
                      room.id
                        ? "list-item selected"
                        : "list-item"
                    }
                    onClick={() => {
                      setSelectedRoom(
                        room.id
                      );

                      setSelectedConversation(
                        null
                      );
                    }}
                  >

                    <div className="room-icon">
                      #
                    </div>

                    <div className="list-content">

                      <strong>
                        {room.name}
                      </strong>

                      <span>
                        {
                          room.description
                          || "Public room"
                        }
                      </span>

                    </div>

                  </button>
                )
              )}

            </div>

          </>
        )}

      </aside>


      <section className="chat-panel">

        <header className="chat-header">

          <div>

            <h2>
              {activeTitle}
            </h2>

            <span>
              {connected
                ? "● Connected"
                : "○ Select a chat"}
            </span>

          </div>

        </header>


        <section className="messages">

          {!messages.length && (
            <div className="empty-state">

              <div className="empty-icon">
                ✦
              </div>

              <h3>
                {
                  activeTitle ===
                    "Choose a conversation"
                    ||
                  activeTitle ===
                    "Choose a room"
                    ? "Start connecting"
                    : "No messages yet"
                }
              </h3>

              <p>
                Select a person and
                send your first message.
              </p>

            </div>
          )}


          {messages.map(
            item => (
              <div
                key={item.id}
                className={
                  item.sender_id ===
                  user?.id
                    ? "message own"
                    : "message"
                }
              >

                <div className="message-meta">

                  <strong>
                    {item.sender_id ===
                    user?.id
                      ? "You"
                      : item.username}
                  </strong>

                  <span>
                    {new Date(
                      item.created_at
                    ).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </span>

                </div>


                {item.message_type ===
                  "image" &&
                item.attachment_url ? (

                  <img
                    className="attachment-image"
                    src={`${API}${item.attachment_url}`}
                    alt={item.content}
                  />

                ) : item.message_type ===
                    "file" &&
                  item.attachment_url ? (

                  <a
                    className="attachment-file"
                    href={`${API}${item.attachment_url}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📎 {item.content}
                  </a>

                ) : (

                  <p>
                    {item.content}
                  </p>

                )}

              </div>
            )
          )}

        </section>


        <form
          className="composer"
          onSubmit={event => {
            event.preventDefault();
            sendMessage();
          }}
        >

          <label
            className="attach-button"
            title={
              mode === "private"
                ? "Attach file"
                : "File sharing is available in private chats"
            }
          >

            📎

            <input
              type="file"
              hidden
              disabled={
                mode !== "private" ||
                uploading ||
                !connected
              }
              onChange={uploadFile}
            />

          </label>


          <input
            value={message}
            onChange={event =>
              setMessage(
                event.target.value
              )
            }
            disabled={!connected}
            placeholder={
              connected
                ? "Write a message..."
                : "Choose a conversation to start chatting"
            }
          />


          <button
            className="send-button"
            type="submit"
            disabled={
              !connected ||
              !message.trim()
            }
          >
            ➤
          </button>

        </form>

      </section>

    </main>
  );
}