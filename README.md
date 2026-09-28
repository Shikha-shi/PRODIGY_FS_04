# 💬 Chirp — Real-Time Chat Application

Chirp is a full-stack real-time chat application developed as part of the **Prodigy Infotech Full Stack Web Development Internship – Task 04**.

The application provides user authentication, public chat rooms, private conversations, real-time messaging, message history, online presence, notifications, and file/image sharing.

---

## 🚀 Features

### 🔐 Authentication
- User registration
- User login
- JWT-based authentication
- Secure password hashing
- Protected application routes
- Authenticated WebSocket connections

### 💬 Real-Time Messaging
- Real-time text messaging using WebSockets
- Public chat rooms
- Private one-to-one conversations
- Message persistence using PostgreSQL
- Automatic message updates
- Room-based message isolation

### 👥 User Connections
- Browse/search registered users
- Start private conversations
- View existing conversations
- Online/offline user presence

### 🕘 Chat History
- Persistent messages
- Load previous room messages
- Load previous private conversation messages
- Messages stored in PostgreSQL

### 🔔 Notifications
- Real-time notification support
- User-specific WebSocket connections
- New-message notifications

### 📎 File & Image Sharing
- Upload images/files
- Serve uploaded files through the backend
- Share uploaded content inside conversations

### 🏠 Chat Rooms
- View available public rooms
- Create new chat rooms
- Room descriptions
- Room creator information

---

## 🛠️ Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- CSS
- WebSocket API

### Backend
- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- WebSockets

### Database
- PostgreSQL

### Security
- JWT access tokens
- Argon2 password hashing
- Protected REST APIs
- Authenticated WebSocket connections

---

## 📁 Project Structure

```text
Chirp/
│
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── dependencies.py
│   │   │   └── security.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── room.py
│   │   │   ├── message.py
│   │   │   └── conversation.py
│   │   │
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── rooms.py
│   │   │   ├── users.py
│   │   │   ├── conversations.py
│   │   │   └── upload.py
│   │   │
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── room.py
│   │   │   ├── message.py
│   │   │   └── conversation.py
│   │   │
│   │   ├── websocket/
│   │   │   └── manager.py
│   │   │
│   │   ├── database.py
│   │   ├── settings.py
│   │   └── main.py
│   │
│   ├── create_database.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── ProtectedRoute.tsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Chat.tsx
│   │   │
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── types.ts
│   │
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend Setup

**1. Navigate to the backend folder:**

```bash
cd backend
```

**2. Create and activate the virtual environment:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

> On Windows, activate with `.venv\Scripts\activate`

**3. Install dependencies:**

```bash
pip install -r requirements.txt
```

**4. Create a `.env` file in the `backend/` folder:**

```env
DB_USERNAME=your_postgres_username
DB_PASSWORD=your_postgres_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chirp_db

JWT_SECRET_KEY=your_secret_key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

**5. Create the PostgreSQL database:**

```sql
CREATE DATABASE chirp_db;
```

**6. Run the backend:**

```bash
uvicorn app.main:app --reload
```

- Backend: http://localhost:8000
- Swagger API docs: http://localhost:8000/docs

---

## 💻 Frontend Setup

**1. Open another terminal and navigate to the frontend folder:**

```bash
cd frontend
```

**2. Install dependencies:**

```bash
npm install
```

**3. Start the development server:**

```bash
npm run dev
```

- Frontend: http://localhost:5173

---

## 🔌 WebSocket Architecture

Chirp uses WebSockets for real-time communication.

### Public Room

```text
Client
   │
   │ WebSocket
   ▼
FastAPI WebSocket
   │
   ▼
Connection Manager
   │
   ├── User 1
   ├── User 2
   └── User 3
```

A message sent in a room is broadcast to all connected users in that room.

### Private Conversation

```text
User A
   │
   │ WebSocket
   ▼
FastAPI
   │
   ▼
Conversation Manager
   │
   ▼
User B
```

JWT authentication is used when establishing the WebSocket connection.

---

## 🗄️ Database

PostgreSQL stores:

- Users
- Chat rooms
- Conversations
- Conversation members
- Messages
- Direct messages
- Timestamps
- Relationships between users and conversations

SQLAlchemy is used as the ORM layer.

---

## 🔒 Security

Chirp implements:

- Password hashing using Argon2
- JWT authentication
- Protected REST endpoints
- Authenticated WebSocket connections
- User-specific conversation access
- Database-backed authentication
- Input validation using Pydantic