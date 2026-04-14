import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
const MY_COLOR = COLORS[Math.floor(Math.random() * COLORS.length)];
const MY_ID = Math.random().toString(36).substr(2, 9);

const ws = new WebSocket('ws://localhost:8080/collab');

function App() {
  const editorRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: 'join', id: MY_ID, color: MY_COLOR }));
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
      }
    };
  }, []);

  function handleEditorMount(editor) {
    editorRef.current = editor;
  }

  function handleChange(value) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'code', content: value, id: MY_ID }));
    }
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
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: connected ? '#4ECDC4' : '#FF6B6B'
          }} />
          <span style={{ color: '#888', fontSize: '12px' }}>{connected ? 'connected' : 'disconnected'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {users.map(u => (
              <div key={u.id} title={`User ${u.id}`} style={{
                width: '28px', height: '28px', borderRadius: '50%',
                background: u.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '11px', color: '#000', fontWeight: 600
              }}>
                {u.id.substr(0, 2).toUpperCase()}
              </div>
            ))}
          </div>

          <select
            value={language}
            onChange={e => setLanguage(e.target.value)}
            style={{
              background: '#3d3d3d', color: '#fff', border: '1px solid #555',
              borderRadius: '4px', padding: '4px 8px', fontSize: '13px', cursor: 'pointer'
            }}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="typescript">TypeScript</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>

          <button onClick={copyLink} style={{
            background: '#4ECDC4', color: '#000', border: 'none',
            borderRadius: '4px', padding: '6px 12px', fontSize: '13px',
            cursor: 'pointer', fontWeight: 600
          }}>
            Copy link
          </button>
        </div>
      </div>

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
    </div>
  );
}

export default App; 
