import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';

const ws = new WebSocket('ws://localhost:8080/collab');

function App() {
  const editorRef = useRef(null);

  useEffect(() => {
    ws.onmessage = (event) => {
      const incoming = event.data;
      const editor = editorRef.current;
      if (editor && incoming !== editor.getValue()) {
        const position = editor.getPosition();
        editor.setValue(incoming);
        editor.setPosition(position);
      }
    };
  }, []);

  function handleEditorMount(editor) {
    editorRef.current = editor;
  }

  function handleChange(value) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(value);
    }
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Editor
        height="100%"
        width="100%"
        language="javascript"
        theme="vs-dark"
        defaultValue="// Start coding here..."
        onMount={handleEditorMount}
        onChange={handleChange}
      />
    </div>
  );
}

export default App;
