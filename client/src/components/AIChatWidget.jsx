import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FaRobot, FaTimes, FaPaperPlane, FaLeaf, FaSpinner, FaRedo, FaComments
} from 'react-icons/fa';
import api from '../api/axios';
import './AIChatWidget.css';

const QUICK_SUGGESTIONS = [
  'What products are available?',
  'How do I place an order?',
  'What are market timings?',
  'How does pickup work?',
];

const AIChatWidget = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem('marketlink_ai_chat');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Persist chat to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('marketlink_ai_chat', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Initial greeting when opening for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          text: "👋 Hi! I'm the MarketLink assistant. Ask me about products, markets, or how ordering works!",
          time: new Date().toISOString(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  // ============ SEND MESSAGE ============
  const sendMessage = async (text) => {
    const userMsg = text.trim();
    if (!userMsg || isLoading) return;

    const newUserMessage = {
      role: 'user',
      text: userMsg,
      time: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass page context so the AI knows where the user is
      const context = `Current page: ${location.pathname}`;

      const res = await api.post('/ai/chat', {
        message: userMsg,
        context,
      });

      const reply =
        res.data?.data?.reply ||
        "I'm not sure how to help with that. Try asking about products or markets.";

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: reply,
          time: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('AI chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "😕 I couldn't reach the assistant right now. Please try again in a moment.",
          time: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestion = (text) => {
    sendMessage(text);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: "Chat cleared! What would you like to know?",
        time: new Date().toISOString(),
      },
    ]);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* ============ FLOATING BUTTON ============ */}
      <button
        className={`ai-widget-fab ${isOpen ? 'ai-widget-fab-hidden' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <FaComments className="ai-fab-icon" />
        <span className="ai-fab-pulse" />
        <span className="ai-fab-label">Ask AI</span>
      </button>

      {/* ============ CHAT PANEL ============ */}
      <div className={`ai-widget-panel ${isOpen ? 'ai-widget-panel-open' : ''}`}>
        {/* Header */}
        <div className="ai-widget-header">
          <div className="ai-widget-header-left">
            <div className="ai-widget-avatar">
              <FaRobot />
            </div>
            <div>
              <h4 className="ai-widget-title">MarketLink Assistant</h4>
              <span className="ai-widget-status">
                <span className="ai-status-dot" /> Online
              </span>
            </div>
          </div>
          <div className="ai-widget-header-actions">
            {messages.length > 1 && (
              <button
                className="ai-widget-icon-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                <FaRedo />
              </button>
            )}
            <button
              className="ai-widget-icon-btn"
              onClick={() => setIsOpen(false)}
              title="Close"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="ai-widget-messages">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={
                msg.role === 'user' ? 'ai-msg ai-msg-user' : 'ai-msg ai-msg-assistant'
              }
            >
              {msg.role === 'assistant' && (
                <div className="ai-msg-avatar">
                  <FaRobot />
                </div>
              )}
              <div className="ai-msg-content">
                <div
                  className={
                    msg.isError
                      ? 'ai-msg-bubble ai-msg-bubble-error'
                      : 'ai-msg-bubble'
                  }
                >
                  {msg.text}
                </div>
                <span className="ai-msg-time">{formatTime(msg.time)}</span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="ai-msg ai-msg-assistant">
              <div className="ai-msg-avatar">
                <FaRobot />
              </div>
              <div className="ai-msg-content">
                <div className="ai-msg-bubble ai-msg-typing">
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                  <span className="ai-typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions (only when few messages) */}
        {messages.length <= 1 && !isLoading && (
          <div className="ai-widget-suggestions">
            {QUICK_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="ai-suggestion-chip"
                onClick={() => handleSuggestion(s)}
              >
                <FaLeaf /> {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <form className="ai-widget-input-form" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            maxLength={500}
          />
          <button
            type="submit"
            className="ai-widget-send-btn"
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? <FaSpinner className="ai-spin" /> : <FaPaperPlane />}
          </button>
        </form>
      </div>
    </>
  );
};

export default AIChatWidget;