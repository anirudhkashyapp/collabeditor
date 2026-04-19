import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import AIChat from './AIChat';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const MY_ID = Math.random().toString(36).substr(2, 9);

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
      const res = await fetch('http://localhost:8080/api/rooms/create', {
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
      const res = await fetch('http://localhost:8080/api/rooms/join', {
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

  const inputStyle = {
    width: '100%', padding: '10px 14px', background: '#2d2d2d',
    border: '1px solid #444', borderRadius: '6px', color: '#fff',
    fontSize: '14px', boxSizing: 'border-box', marginBottom: '12px'
  };

  const btnStyle = (primary) => ({
    width: '100%', padding: '10px', borderRadius: '6px',
    border: 'none', fontSize: '14px', fontWeight: 600,
    cursor: 'pointer', background: primary ? '#4ECDC4' : '#3d3d3d',
    color: primary ? '#000' : '#fff', marginBottom: '8px'
  });

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#1e1e1e'
    }}>
      <div style={{
        background: '#2d2d2d', borderRadius: '12px', padding: '32px',
        width: '360px', border: '1px solid #3d3d3d'
      }}>
        <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: '22px' }}>CollabEditor</h2>
        <p style={{ color: '#888', margin: '0 0 24px', fontSize: '14px' }}>
          Real-time collaborative code editor
        </p>

        {mode === 'choose' && (
          <>
            <button style={btnStyle(true)} onClick={() => setMode('create')}>
              Create a room
            </button>
            <button style={btnStyle(false)} onClick={() => setMode('join')}>
              Join a room
            </button>
          </>
        )}

        {(mode === 'create' || mode === 'join') && (
          <>
            <input
              style={inputStyle} placeholder="Your name"
              value={name} onChange={e => setName(e.target.value)}
            />
            <input
              style={inputStyle} placeholder="Room ID"
              value={roomId} onChange={e => setRoomId(e.target.value)}
            />
            <input
              style={inputStyle} placeholder="Password" type="password"
              value={password} onChange={e => setPassword(e.target.value)}
            />
            {error && <p style={{ color: '#FF6B6B', fontSize: '13px', margin: '0 0 12px' }}>{error}</p>}
            <button
              style={btnStyle(true)}
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'create' ? 'Create room' : 'Join room'}
            </button>
            <button style={btnStyle(false)} onClick={() => { setMode('choose'); setError(''); }}>
              Back
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EditorPage({ roomId, name, initialContent }) {
  const editorRef = useRef(null);
  const wsRef = useRef(null);
  const saveTimeout = useRef(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState('javascript');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [chatMode, setChatMode] = useState('team');

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8080/collab/${roomId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', id: MY_ID, color: MY_COLOR, name }));
    };

    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'code') {
        const editor = editorRef.current;
        if (editor && data.content !== editor.getValue()) {
          const position = editor.getPosition();
          editor.setValue(data.content);
          editor.setPosition(position);
        }
      } else if (data.type === 'users') {
        setUsers(data.users);
      } else if (data.type === 'chat') {
        setMessages(prev => [...prev, { name: data.name, text: data.text, color: data.color }]);
      }
    };

    return () => ws.close();
  }, [roomId, name]);

  function handleEditorMount(editor) {
    editorRef.current = editor;
    if (initialContent) editor.setValue(initialContent);
  }

  function handleChange(value) {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'code', content: value, id: MY_ID }));
    }
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      fetch('http://localhost:8080/api/rooms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, content: value })
      });
    }, 2000);
  }

  function sendChat() {
    if (!chatInput.trim()) return;
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'chat', name, text: chatInput, color: MY_COLOR }));
    }
    setChatInput('');
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied!');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e1e' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: '48px', background: '#2d2d2d', borderBottom: '1px solid #3d3d3d'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '15px' }}>CollabEditor</span>
          <span style={{ color: '#555', fontSize: '13px' }}>#{roomId}</span>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: connected ? '#4ECDC4' : '#FF6B6B' }} />
          <span style={{ color: '#888', fontSize: '12px' }}>{connected ? 'connected' : 'disconnected'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {users.map(u => (
              <div key={u.id} title={u.name} style={{
                width: '28px', height: '28px', borderRadius: '50%', background: u.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', color: '#000', fontWeight: 600
              }}>
                {u.name ? u.name.substr(0, 2).toUpperCase() : '??'}
              </div>
            ))}
          </div>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{
            background: '#3d3d3d', color: '#fff', border: '1px solid #555',
            borderRadius: '4px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer'
          }}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
          <button onClick={() => setShowChat(!showChat)} style={{
            background: '#3d3d3d', color: '#fff', border: '1px solid #555',
            borderRadius: '4px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer'
          }}>
            {showChat ? 'Hide chat' : 'Show chat'}
          </button>
          <button onClick={copyLink} style={{
            background: '#4ECDC4', color: '#000', border: 'none',
            borderRadius: '4px', padding: '6px 12px', fontSize: '13px',
            cursor: 'pointer', fontWeight: 600
          }}>
            Copy link
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            width="100%"
            language={language}
            theme="vs-dark"
            defaultValue="// Start coding here..."
            onMount={handleEditorMount}
            onChange={handleChange}
          />
        </div>

        {showChat && (
          <div style={{
            width: '300px', display: 'flex', flexDirection: 'column',
            background: '#252525', borderLeft: '1px solid #3d3d3d'
          }}>
            <div style={{ borderBottom: '1px solid #3d3d3d', display: 'flex' }}>
              <button
                onClick={() => setChatMode('team')}
                style={{
                  flex: 1, padding: '10px', background: chatMode === 'team' ? '#3d3d3d' : 'transparent',
                  color: chatMode === 'team' ? '#fff' : '#888', border: 'none',
                  borderBottom: chatMode === 'team' ? '2px solid #4ECDC4' : '2px solid transparent',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600
                }}>
                Team chat
              </button>
              <button
                onClick={() => setChatMode('ai')}
                style={{
                  flex: 1, padding: '10px', background: chatMode === 'ai' ? '#3d3d3d' : 'transparent',
                  color: chatMode === 'ai' ? '#4ECDC4' : '#888', border: 'none',
                  borderBottom: chatMode === 'ai' ? '2px solid #4ECDC4' : '2px solid transparent',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600
                }}>
                AI assistant
              </button>
            </div>

            {chatMode === 'team' ? (
              <>
                <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {messages.length === 0 && (
                    <p style={{ color: '#555', fontSize: '13px' }}>No messages yet...</p>
                  )}
                  {messages.map((m, i) => (
                    <div key={i}>
                      <span style={{ color: m.color, fontSize: '12px', fontWeight: 600 }}>{m.name}</span>
                      <p style={{ color: '#ccc', fontSize: '13px', margin: '2px 0 0' }}>{m.text}</p>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px', borderTop: '1px solid #3d3d3d', display: 'flex', gap: '8px' }}>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                    placeholder="Type a message..."
                    style={{
                      flex: 1, padding: '8px 10px', background: '#2d2d2d',
                      border: '1px solid #444', borderRadius: '4px',
                      color: '#fff', fontSize: '13px'
                    }}
                  />
                  <button onClick={sendChat} style={{
                    background: '#4ECDC4', color: '#000', border: 'none',
                    borderRadius: '4px', padding: '8px 12px', fontSize: '13px',
                    cursor: 'pointer', fontWeight: 600
                  }}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <AIChat getCode={() => editorRef.current?.getValue() || ''} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [room, setRoom] = useState(null);

  function handleEnterRoom(roomId, password, name, content) {
    setRoom({ roomId, name, content });
  }

  if (!room) return <LandingPage onEnterRoom={handleEnterRoom} />;
  return <EditorPage roomId={room.roomId} name={room.name} initialContent={room.content} />;
}
