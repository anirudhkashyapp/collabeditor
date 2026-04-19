# CollabEditor

A real-time collaborative code editor built with React, Spring Boot, and WebSockets. Multiple developers can write code together in the same room simultaneously — like Google Docs but for code.

## Features

- **Real-time collaboration** — Multiple users can edit code simultaneously with live sync
- **Room system** — Create or join private rooms with a password
- **Live user presence** — See who's in the room with colored avatars
- **AI assistant** — Built-in AI coding assistant powered by Groq that reads your current code and helps fix bugs
- **Team chat** — Real-time chat panel for collaborators in the same room
- **Code persistence** — Code auto-saves to PostgreSQL every 2 seconds
- **Language support** — JavaScript, Python, Java, TypeScript, HTML, CSS
- **Monaco editor** — The same editor that powers VS Code

## Tech Stack

**Frontend:** React, Vite, Monaco Editor, WebSocket, Groq SDK

**Backend:** Java 21, Spring Boot, Spring WebSocket, Spring Data JPA, PostgreSQL

## How It Works

**Real-time Sync** — When a user types, the change is sent over WebSocket to the Spring Boot server. The `CollabHandler` broadcasts it to all other users in the same room. Each room is fully isolated.

**Room System** — Rooms are stored in PostgreSQL with a password. When a user joins, the password is verified and the last saved code is returned.

**AI Assistant** — Uses Groq's API (Llama 3.3 70B). Every message includes the current code as context so the AI gives relevant, code-aware answers.

**Code Persistence** — A 2-second debounced save triggers after every keystroke. The code is sent to the backend and stored in PostgreSQL.

## Project Structure

```
collabeditor/
├── src/main/java/com/collabeditor/
│   ├── CollabeditorApplication.java
│   ├── WebSocketConfig.java
│   ├── CollabHandler.java
│   ├── SecurityConfig.java
│   ├── Room.java
│   ├── RoomRepository.java
│   └── RoomController.java
└── frontend/
    └── src/
        ├── App.jsx
        └── AIChat.jsx
```

## Getting Started

**Backend**

```bash
git clone https://github.com/anirudhkashyapp/collabeditor.git
cd collabeditor
.\mvnw.cmd spring-boot:run
```

Configure `src/main/resources/application.properties` with your PostgreSQL credentials.

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file in the frontend folder:

```
VITE_GROQ_API_KEY=your_groq_api_key
```

Open **http://localhost:5173** in your browser.

## Author

Built by Anirudh Kashyap as a portfolio project to learn full-stack development, real-time systems, and WebSocket architecture.