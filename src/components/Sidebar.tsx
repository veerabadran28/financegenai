import React from 'react';
import { Settings, Download, FileText, MessageSquare, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';
import { ChatConfig, FileAttachment } from '../types';

interface SidebarProps {
  config: ChatConfig;
  onConfigChange: (config: ChatConfig) => void;
  uploadedFiles: FileAttachment[];
  messageCount: number;
  onExportChat: () => void;
  onToggleFileUpload: () => void;
  onToggleSettings: () => void;
  apiKeyStatus: 'checking' | 'valid' | 'invalid';
  documentAnalytics?: any;
}

export const Sidebar: React.FC<SidebarProps> = ({
  config,
  onConfigChange,
  uploadedFiles,
  messageCount,
  onExportChat,
  onToggleFileUpload,
  onToggleSettings,
  apiKeyStatus,
  documentAnalytics
}) => {
  const getStatusIcon = () => {
    switch (apiKeyStatus) {
      case 'checking':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (apiKeyStatus) {
      case 'checking':
        return 'Checking API...';
      case 'valid':
        return 'OpenAI Connected';
      case 'invalid':
        return 'API Key Invalid';
    }
  };

  const getStatusColor = () => {
    switch (apiKeyStatus) {
      case 'checking':
        return 'text-yellow-700 bg-yellow-50';
      case 'valid':
        return 'text-green-700 bg-green-50';
      case 'invalid':
        return 'text-red-700 bg-red-50';
    }
  };

  return (
    <aside className={`w-80 border-r flex flex-col transition-colors duration-200 ${
      config.theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-6 border-b ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${config.theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
              Insights-B
            </h1>
            <p className={`text-sm ${config.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              GPT-4o-mini Powered
            </p>
          </div>
        </div>

        {/* Settings Button */}
        <button
          onClick={onToggleSettings}
          className={`mt-4 w-full flex items-center justify-center space-x-2 p-2 rounded-lg transition-colors ${
            config.theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>

        {/* API Status */}
        <div className={`mt-4 p-3 rounded-lg ${getStatusColor()}`}>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          {apiKeyStatus === 'invalid' && (
            <div className="mt-2">
              <p className={`text-xs ${config.theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                Please set VITE_OPENAI_API_KEY in .env file
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg ${
            config.theme === 'dark' 
              ? 'bg-blue-900/30' 
              : 'bg-blue-50'
          }`}>
            <div className="flex items-center space-x-2">
              <FileText className={`h-4 w-4 ${config.theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${config.theme === 'dark' ? 'text-blue-300' : 'text-blue-800'}`}>
                Files
              </span>
            </div>
            <p className={`text-2xl font-bold ${config.theme === 'dark' ? 'text-blue-200' : 'text-blue-900'}`}>
              {uploadedFiles.length}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${
            config.theme === 'dark' 
              ? 'bg-teal-900/30' 
              : 'bg-teal-50'
          }`}>
            <div className="flex items-center space-x-2">
              <MessageSquare className={`h-4 w-4 ${config.theme === 'dark' ? 'text-teal-400' : 'text-teal-600'}`} />
              <span className={`text-sm font-medium ${config.theme === 'dark' ? 'text-teal-300' : 'text-teal-800'}`}>
                Messages
              </span>
            </div>
            <p className={`text-2xl font-bold ${config.theme === 'dark' ? 'text-teal-200' : 'text-teal-900'}`}>
              {messageCount}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleFileUpload}
          disabled={apiKeyStatus !== 'valid'}
          className="w-full bg-gradient-to-r from-blue-600 to-teal-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          Upload Documents
        </button>
      </div>

      {/* Configuration */}
      <div className="flex-1 p-6 space-y-6 overflow-auto">

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div>
            <h3 className={`text-lg font-semibold mb-4 ${
              config.theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Uploaded Files
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map(file => (
                <div key={file.id} className={`p-2 rounded-lg ${
                  config.theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <p className={`text-sm font-medium truncate ${
                    config.theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {file.name}
                  </p>
                  <p className={`text-xs ${config.theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Export Button */}
      <div className={`p-6 border-t ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <button
          onClick={onExportChat}
          disabled={messageCount === 0}
          className={`w-full py-2 px-4 rounded-lg disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 ${
            config.theme === 'dark' 
              ? 'bg-gray-700 text-white hover:bg-gray-600 disabled:bg-gray-800' 
              : 'bg-gray-800 text-white hover:bg-gray-900 disabled:bg-gray-400'
          }`}
        >
          <Download className="h-4 w-4" />
          <span>Export Chat</span>
        </button>
      </div>
    </aside>
  );
};