'use client';

import { useState } from 'react';

// Define the structure for chart data
interface ChartData {
  day: string;
  [key: string]: string | number;
}

// Define the shape of the props the component expects.
// It needs the dataset ID to fetch complete dataset for analysis.
interface AIInsightBoxProps {
  dataSetId: number | null;
}

// Define the structure for a single message in the chat history.
interface Message {
  sender: 'user' | 'ai';
  text: string;
}

/**
 * A client component that provides a chat interface for AI-powered data analysis.
 * It manages the conversation state and communicates with our backend API.
 */
export default function AIInsightBox({ dataSetId }: AIInsightBoxProps) {
  // State for the user's current input text.
  const [input, setInput] = useState('');
  // State for the list of messages in the conversation.
  const [messages, setMessages] = useState<Message[]>([]);
  // State to track if the API request is in progress.
  const [isLoading, setIsLoading] = useState(false);

  // Check if form can be submitted
  const canSubmit = input.trim().length > 0 && !isLoading;

  // Handles the form submission when the user sends a message.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user's message to the chat history.
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);

    // Set loading state and clear the input field.
    setIsLoading(true);
    setInput('');

    try {
      // Make a POST request to our backend analysis endpoint.
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSetId: dataSetId,
          userQuestion: input,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI analysis request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Add the AI's response message to the chat history.
      const aiMessage: Message = { sender: 'ai', text: data.answer };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error(error);
      // Add an error message to the chat if the API call fails.
      const errorMessage: Message = { sender: 'ai', text: 'Sorry, I encountered an issue while analyzing. Please try again.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      // Reset the loading state regardless of outcome.
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden hover:shadow-2xl transition-all duration-300">
      <div className="p-6">
        {/* Message display area */}
        <div className="h-80 overflow-y-auto border border-gray-200 rounded-xl bg-gradient-to-b from-gray-50 to-white p-4 mb-6 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
          {messages.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mx-auto flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 text-base">Start a conversation with AI to explore your data insights...</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 shadow-md ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md'
              }`}>
                <p className="whitespace-pre-wrap text-base leading-relaxed">{msg.text}</p>
                <div className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                  {msg.sender === 'ai' ? 'AI' : ''}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-md max-w-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-600 text-base">AI is analyzing...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Which product has the highest sales? Analyze sales trends..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-base"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
          </div>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 disabled:hover:scale-100 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Analyzing</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span>Send</span>
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
