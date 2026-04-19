# CollabEditor

A real-time collaborative code editor built with React, Spring Boot, and WebSockets. Multiple developers can write code together in the same room simultaneously — like Google Docs but for code.

## Live Demo
> Coming soon (deployment in progress)

## Features

- **Real-time collaboration** — Multiple users can edit code simultaneously with live sync
- **Room system** — Create or join private rooms with a password
- **Live user presence** — See who's in the room with colored avatars
- **AI assistant** — Built-in AI coding assistant powered by Groq (Llama 3.3 70B) that reads your current code and helps fix bugs and answer questions
- **Team chat** — Real-time chat panel for collaborators in the same room
- **Code persistence** — Code auto-saves to PostgreSQL every 2 seconds so nothing is lost
- **Language support** — Syntax highlighting for JavaScript, Python, Java, TypeScript, HTML, CSS
- **Monaco editor** — The same editor that powers VS Code

## Tech Stack

**Frontend**
- React + Vite
- Monaco Editor (`@monaco-editor/react`)
- Yjs (CRDT for conflict-free sync)
- WebSocket (native browser API)
- Groq SDK (AI integration)

**Backend**
- Java 21
- Spring Boot 4
- Spring WebSocket
- Spring Data JPA + Hibernate
- PostgreSQL
- Spring Security

## Architecture
Browser (React) ←→ WebSocket ←→ Spring Boot Server ←→ PostgreSQL
↓
CollabHandler
(broadcasts edits,
chat, user presence
per room)

## Getting Started

### Prerequisites
- Java 21
- Node.js 22+
- PostgreSQL 17

### Backend Setup
```bash
# Clone the repo
git clone https://github.com/anirudhkashyapp/collabeditor.git
cd collabeditor

# Configure database
# Edit src/main/resources/application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/collabeditor
spring.datasource.username=postgres
spring.datasource.password=yourpassword

# Run the backend
.\mvnw.cmd spring-boot:run
```

### Frontend Setup
```bash
cd frontend

# Create environment file
echo VITE_GROQ_API_KEY=your_groq_api_key > .env

# Install dependencies
npm install

# Run the frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## How It Works

### Real-time Sync
When a user types in the editor, the change is sent as a JSON message over WebSocket to the Spring Boot server. The server's `CollabHandler` broadcasts the message to all other users in the same room. Each room is isolated — users in different rooms never see each other's changes.

### Room System
Rooms are stored in PostgreSQL with a hashed password. When a user creates a room, it's saved to the database. When they join, the password is verified and the last saved code is returned.

### AI Assistant
The AI assistant uses Groq's API to run Llama 3.3 70B. Every message includes the current code in the editor as context, so the AI can give relevant, code-aware answers.

### Code Persistence
Every time a user types, a 2-second debounced save is triggered. After 2 seconds of inactivity, the current code is sent to the `/api/rooms/save` endpoint and stored in PostgreSQL.

## Project Structure
collabeditor/
├── src/main/java/com/collabeditor/
│   ├── CollabeditorApplication.java   # Entry point
│   ├── WebSocketConfig.java           # WebSocket setup
│   ├── CollabHandler.java             # Real-time message handler
│   ├── SecurityConfig.java            # Security configuration
│   ├── Room.java                      # Room entity (JPA)
│   ├── RoomRepository.java            # Database queries
│   └── RoomController.java            # REST API endpoints
├── src/main/resources/
│   └── application.properties         # Database config
└── frontend/
├── src/
│   ├── App.jsx                    # Main React component
│   └── AIChat.jsx                 # AI assistant component
└── package.json

## Author
Built by Anirudh Kashyap as a portfolio project to learn backend development, real-time systems, and WebSocket architecture.
