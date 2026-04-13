import Editor from '@monaco-editor/react';

function App() {
  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <Editor
        height="100%"
        width="100%"
        language="javascript"
        theme="vs-dark"
        defaultValue="// Start coding here..."
      />
    </div>
  );
}

export default App;