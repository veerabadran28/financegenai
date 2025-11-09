import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Bot, Clock, FileText, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { Message } from '../types';
import { DiagramEditor } from './DiagramEditor';

interface ChatMessageProps {
  message: Message;
  onUpdateMessage: (messageId: string, updates: Partial<Message>) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onUpdateMessage }) => {
  const isUser = message.type === 'user';

  const handleDiagramUpdate = (diagram: any) => {
    onUpdateMessage(message.id, { diagram });
  };

  const getAnalysisTypeIcon = (type?: string) => {
    switch (type) {
      case 'summary': return <FileText className="h-4 w-4" />;
      case 'analysis': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <CheckCircle className="h-4 w-4" />;
      case 'extraction': return <FileText className="h-4 w-4" />;
      case 'comparison': return <TrendingUp className="h-4 w-4" />;
      default: return <Bot className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence?: number) => {
    if (!confidence) return 'text-gray-500';
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence?: number) => {
    if (!confidence) return 'Unknown';
    if (confidence >= 0.9) return 'Very High';
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    if (confidence >= 0.4) return 'Low';
    return 'Very Low';
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex space-x-3 max-w-5xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isUser 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white' 
            : 'bg-gradient-to-br from-teal-500 to-blue-600 text-white shadow-lg'
        }`}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>

        <div className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <div className={`inline-block p-5 rounded-2xl shadow-lg ${
            isUser
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-sm'
              : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
          }`}>
            {/* Enterprise Analysis Header for AI responses */}
            {!isUser && message.analysisMetadata && (
              <div className="mb-4 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getAnalysisTypeIcon(message.analysisMetadata.analysisType)}
                    <span className="text-sm font-semibold text-gray-700 capitalize">
                      {message.analysisMetadata.analysisType === 'analysis' ? 'AI Analysis' : `${message.analysisMetadata.analysisType} Analysis`}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-gray-500">Confidence:</span>
                      <span className={`text-xs font-semibold ${getConfidenceColor(message.analysisMetadata.confidence)}`}>
                        {getConfidenceLabel(message.analysisMetadata.confidence)} ({Math.round((message.analysisMetadata.confidence || 0) * 100)}%)
                      </span>
                    </div>
                    {message.analysisMetadata.sources && message.analysisMetadata.sources.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <FileText className="h-3 w-3 text-gray-500" />
                        <span className="text-xs text-gray-500">
                          {message.analysisMetadata.sources.length} source{message.analysisMetadata.sources.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Source References */}
                {message.analysisMetadata.sources && message.analysisMetadata.sources.length > 0 && (
                  <div className="mt-2">
                    <details className="group">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800 flex items-center space-x-1">
                        <span>📄 View Source References</span>
                        <span className="group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <div className="mt-2 space-y-2">
                        {message.analysisMetadata.sources.slice(0, 3).map((source, index) => (
                          <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                            <div className="font-medium text-gray-700">{source.fileName}</div>
                            <div className="text-gray-600 mt-1">{source.excerpt}</div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}

            <div className="prose prose-sm max-w-none">
              {isUser ? (
                <p className="mb-0 text-white">{message.content}</p>
              ) : (
                <div className="text-gray-800">
                  {message.isStreaming && message.content === '' && (
                    <details className="cursor-pointer">
                      <summary className="list-none">
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            Thinking...
                          </span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </summary>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          🤖 AI processing your request with GPT-4o-mini...
                        </p>
                      </div>
                    </details>
                  )}
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => <h1 className="text-xl font-bold text-gray-900 mb-3">{children}</h1>,
                      h2: ({children}) => <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-4">{children}</h2>,
                      h3: ({children}) => <h3 className="text-base font-semibold text-gray-700 mb-2 mt-3">{children}</h3>,
                      ul: ({children}) => <ul className="list-disc list-inside space-y-1 mb-3">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside space-y-1 mb-3">{children}</ol>,
                      li: ({children}) => <li className="text-gray-700">{children}</li>,
                      p: ({children}) => <p className="mb-3 text-gray-700 leading-relaxed">{children}</p>,
                      strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                      code: ({node, inline, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeString = String(children).replace(/\n$/, '');

                        if (!inline && match) {
                          // Code block with language
                          return (
                            <div className="relative my-4 group">
                              <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
                                <span className="text-xs text-gray-300 font-semibold uppercase">{match[1]}</span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(codeString);
                                  }}
                                  className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                  Copy Code
                                </button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          );
                        } else if (!inline) {
                          // Code block without language
                          return (
                            <div className="relative my-4 group">
                              <div className="flex items-center justify-end bg-gray-800 px-4 py-2 rounded-t-lg">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(codeString);
                                  }}
                                  className="text-xs text-gray-300 hover:text-white px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
                                >
                                  Copy Code
                                </button>
                              </div>
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
                                <code {...props}>{children}</code>
                              </pre>
                            </div>
                          );
                        }
                        // Inline code
                        return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800" {...props}>{children}</code>;
                      },
                      blockquote: ({children}) => (
                        <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r text-gray-700 mb-3">
                          {children}
                        </blockquote>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && message.content && (
                    <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1"></span>
                  )}
                </div>
              )}
            </div>

            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-4 pt-4 border-t border-blue-500/20">
                <p className="text-sm opacity-75 mb-2 flex items-center">
                  <FileText className="h-4 w-4 mr-1" />
                  Analyzed documents:
                </p>
                <div className="space-y-1">
                  {message.attachments.map(file => (
                    <div key={file.id} className="text-sm opacity-90 flex items-center">
                      <div className="w-2 h-2 bg-blue-300 rounded-full mr-2"></div>
                      {file.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center mt-2 text-xs text-gray-500 ${
            isUser ? 'justify-end' : 'justify-start'
          }`}>
            <Clock className="h-3 w-3 mr-1" />
            {message.timestamp.toLocaleTimeString()}
            {!isUser && message.analysisMetadata?.analysisType && (
              <>
                <span className="mx-2">•</span>
                <span className="capitalize">{message.analysisMetadata.analysisType}</span>
              </>
            )}
          </div>

          {message.diagram && (
            <div className="mt-6">
              <DiagramEditor 
                diagram={message.diagram} 
                onUpdate={handleDiagramUpdate}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};