
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { BoltIcon, PaperAirplaneIcon, UserIcon, TrashIcon } from './components/Icons';
import { streamChatResponse } from './services/geminiService';
import { Message } from './types';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Create a placeholder for the assistant response
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessagePlaceholder: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, assistantMessagePlaceholder]);

    try {
      await streamChatResponse(newMessages, (chunk) => {
        setMessages(prev => {
          const updated = [...prev];
          const assistantIndex = updated.findIndex(m => m.id === assistantMessageId);
          if (assistantIndex !== -1) {
            updated[assistantIndex] = {
              ...updated[assistantIndex],
              content: updated[assistantIndex].content + chunk
            };
          }
          return updated;
        });
      });
    } catch (err) {
      setError("Failed to generate response. Please check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto px-4 sm:px-6">
      {/* Header */}
      <header className="flex items-center justify-between py-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <BoltIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">FlashChat</h1>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gemini 2.5 Flash Lite</p>
          </div>
        </div>
        
        <button 
          onClick={clearChat}
          className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-400"
          title="Clear chat"
        >
          <TrashIcon className="w-5 h-5" />
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto py-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
            <div className="p-4 bg-slate-800/50 rounded-full">
              <BoltIcon className="w-12 h-12 text-slate-400" />
            </div>
            <div>
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation with ultra-fast AI.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[85%] sm:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  msg.role === 'user' ? 'bg-indigo-600' : 'bg-slate-800'
                }`}>
                  {msg.role === 'user' ? <UserIcon className="w-5 h-5 text-white" /> : <BoltIcon className="w-5 h-5 text-indigo-400" />}
                </div>
                
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700/50'
                  }`}>
                    {msg.content || (msg.role === 'assistant' && !error ? (
                      <div className="flex gap-1 py-1">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      </div>
                    ) : null)}
                    {msg.role === 'assistant' && error && msg.content === '' && (
                      <p className="text-red-300 italic">{error}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 font-medium">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="py-6 shrink-0">
        <form 
          onSubmit={handleSendMessage}
          className="relative group"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything..."
            disabled={isLoading}
            className="w-full bg-slate-800/80 border border-slate-700 text-white pl-4 pr-14 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-slate-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-500 mt-3 font-medium">
          Powered by Google Gemini 2.5 Flash Lite • Instant Latency
        </p>
      </footer>
    </div>
  );
};

export default App;
