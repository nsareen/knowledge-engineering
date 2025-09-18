import React, { useState } from 'react';
import { Send, MessageCircle, User, Bot } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: string;
  citations?: Array<{ filename: string; pageNumber: number }>;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // TODO: Send message to backend Q&A endpoint
    
    // Simulate bot response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'This is a placeholder response. The Q&A system is not yet implemented.',
        sender: 'bot',
        timestamp: new Date().toISOString(),
        citations: [],
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <MessageCircle className="w-6 h-6 text-primary-600 mr-3" />
          <div>
            <h1 className="text-xl font-bold text-gray-900">Knowledge Chat</h1>
            <p className="text-sm text-gray-600">Ask questions about your documents and knowledge graph</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start a Conversation</h3>
              <p className="text-gray-500 mb-4">Ask me anything about your uploaded documents</p>
              <div className="text-sm text-gray-400">
                <p>Example questions:</p>
                <ul className="mt-2 space-y-1">
                  <li>• "What are the main concepts in document X?"</li>
                  <li>• "How are entities A and B related?"</li>
                  <li>• "Summarize the key findings from the presentation"</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 mr-2" />
                    ) : (
                      <Bot className="w-4 h-4 mr-2" />
                    )}
                    <span className="text-xs opacity-75">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{message.text}</p>
                  
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300 border-opacity-30">
                      <p className="text-xs opacity-75 mb-1">Sources:</p>
                      {message.citations.map((citation, index) => (
                        <div key={index} className="text-xs opacity-75">
                          {citation.filename} (Page {citation.pageNumber})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <Bot className="w-4 h-4 mr-2" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <form onSubmit={handleSendMessage} className="flex space-x-4">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask a question about your knowledge graph..."
            className="flex-1 input"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;