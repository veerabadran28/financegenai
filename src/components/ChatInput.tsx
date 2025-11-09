import React, { useState } from 'react';
import { Send, Paperclip } from 'lucide-react';
import { enterpriseQuestions, generalQuestions } from '../config/appConfig';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onAttachFiles: () => void;
  disabled?: boolean;
  hasDocuments?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}

export const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  onAttachFiles, 
  disabled = false,
  hasDocuments = false,
  theme = 'light'
}) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleSampleQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <div className={`border-t p-4 transition-colors duration-200 ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Sample Questions */}
      <div className="mb-4">
        <p className={`text-sm mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          {hasDocuments ? 'Try asking:' : 'Example prompts:'}
        </p>
        <div className="flex flex-wrap gap-2">
          {(hasDocuments ? enterpriseQuestions : generalQuestions).slice(0, 3).map((question, index) => (
            <button
              key={index}
              onClick={() => handleSampleQuestion(question)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={hasDocuments ? "Ask about your documents, request charts, or explore insights..." : "Ask me anything, generate code, create charts, solve problems..."}
            rows={3}
            disabled={disabled}
            className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 disabled:bg-gray-800' 
                : 'bg-white border-gray-300 disabled:bg-gray-100'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={onAttachFiles}
            disabled={disabled}
            className={`p-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark' 
                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`p-3 text-white rounded-lg transition-colors disabled:cursor-not-allowed ${
              !message.trim() || disabled
                ? theme === 'dark' 
                  ? 'bg-gray-600' 
                  : 'bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};