'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Bot, User, Send } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function MedicalChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your pharmacy and medical assistant with access to real-time inventory data. I can help answer questions about medications, prescriptions, health conditions, symptoms, general wellness, and check our current stock levels. Ask me about medicine availability, expiry dates, or any health-related queries!',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]); // Added isOpen to scroll when opened

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      const text = data.response || 'I apologize, but I couldn\'t generate a response. Please try again.';

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'I apologize, but I\'m having trouble connecting right now. Please try again later or consult with a healthcare professional for immediate concerns.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {!isOpen ? (
        <motion.div
          key="chatbot-button"
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="bg-[#1a2332] hover:bg-[#232d3d] text-[#41cbe2] border border-[#41cbe2]/20 p-4 rounded-full shadow-lg shadow-black/20 flex items-center justify-center transition-all duration-300"
            aria-label="Open medical chatbot"
          >
            <MessageCircle size={24} />
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="chatbot-window"
          className="fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[380px] h-[600px] max-h-[80vh] bg-[#0c1015]/95 backdrop-blur-md border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
          initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: "bottom right" }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20, transition: { duration: 0.2 } }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between bg-[rgba(255,255,255,0.02)] text-white shrink-0">
            <div className="flex items-center space-x-3">
              <div className="bg-[#41cbe2]/10 p-2 rounded-lg">
                <Bot size={18} className="text-[#41cbe2]" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm text-[rgba(255,255,255,0.9)]">Pharmacy Assistant</span>
                <span className="text-[10px] text-[rgba(255,255,255,0.5)]">Always here to help</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/5 p-2 rounded-lg transition-colors text-gray-400 hover:text-white"
              aria-label="Close chatbot"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-[rgba(255,255,255,0.1)] scrollbar-track-transparent">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${message.isUser
                    ? 'bg-[#41cbe2]/10 text-[#41cbe2] border border-[#41cbe2]/20 rounded-tr-sm'
                    : 'bg-[#1a2027] text-gray-300 border border-[rgba(255,255,255,0.04)] rounded-tl-sm'
                    }`}
                >
                  <p>{message.text}</p>
                  <div className={`text-[10px] mt-1.5 opacity-60 ${message.isUser ? 'text-right' : 'text-left'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start"
              >
                <div className="bg-[#1a2027] border border-[rgba(255,255,255,0.04)] p-4 rounded-2xl rounded-tl-sm">
                  <div className="flex space-x-1">
                    <motion.div
                      className="w-1.5 h-1.5 bg-[#41cbe2]/60 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-[#41cbe2]/60 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }}
                    />
                    <motion.div
                      className="w-1.5 h-1.5 bg-[#41cbe2]/60 rounded-full"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.01)] shrink-0">
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about medications, stocks..."
                className="w-full bg-[#0a0d12]/50 text-gray-200 border border-[rgba(255,255,255,0.08)] rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-[#41cbe2]/40 focus:bg-[#0a0d12] transition-colors placeholder:text-gray-600"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="absolute right-2 p-1.5 bg-[#41cbe2]/10 hover:bg-[#41cbe2]/20 text-[#41cbe2] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>
            <div className="text-[10px] text-gray-600 text-center mt-3">
              Protected by health data privacy standards.
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}