## Live Repository

GitHub: https://github.com/<your-username>/signal-clone

# Signal Clone

A full-stack real-time messaging application inspired by Signal Messenger, built using Next.js, FastAPI, SQLite, SQLAlchemy, and WebSockets.

## Features

### Authentication

* User Registration
* Login with Mock OTP Verification
* Session Persistence using Local Storage
* Logout Functionality

### Messaging

* One-to-One Conversations
* Group Conversations
* Real-Time Messaging using WebSockets
* Typing Indicators
* Persistent Message Storage
* Message Delivery Status

### Contacts

* Start New Chat by Username
* User-Specific Conversation Lists
* Conversation Search

### Group Features

* Group Chat Support
* Group Information Panel
* Member List
* Admin Badge
* Group Management UI (Add Member, Rename Group, Leave Group)

### UI & UX

* Signal-Inspired Interface
* Conversation Sidebar
* Chat View
* Dark Mode
* Settings Page
* Responsive Layout

---

## Tech Stack

### Frontend

* Next.js
* TypeScript
* React
* Tailwind CSS

### Backend

* FastAPI
* SQLAlchemy
* WebSockets
* Pydantic

### Database

* SQLite

---

## Architecture

```text
Frontend (Next.js)
        │
        │ REST APIs
        ▼
Backend (FastAPI)
        │
        ▼
SQLite Database

Frontend
        │
        │ WebSocket
        ▼
Backend WebSocket Server
```

---

## Database Schema

### Users

| Field        | Type    |
| ------------ | ------- |
| id           | Integer |
| username     | String  |
| display_name | String  |
| phone        | String  |
| avatar_url   | String  |
| is_online    | Boolean |

### Conversations

| Field | Type           |
| ----- | -------------- |
| id    | Integer        |
| name  | String         |
| type  | direct / group |

### Conversation Members

| Field           | Type    |
| --------------- | ------- |
| id              | Integer |
| conversation_id | Integer |
| user_id         | Integer |
| role            | String  |
| unread_count    | Integer |

### Messages

| Field           | Type                    |
| --------------- | ----------------------- |
| id              | Integer                 |
| conversation_id | Integer                 |
| sender_id       | Integer                 |
| content         | Text                    |
| status          | sent / delivered / read |
| created_at      | DateTime                |

---

## API Endpoints

### Authentication

```http
POST /auth/register
POST /auth/login
POST /auth/verify-otp
```

### Conversations

```http
GET /conversations/?user_id={id}
POST /conversations/direct
```

### Messages

```http
GET /messages/{conversation_id}
POST /messages/
```

### WebSocket

```http
ws://localhost:8000/ws/{conversation_id}
```

---

## Setup Instructions

### Backend

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install fastapi uvicorn sqlalchemy pydantic python-multipart passlib bcrypt websockets

python seed.py

uvicorn main:app --reload
```

Backend:

```text
http://localhost:8000
```

Swagger Docs:

```text
http://localhost:8000/docs
```

---

### Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

## Demo Accounts

### Seeded Users

```text
Username: sankalp
OTP: 123456
```

```text
Username: alice
OTP: 123456
```

```text
Username: bob
OTP: 123456
```

### Register New Users

Users can register new accounts and start conversations using the "+" button.

---

## Implemented Assignment Features

### Completed

* Authentication
* Contact Discovery by Username
* Direct Messaging
* Group Messaging
* Real-Time Messaging
* Typing Indicators
* Conversation Search
* Dark Mode
* Settings Page
* Group Information Panel

### Partially Implemented

* Read Receipts
* Group Management Actions

### Future Improvements

* File Attachments
* Message Reactions
* Pinned Messages
* Voice Notes
* Presence Synchronization
* Push Notifications
* End-to-End Encryption Simulation
* Contact Discovery by Phone Number
* Block Contacts
* Remove Contacts

---

## Screenshots

Add screenshots of:

1. Login Page
2. Register Page
3. Conversation List
4. Direct Chat
5. Group Chat
6. Group Info Panel
7. Dark Mode
8. Settings Page

---

## Author

**Sankalp Kumar Sinha**

B.Tech, IIIT Bhagalpur

Built as part of the Secure Messaging Platform (Signal Clone) Full Stack Assignment.
