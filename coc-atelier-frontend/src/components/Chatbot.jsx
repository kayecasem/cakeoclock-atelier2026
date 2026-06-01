import React, { useState, useRef, useEffect } from 'react';
import '../Chatbot.css';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Bonjour! Welcome to Cake o\' Clock Atelier. 🍰 How can I help you sweeten your day?',
      type: 'text'
    },
    {
      id: 2,
      sender: 'bot',
      text: 'Choose an option or type your question below:',
      type: 'options',
      options: ['View Menu', 'Track Order', 'Store Hours', 'Ask AI 🌟']
    }
  ]);

  const chatEndRef = useRef(null);

  // Automatically scroll to the bottom when a new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend) => {
    if (!textToSend.trim()) return;

    // 1. Append user message to the chat layout
    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: textToSend,
      type: 'text'
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // 2. Simulate or fetch backend response
    try {
      const response = await fetch('https://cakeoclock-backend-f3c59u4bh-kaye-casem-s-projects.vercel.app/api/chat', { // Or your relative Vercel path '/api/chat'
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, userId: 123 }) // userId helps pull MySQL records
      });
      
      const data = await response.json();
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: 'bot',
          text: data.text,
          type: 'text'
        }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
    }
  };

  return (
    <div className="chatbot-wrapper">
      {/* Floating Action Button (FAB) */}
      <button className="chat-fab" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat Window Container */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-avatar">🍰</div>
            <div>
              <h3>Pierre</h3>
              <p>Cake o' Clock Assistant</p>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message-row ${msg.sender}`}>
                {msg.sender === 'bot' && <div className="bot-mini-avatar">👩‍🍳</div>}
                
                <div className="message-content">
                  {msg.type === 'text' && <div className="message-bubble">{msg.text}</div>}
                  
                  {msg.type === 'options' && (
                    <div className="options-container">
                      <p className="options-prompt">{msg.text}</p>
                      <div className="options-grid">
                        {msg.options.map((option, index) => (
                          <button 
                            key={index} 
                            className="option-btn"
                            onClick={() => handleSendMessage(option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input Footer */}
          <form 
            className="chat-footer" 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
          >
            <input
              type="text"
              placeholder="Ask about flavors, pickup times..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" disabled={!input.trim()}>Send</button>
          </form>
        </div>
      )}
    </div>
  );
}