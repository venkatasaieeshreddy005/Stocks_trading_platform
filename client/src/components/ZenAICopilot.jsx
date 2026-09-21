import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  Bot, 
  ShieldAlert, 
  TrendingUp, 
  Award, 
  Zap,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function ZenAICopilot({ currentSymbol = null }) {
  const { token, user } = useAuth();
  const { sentiment } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `👋 Hello ${user?.name ? user.name.split(' ')[0] : 'Trader'}! I am **ZenAI**, your algorithmic trading coach & risk analyzer. How can I help with your trading strategy today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('ZenAI Engine');

  const quickPrompts = [
    `Analyze market breadth today`,
    currentSymbol ? `Breakdown technicals for ${currentSymbol}` : `Analyze INFY setup`,
    `How can I improve my Discipline Level?`,
    `What are best risk management rules?`
  ];

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMsg = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          message: query,
          symbol: currentSymbol
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: data.reply }
        ]);
        if (data.provider) setProvider(data.provider);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '⚠️ ' + (data.message || 'Unable to connect to AI engine.') }
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Network connection issue with AI service.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Button at Bottom Right */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 20px',
          borderRadius: '9999px',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: '13px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4), 0 0 15px rgba(16, 185, 129, 0.4)',
          border: '1px solid #334155',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0) scale(1)')}
      >
        <Sparkles size={16} color="#10b981" />
        <span>ZenAI Copilot</span>
      </button>

      {/* Slide-in AI Assistant Drawer */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '380px',
          maxWidth: 'calc(100vw - 32px)',
          height: '540px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #cbd5e1',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '-0.2px' }}>
                  ZenAI Copilot
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                  {provider}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ color: '#94a3b8', padding: '4px', borderRadius: '6px' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Feed */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            backgroundColor: '#f8fafc'
          }}>
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    backgroundColor: isUser ? '#0f172a' : '#ffffff',
                    color: isUser ? '#ffffff' : '#1e293b',
                    fontSize: '12.5px',
                    lineHeight: 1.5,
                    border: isUser ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {m.content}
                </div>
              );
            })}

            {loading && (
              <div style={{
                alignSelf: 'flex-start',
                padding: '8px 14px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={14} color="#10b981" /> ZenAI is analyzing...
              </div>
            )}
          </div>

          {/* Quick Prompt Pills */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  backgroundColor: '#f1f5f9',
                  fontSize: '11px',
                  color: '#475569',
                  fontWeight: 600,
                  flexShrink: 0
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '12px',
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              display: 'flex',
              gap: '8px'
            }}
          >
            <input
              type="text"
              placeholder="Ask ZenAI about stocks, setups, risk..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12.5px',
                color: '#0f172a'
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                opacity: (!input.trim() || loading) ? 0.5 : 1
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

