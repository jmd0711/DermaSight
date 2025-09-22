'use client';

import { useState } from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { ChatMessage } from '@/types';

const Chatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      messageType: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const { chatApi } = await import('@/lib/api');
      const response = await chatApi.sendMessage(inputMessage);

      if (response.success && response.data) {
        console.log(response)
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: response.data.response.answer,
          sender: 'bot',
          timestamp: new Date(),
          messageType: 'text',
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          content: 'Sorry, I encountered an error. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
          messageType: 'text',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat API error:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I am currently unavailable. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
        messageType: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Container fluid className="main-container py-5">
      <div className="max-w-4xl mx-auto px-4 fade-in">
        <div className="text-center mb-5">
          <h1 className="display-5 fw-bold text-primary-custom mb-3">
            DermaSight AI Assistant
          </h1>
          <p className="lead text-muted">
            Get expert dermatology guidance powered by AI
          </p>
        </div>

        <div className="card shadow-lg border-0" style={{ height: '600px' }}>
          <div className="card-header bg-primary-custom text-white py-3">
            <h5 className="mb-0 fw-semibold">💬 AI Dermatology Assistant</h5>
            <small className="opacity-75">Ask me about skin conditions and symptoms</small>
          </div>

          <div className="card-body d-flex flex-column overflow-hidden p-0">
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>Start a conversation with our AI assistant!</p>
                <p className="text-sm">Ask about skin conditions, symptoms, or general dermatology questions.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="mb-0">{message.content}</p>
                      <small className="opacity-75">
                        {message.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 text-gray-800 p-3 rounded-lg">
                      <p className="mb-0">AI is typing...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
          </div>

          <div className="card-footer p-4">
            <div className="flex gap-2">
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Type your message here..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isTyping}
              />
              <Button
                variant="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className="px-4"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Chatbot;