import { useState, useRef, useEffect } from 'react';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: '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',
  dangerouslyAllowBrowser: true
});

export default function AIChat({ getCode }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I can help you with your code. Ask me anything or paste an error!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage() {
    if (!input.trim() || loading) return;

    const currentCode = getCode();
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const systemPrompt = `You are an expert coding assistant built into a collaborative code editor. 
      The user is currently working on this code:
      \`\`\`
      ${currentCode}
      \`\`\`
      Help them with errors, explain concepts, suggest improvements, and answer questions about their code.
      Keep responses concise and practical.`;

      const response = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: userMessage }
        ],
        max_tokens: 1024
      });

      const reply = response.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '90%', padding: '8px 12px', borderRadius: '8px',
              background: m.role === 'user' ? '#4ECDC4' : '#3d3d3d',
              color: m.role === 'user' ? '#000' : '#fff',
              fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
              padding: '8px 12px', borderRadius: '8px',
              background: '#3d3d3d', color: '#888', fontSize: '13px'
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px', borderTop: '1px solid #3d3d3d', display: 'flex', gap: '8px' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="Ask about your code..."
          style={{
            flex: 1, padding: '8px 10px', background: '#2d2d2d',
            border: '1px solid #444', borderRadius: '4px',
            color: '#fff', fontSize: '13px'
          }}
        />
        <button onClick={sendMessage} disabled={loading} style={{
          background: loading ? '#555' : '#4ECDC4', color: loading ? '#888' : '#000',
          border: 'none', borderRadius: '4px', padding: '8px 12px',
          fontSize: '13px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600
        }}>
          Send
        </button>
      </div>
    </div>
  );
}