import { useEffect, useRef, useState } from 'react';
import Editor, { loader } from '@monaco-editor/react';
import AIChat from './AIChat';

loader.config({
  paths: {
    vs: 'https://unpkg.com/monaco-editor@0.45.0/min/vs'
  }
});

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const MY_ID = Math.random().toString(36).substr(2, 9);

const BACKEND_URL = 'https://collabeditor-production-e9f4.up.railway.app';
const WS_URL = 'wss://collabeditor-production-e9f4.up.railway.app';

function LandingPage({ onEnterRoom }) {
  const [mode, setMode] = useState('choose');
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!roomId || !password || !name) return setError('All fields are required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      onEnterRoom(roomId, password, name);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!roomId || !password || !name) return setError('All fields are required');
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/api/rooms/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      onEnterRoom(roomId, password, name, data.content);
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#1e1e1e'
    }}>
      <div style={{
        background: '#2d2d2d', borderRadius: '12px', padding: '32px',
        width: '360px', border: '1px solid #3d3d3d'
      }}>
        <h2 style={{ color: '#fff' }}>CollabEditor</h2>

        {mode === 'choose' && (
          <>
            <button onClick={() => setMode('create')}>Create Room</button>
            <button onClick={() => setMode('join')}>Join Room</button>
          </>
        )}

        {(mode === 'create' || mode === 'join') && (
          <>
            <input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
            <input placeholder="Room ID" value={roomId} onChange={e => setRoomId(e.target.value)} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <button onClick={mode === 'create' ? handleCreate : handleJoin}>
              {mode === 'create' ? 'Create' : 'Join'}
            </button>

            <button onClick={() => setMode('choose')}>Back</button>
          </>
        )}
      </div>
    </div>
  );
}

function EditorPage({ roomId, name, initialContent }) {
  const editorRef = useRef(null);
  const wsRef = useRef(null);
  const isRemoteUpdate = useRef(false);

  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    const ws = new WebSocket(`${WS_URL}/collab/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', id: MY_ID, color: MY_COLOR, name }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'code') {
        const editor = editorRef.current;
        if (editor && data.content !== editor.getValue()) {
          isRemoteUpdate.current = true;
          editor.setValue(data.content);
          isRemoteUpdate.current = false;
        }
      }
    };

    return () => ws.close();
  }, [roomId, name]);

  function handleEditorMount(editor) {
    editorRef.current = editor;
    if (initialContent) editor.setValue(initialContent);
  }

  function handleChange(value) {
    if (isRemoteUpdate.current) return;

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'code', content: value, id: MY_ID }));
    }
  }

  return (
    <div style={{ height: '100vh' }}>
      <Editor
        height="100%"
        language={language}
        theme="vs-dark"
        defaultValue="// Start coding..."
        onMount={handleEditorMount}
        onChange={handleChange}
        loading={<div style={{ color: 'white', padding: '20px' }}>Loading editor...</div>}
      />
    </div>
  );
}

export default function App() {
  const [room, setRoom] = useState(null);

  if (!room) return <LandingPage onEnterRoom={(roomId, _, name, content) =>
    setRoom({ roomId, name, content })
  } />;

  return <EditorPage {...room} />;
}