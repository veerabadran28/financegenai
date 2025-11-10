import React, { useState, useRef, useEffect } from 'react';
import { Message, FileAttachment, ChatConfig, AnalysisMetadata } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { Sidebar } from './components/Sidebar';
import { SettingsPanel } from './components/SettingsPanel';
import { FileUpload } from './components/FileUpload';
import { ModeToggle } from './components/ModeToggle';
import { mcpClient } from './services/mcpClient';
import { downloadAsDocument } from './utils/downloadHandler';
import { defaultConfig } from './config/appConfig';
import { createFileAttachment } from './utils/fileHandler';
import { IntelligentAgent } from './services/agentService';
import { AgenticService } from './services/agenticService';
import { conversationService, Conversation } from './services/conversationService';
import { preferencesService } from './services/preferencesService';
import { isSupabaseEnabled } from './lib/supabase';
import { processDocuments } from './utils/documentProcessor';

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
  const [processedDocuments, setProcessedDocuments] = useState<any[]>([]);
  const [config, setConfig] = useState<ChatConfig>(defaultConfig);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [apiKeyStatus, setApiKeyStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentThinkingProcess, setCurrentThinkingProcess] = useState<string>('');
  const messageSequenceRef = useRef<number>(0);
  const [mode, setMode] = useState<'web' | 'work'>('work');
  const [agenticService, setAgenticService] = useState<AgenticService | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation on app start
  useEffect(() => {
    const initializeConversation = async () => {
      const newConversationId = await conversationService.createConversation();
      setConversationId(newConversationId);
      console.log('📝 New conversation initialized:', newConversationId);

      // Load existing conversations if Supabase is enabled
      if (isSupabaseEnabled) {
        const existingConversations = await conversationService.listConversations();
        setConversations(existingConversations);
        console.log('💬 Loaded existing conversations:', existingConversations.length);
      }
    };

    initializeConversation();
  }, []);

  useEffect(() => {
    const checkApiKey = async () => {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

      console.log('Checking API key:', apiKey ? 'Found' : 'Not found');

      if (!apiKey) {
        console.log('No API key found in environment');
        setApiKeyStatus('invalid');
        return;
      }

      if (!apiKey.startsWith('sk-')) {
        console.log('Invalid API key format');
        setApiKeyStatus('invalid');
        return;
      }

      try {
        console.log('Setting up MCP client...');
        const result = await mcpClient.setupOpenAI(apiKey);

        console.log('MCP setup result:', result);

        if (result.success) {
          console.log('API key validation successful');
          setApiKeyStatus('valid');

          const agentService = new AgenticService(apiKey);
          setAgenticService(agentService);
          console.log('✅ Agentic service initialized');
        } else {
          console.log('API key validation failed:', result.error);
          setApiKeyStatus('invalid');
        }
      } catch (error) {
        console.error('API key validation error:', error);
        setApiKeyStatus('invalid');
      }
    };

    setTimeout(checkApiKey, 1000);
  }, []);

  useEffect(() => {
    const loadPreferences = async () => {
      const savedMode = await preferencesService.getMode();
      setMode(savedMode);
      console.log('📌 Loaded user mode:', savedMode);
    };

    loadPreferences();
  }, []);

  // Process documents when files are uploaded
  useEffect(() => {
    const processUploadedFiles = async () => {
      if (uploadedFiles.length > 0 && processedDocuments.length !== uploadedFiles.length) {
        setProcessingStatus('🚀 Processing documents with hybrid AI processor...');
        try {
          // Use backend hybrid document processing (AWS Textract + local fallback)
          const processed = await processDocuments(uploadedFiles);

          // Convert to expected format with table support
          const processedDocs = processed.map(doc => ({
            id: doc.id || crypto.randomUUID(),
            file_name: doc.fileName,
            content_preview: doc.content.substring(0, 500) + (doc.content.length > 500 ? '...' : ''),
            content: doc.content, // Store full content
            metadata: {
              word_count: doc.metadata.wordCount,
              character_count: doc.metadata.characterCount,
              page_count: doc.metadata.pageCount
            },
            chunk_count: doc.chunks.length,
            chunks: doc.chunks,
            tables: doc.tables || [],  // Include extracted tables
            processor: doc.processor,   // Track which processor was used
            processedAt: doc.processedAt
          }));

          setProcessedDocuments(processedDocs);
          setProcessingStatus('');

          // Check if any documents failed to process
          const failedDocs = processedDocs.filter(doc => doc.content_preview.includes('❌'));
          const successfulDocs = processedDocs.filter(doc => !doc.content_preview.includes('❌'));

          // Calculate total tables extracted
          const totalTables = successfulDocs.reduce((sum, doc) => sum + (doc.tables?.length || 0), 0);

          // Show processing summary
          let summary = `📄 **Document Processing Complete**\n\n`;

          if (successfulDocs.length > 0) {
            summary += `✅ Successfully processed ${successfulDocs.length} document${successfulDocs.length !== 1 ? 's' : ''}:\n\n`;
            summary += successfulDocs.map(doc => {
              const tableInfo = doc.tables && doc.tables.length > 0 ? `, ${doc.tables.length} table${doc.tables.length !== 1 ? 's' : ''}` : '';
              const processorInfo = doc.processor ? ` (${doc.processor})` : '';
              return `• **${doc.file_name}** - ${doc.metadata.word_count} words, ${doc.metadata.page_count || 'N/A'} pages${tableInfo}${processorInfo}`;
            }).join('\n');

            if (totalTables > 0) {
              summary += `\n\n📊 **Extracted ${totalTables} structured table${totalTables !== 1 ? 's' : ''}** with preserved formatting!`;
            }

            summary += `\n\n🎯 Ready for analysis! Ask me questions about your documents and data.`;
          }

          if (failedDocs.length > 0) {
            summary += `\n\n⚠️ ${failedDocs.length} document${failedDocs.length !== 1 ? 's' : ''} could not be processed:\n\n`;
            summary += failedDocs.map(doc => `• **${doc.file_name}** - Processing failed`).join('\n');
            summary += `\n\n💡 Try re-uploading these files or converting them to a different format.`;
          }

          const processingMessage: Message = {
            id: crypto.randomUUID(),
            type: 'assistant',
            content: summary,
            timestamp: new Date(),
            analysisMetadata: {
              analysisType: 'summary',
              confidence: successfulDocs.length > 0 ? 1.0 : 0.3,
              sources: []
            }
          };

          setMessages(prev => [...prev, processingMessage]);

          // Save documents to Supabase if conversation exists
          if (conversationId && isSupabaseEnabled) {
            for (const doc of successfulDocs) {
              await conversationService.saveDocument(conversationId, doc);
            }
            console.log('💾 Documents saved to database');
          }
        } catch (error) {
          console.error('Document processing error:', error);
          setProcessingStatus('');
          
          const errorMessage: Message = {
            id: crypto.randomUUID(),
            type: 'assistant',
            content: `❌ **Document Processing Error**\n\nFailed to process uploaded documents. Please try:\n\n• Re-uploading the files\n• Converting to PDF or TXT format\n• Checking file permissions\n\nError details: ${error instanceof Error ? error.message : 'Unknown error'}`,
            timestamp: new Date(),
            analysisMetadata: {
              analysisType: 'analysis',
              confidence: 0,
              sources: []
            }
          };
          
          setMessages(prev => [...prev, errorMessage]);
        }
      }
    };

    processUploadedFiles();
  }, [uploadedFiles, processedDocuments.length]);

  const handleSendMessage = async (content: string) => {
    if (apiKeyStatus !== 'valid') {
      alert('OpenAI API key is not configured properly. Please check your environment variables.');
      return;
    }

    const startTime = Date.now();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date(),
      attachments: uploadedFiles.length > 0 ? [...uploadedFiles] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setCurrentThinkingProcess('🔍 Analyzing request and document context...');

    // Save user message to database
    if (conversationId && isSupabaseEnabled) {
      await conversationService.saveMessage(conversationId, userMessage, messageSequenceRef.current++);

      // Update conversation title if this is the first user message
      if (messageSequenceRef.current === 1) {
        const title = await conversationService.generateConversationTitle(content);
        await conversationService.updateConversationTitle(conversationId, title);
      }
    }

    // Create streaming assistant message
    const assistantMessageId = crypto.randomUUID();
    const streamingMessage: Message = {
      id: assistantMessageId,
      type: 'assistant',
      content: '',
      isStreaming: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, streamingMessage]);

    try {
      let fullContent = '';

      // Convert processed documents to expected format FIRST
      const documents = processedDocuments.map(doc => {
        console.log('📄 Processing doc:', doc.file_name, 'Content length:', doc.content?.length || doc.content_preview?.length || 0);
        return {
          fileName: doc.file_name,
          content: doc.content || doc.content_preview,
          type: 'application/pdf',
          metadata: doc.metadata,
          chunks: doc.chunks || []
        };
      });

      // Show detailed thinking steps
      if (documents.length > 0) {
        setCurrentThinkingProcess(`📄 Processing ${documents.length} document(s): ${documents.map(d => d.fileName).join(', ')}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setCurrentThinkingProcess('🤖 Using AI to understand your request and analyze document content...');
      await new Promise(resolve => setTimeout(resolve, 300));

      // Use Intelligent Agent to handle the request
      console.log('🤖 Using Intelligent Agent to process request...');
      console.log('📄 Processed documents count:', processedDocuments.length);

      console.log('✅ Converted documents:', documents.length, 'Total content:', documents.reduce((sum, d) => sum + (d.content?.length || 0), 0));

      // Get conversation history for context
      const conversationHistory = messages.filter(m => m.type === 'user' || m.type === 'assistant');
      console.log('💬 Conversation history:', conversationHistory.length, 'messages');

      setCurrentThinkingProcess('💭 Extracting key information from documents and formulating response...');

      let agentResponse;

      if (mode === 'web' && agenticService) {
        console.log('🌐 Using WEB mode with agentic service');
        setCurrentThinkingProcess('🌐 Searching web and analyzing information...');

        const result = await agenticService.processQuery(
          content,
          mode,
          conversationHistory
        );

        console.log('✅ Agentic response received:', result);

        agentResponse = {
          content: result.content,
          needsDiagram: false,
          confidence: result.confidence,
          analysisType: 'web_search',
          sources: result.sources,
          diagramType: undefined,
          diagramTitle: undefined,
          dynamicData: undefined
        };

        if (result.sources.length > 0) {
          agentResponse.content += '\n\n**Sources:**\n' + result.sources.map((s, i) =>
            `${i + 1}. [${s.title}](${s.url})`
          ).join('\n');
        }

        if (result.toolsUsed.length > 0) {
          console.log('🛠️  Tools used:', result.toolsUsed.join(', '));
        }

        await preferencesService.saveSearchHistory(
          content,
          mode,
          result.toolsUsed,
          result.sources,
          result.content
        );

      } else {
        console.log('💼 Using WORK mode with document analysis');
        console.log('🚀 Calling IntelligentAgent.processRequest with:', {
          requestLength: content.length,
          documentsCount: documents.length,
          historyCount: conversationHistory.length
        });

        agentResponse = await IntelligentAgent.processRequest(content, documents, conversationHistory, config);
        console.log('✅ Agent response received:', {
          contentLength: agentResponse.content.length,
          needsDiagram: agentResponse.needsDiagram,
          confidence: agentResponse.confidence
        });
      }

      const processingTime = Date.now() - startTime;

      let diagram = undefined;
      if (agentResponse.needsDiagram && config.enableDiagrams) {
        try {
          setCurrentThinkingProcess('Analyzing document content and generating interactive diagram...');
          setProcessingStatus('Generating diagram from document content...');

          // Build context from document content for diagram generation
          const documentContent = documents.map(doc => doc.content).join('\n\n');
          const fullContext = `User request: ${content}\n\nDocument content:\n${documentContent}`;

          // Use MCP client for diagram generation with full context
          const diagramResult = await mcpClient.generateDiagram(
            fullContext,
            agentResponse.diagramType || 'flowchart',
            agentResponse.diagramTitle || 'Generated Diagram'
          );
          
          if (diagramResult.success) {
            diagram = diagramResult.data;
            console.log('Generated diagram via MCP:', diagram);
          } else {
            // Fallback to local generation with document content
            const { generateDiagramWithOpenAI } = await import('./services/openaiService');
            const documentContent = documents.map(doc => doc.content).join('\n\n');
            const contextForDiagram = documentContent ? `${content}\n\nBased on document:\n${documentContent}` : content;
            diagram = await generateDiagramWithOpenAI(
              contextForDiagram,
              agentResponse.diagramType || 'flowchart',
              agentResponse.diagramTitle || 'Generated Diagram'
            );
            console.log('Generated diagram via fallback:', diagram);
          }
          
          setProcessingStatus('');
        } catch (diagramError) {
          console.error('Diagram generation failed:', diagramError);
          // Create fallback diagram with document context
          const { DynamicDiagramGenerator } = await import('./services/diagramGenerator');
          const documentContent = documents.map(doc => doc.content).join('\n\n');
          diagram = DynamicDiagramGenerator.generateDiagram({
            type: agentResponse.diagramType || 'flowchart',
            title: agentResponse.diagramTitle || 'Process Flow',
            content: documentContent || content,
            context: documentContent || content
          });
          setProcessingStatus('');
        }
      }

      // Pass dynamic data to diagram if available
      if (agentResponse.dynamicData && diagram) {
        diagram = {
          ...diagram,
          metadata: { 
            dynamicData: agentResponse.dynamicData,
            chartData: agentResponse.dynamicData
          }
        };
        console.log('Updated diagram with dynamic data:', diagram);
      }

      const analysisMetadata: AnalysisMetadata = {
        analysisType: agentResponse.analysisType || 'analysis',
        confidence: agentResponse.confidence || 0.5,
        sources: agentResponse.sources || [],
        processingTime,
        tokenCount: Math.ceil(agentResponse.content.length / 4)
      };

      // Update the final message with complete data
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: agentResponse.content,
              isStreaming: false,
              diagram,
              analysisMetadata
            }
          : msg
      ));

      // Auto-download if enabled and confidence is high
      if (config.autoDownload && (agentResponse.confidence || 0) >= config.confidenceThreshold) {
        setTimeout(() => {
          const finalMessages = [...messages, userMessage, {
            id: assistantMessageId,
            type: 'assistant' as const,
            content: agentResponse.content,
            timestamp: new Date(),
            diagram,
            analysisMetadata
          }];
          downloadAsDocument(finalMessages);
        }, 1000);
      }

    } catch (error) {
      console.error('❌ ERROR CAUGHT IN APP.TSX:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error details:', error instanceof Error ? error.message : String(error));
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');

      let errorMessage = '❌ **System Error**: I encountered an issue while processing your request.';

      if (error instanceof Error) {
        console.error('📋 Full error message:', error.message);

        if (error.message.includes('API key') || error.message.includes('401')) {
          errorMessage = '🔑 **API Key Error**: Your OpenAI API key is invalid or expired. Please update your API key in the Settings panel.';
        } else if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
          errorMessage = '💳 **Quota Exceeded**: You have exceeded your OpenAI API quota. Please check your billing at https://platform.openai.com/account/billing';
        } else if (error.message.includes('rate limit') || error.message.includes('429')) {
          errorMessage = '⏱️ **Rate Limited**: Too many requests. Please wait a moment and try again.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '🌐 **Network Error**: Please check your internet connection.';
        } else {
          // Show actual error for debugging
          errorMessage = `❌ **Error**: ${error.message}\n\n💡 Check the browser console (F12) for more details.`;
        }
      }
      
      // Update streaming message with error
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { 
              ...msg, 
              content: errorMessage,
              isStreaming: false,
              analysisMetadata: {
                analysisType: 'analysis' as const,
                confidence: 0,
                sources: []
              }
            }
          : msg
      ));
    } finally {
      setIsTyping(false);
      setProcessingStatus('');
      setCurrentThinkingProcess('');

      // Save assistant message to database
      if (conversationId && isSupabaseEnabled) {
        const finalMessage = messages.find(m => m.id === assistantMessageId);
        if (finalMessage) {
          await conversationService.saveMessage(conversationId, finalMessage, messageSequenceRef.current++);
          console.log('💾 Assistant message saved to database');
        }
      }
    }
  };

  const handleFileUpload = (file: FileAttachment) => {
    setUploadedFiles(prev => [...prev, file]);
    setShowFileUpload(false);
  };

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    setProcessedDocuments(prev => prev.filter(doc => 
      uploadedFiles.find(f => f.id === fileId)?.name !== doc.file_name
    ));
    
    // Clean up object URL
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
  };

  const handleUpdateMessage = (messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, ...updates } : msg
    ));
  };

  const handleExportChat = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    downloadAsDocument(messages, `chat-export-${timestamp}.html`);
  };

  const handleNewConversation = async () => {
    const newConversationId = await conversationService.createConversation();
    setConversationId(newConversationId);
    setMessages([]);
    setUploadedFiles([]);
    setProcessedDocuments([]);
    messageSequenceRef.current = 0;
    console.log('🆕 New conversation started:', newConversationId);

    // Refresh conversation list
    if (isSupabaseEnabled) {
      const updatedConversations = await conversationService.listConversations();
      setConversations(updatedConversations);
    }
  };

  const handleLoadConversation = async (conversationToLoad: Conversation) => {
    if (!isSupabaseEnabled) return;

    setConversationId(conversationToLoad.id);

    // Load messages
    const loadedMessages = await conversationService.getMessages(conversationToLoad.id);
    setMessages(loadedMessages);
    messageSequenceRef.current = loadedMessages.length;

    // Load documents
    const loadedDocuments = await conversationService.getDocuments(conversationToLoad.id);
    setProcessedDocuments(loadedDocuments);

    // Convert documents to file attachments for display
    const fileAttachments = loadedDocuments.map(doc => ({
      id: doc.id,
      name: doc.file_name,
      size: doc.content.length,
      type: 'application/pdf',
      url: '#',
      file: null as any
    }));
    setUploadedFiles(fileAttachments);

    setShowConversations(false);
    console.log('📂 Loaded conversation:', conversationToLoad.title);
  };

  const handleDeleteConversation = async (conversationToDelete: Conversation) => {
    if (!isSupabaseEnabled) return;

    const confirmed = window.confirm(`Delete conversation "${conversationToDelete.title}"?`);
    if (!confirmed) return;

    await conversationService.deleteConversation(conversationToDelete.id);

    // Refresh conversation list
    const updatedConversations = await conversationService.listConversations();
    setConversations(updatedConversations);

    // If we deleted the current conversation, start a new one
    if (conversationToDelete.id === conversationId) {
      handleNewConversation();
    }
  };

  const getDocumentAnalytics = () => {
    return {
      totalDocuments: processedDocuments.length,
      totalWords: processedDocuments.reduce((sum, doc) => sum + doc.metadata.word_count, 0),
      totalPages: processedDocuments.reduce((sum, doc) => sum + (doc.metadata.page_count || 0), 0),
      documentTypes: [...new Set(processedDocuments.map(doc => doc.file_name.split('.').pop()))],
      averageConfidence: messages
        .filter(m => m.analysisMetadata?.confidence)
        .reduce((sum, m, _, arr) => sum + (m.analysisMetadata!.confidence / arr.length), 0),
      analysisCount: messages.filter(m => m.type === 'assistant').length
    };
  };

  // Apply theme classes to document body
  useEffect(() => {
    const isDark = config.theme === 'dark' || 
      (config.theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme]);

  return (
    <div className={`flex h-screen transition-colors duration-200 ${
      config.theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-gray-50 to-blue-50'
    }`}>
      <Sidebar
        config={config}
        onConfigChange={setConfig}
        uploadedFiles={uploadedFiles}
        messageCount={messages.length}
        onExportChat={handleExportChat}
        onToggleFileUpload={() => setShowFileUpload(!showFileUpload)}
        onToggleSettings={() => setShowSettings(!showSettings)}
        apiKeyStatus={apiKeyStatus}
        documentAnalytics={getDocumentAnalytics()}
      />

      <div className="flex-1 flex flex-col">
        {/* Conversation Header */}
        <div className={`border-b p-3 flex items-center justify-between ${
          config.theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {isSupabaseEnabled && (
              <>
                <button
                  onClick={() => setShowConversations(!showConversations)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    config.theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="text-sm font-medium">Conversations</span>
                </button>

                <button
                  onClick={handleNewConversation}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    config.theme === 'dark'
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-sm font-medium">New</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <ModeToggle mode={mode} onChange={setMode} />
            {isSupabaseEnabled && (
              <div className={`text-sm ${config.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {messages.length} messages
              </div>
            )}
          </div>
        </div>

        {/* Status Banners */}
        {apiKeyStatus === 'invalid' && (
          <div className={`border-b p-4 ${
            config.theme === 'dark' 
              ? 'bg-red-900/20 border-red-800' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <p className={`text-sm ${config.theme === 'dark' ? 'text-red-300' : 'text-red-800'}`}>
                <strong>🔑 Enterprise Configuration Required:</strong> Please ensure your OpenAI API key is properly configured for enterprise-grade document analysis.
              </p>
            </div>
          </div>
        )}

        {apiKeyStatus === 'checking' && (
          <div className={`border-b p-4 ${
            config.theme === 'dark' 
              ? 'bg-yellow-900/20 border-yellow-800' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full animate-pulse"></div>
              <p className={`text-sm ${config.theme === 'dark' ? 'text-yellow-300' : 'text-yellow-800'}`}>
                🔍 Validating enterprise API connection...
              </p>
            </div>
          </div>
        )}

        {processingStatus && (
          <div className={`border-b p-4 ${
            config.theme === 'dark' 
              ? 'bg-blue-900/20 border-blue-800' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
              <p className={`text-sm ${config.theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                ⚡ {processingStatus}
              </p>
            </div>
          </div>
        )}

        {/* Main Chat Area */}
        <div className="flex-1 overflow-auto">
          {showFileUpload && (
            <div className={`p-6 border-b shadow-sm ${
              config.theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <FileUpload
                onFileUpload={handleFileUpload}
                uploadedFiles={uploadedFiles}
                onRemoveFile={handleRemoveFile}
              />
            </div>
          )}

          <div className="flex-1 p-6">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className={`text-center max-w-2xl ${
                  config.theme === 'dark' 
                    ? 'text-white' 
                    : 'text-gray-800'
                }`}>
                  <div className="mb-8">
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                      <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-4">
                      Insights-B
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                      Smart document analysis powered by GPT-4o-mini. Upload your documents and ask questions naturally.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className={`p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow ${
                      config.theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-100'
                    }`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        🤖 Natural AI Conversations
                      </h3>
                      <p className={`text-sm ${config.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Chat naturally about your documents with GPT-4o-mini, just like ChatGPT but with document context
                      </p>
                    </div>
                    
                    <div className={`p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow ${
                      config.theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-100'
                    }`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        📊 Smart Diagrams
                      </h3>
                      <p className={`text-sm ${config.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Ask for flowcharts, diagrams, or visual representations and get editable, exportable results
                      </p>
                    </div>
                    
                    <div className={`p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow ${
                      config.theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-100'
                    }`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        🔍 Real Document Processing
                      </h3>
                      <p className={`text-sm ${config.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Upload PDFs, Word docs, or text files and get accurate answers based on the actual content
                      </p>
                    </div>
                    
                    <div className={`p-6 rounded-xl shadow-lg border hover:shadow-xl transition-shadow ${
                      config.theme === 'dark' 
                        ? 'bg-gray-800 border-gray-700' 
                        : 'bg-white border-gray-100'
                    }`}>
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                        📁 Easy Export
                      </h3>
                      <p className={`text-sm ${config.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Export your conversations and diagrams in various formats for sharing and documentation
                      </p>
                    </div>
                  </div>

                  <div className={`rounded-xl p-6 border ${
                    config.theme === 'dark' 
                      ? 'bg-gradient-to-r from-blue-900/30 to-teal-900/30 border-blue-800' 
                      : 'bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200'
                  }`}>
                    <h4 className={`text-lg font-semibold mb-3 ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                      🚀 Ready to Chat About Your Documents
                    </h4>
                    <p className={`mb-4 ${config.theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      Upload your documents and ask questions naturally. Get helpful answers, explanations, and insights based on your actual document content.
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">Natural Conversations</span>
                      <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full">Document Q&A</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full">Smart Summaries</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">Visual Diagrams</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map(message => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    onUpdateMessage={handleUpdateMessage}
                  />
                ))}
                
                {isTyping && (
                  <div className="flex justify-start mb-6">
                    <div className="flex space-x-3 max-w-4xl">
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <ChatInput
          onSendMessage={handleSendMessage}
          onAttachFiles={() => setShowFileUpload(true)}
          disabled={isTyping || apiKeyStatus !== 'valid'}
          hasDocuments={processedDocuments.length > 0}
          theme={config.theme}
        />
      </div>

      <SettingsPanel
        config={config}
        onConfigChange={setConfig}
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Conversations List Modal */}
      {showConversations && isSupabaseEnabled && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-2xl w-full mx-4 rounded-xl shadow-2xl ${
            config.theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`p-6 border-b ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className={`text-2xl font-bold ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                  Conversation History
                </h2>
                <button
                  onClick={() => setShowConversations(false)}
                  className={`p-2 rounded-lg hover:bg-opacity-10 ${
                    config.theme === 'dark' ? 'hover:bg-white' : 'hover:bg-black'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <p className={`text-lg ${config.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No conversations yet
                  </p>
                  <p className={`text-sm mt-2 ${config.theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    Start a new conversation to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-4 rounded-lg border transition-all cursor-pointer ${
                        conv.id === conversationId
                          ? config.theme === 'dark'
                            ? 'bg-blue-900/20 border-blue-600'
                            : 'bg-blue-50 border-blue-300'
                          : config.theme === 'dark'
                            ? 'bg-gray-700 border-gray-600 hover:bg-gray-650'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => handleLoadConversation(conv)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            config.theme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}>
                            {conv.title}
                          </h3>
                          <p className={`text-sm mt-1 ${
                            config.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {new Date(conv.updated_at).toLocaleDateString()} at{' '}
                            {new Date(conv.updated_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(conv);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            config.theme === 'dark'
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;