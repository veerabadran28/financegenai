import React, { useState } from 'react';
import { Settings, X, Sun, Moon, Palette, Monitor } from 'lucide-react';
import { ChatConfig } from '../types';

interface SettingsPanelProps {
  config: ChatConfig;
  onConfigChange: (config: ChatConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  config,
  onConfigChange,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'appearance' | 'ai' | 'advanced'>('appearance');

  const themes = [
    { id: 'blue', name: 'Ocean Blue', primary: 'from-blue-500 to-blue-600', secondary: 'from-blue-50 to-blue-100' },
    { id: 'teal', name: 'Teal Green', primary: 'from-teal-500 to-teal-600', secondary: 'from-teal-50 to-teal-100' },
    { id: 'purple', name: 'Royal Purple', primary: 'from-purple-500 to-purple-600', secondary: 'from-purple-50 to-purple-100' },
    { id: 'emerald', name: 'Emerald', primary: 'from-emerald-500 to-emerald-600', secondary: 'from-emerald-50 to-emerald-100' },
    { id: 'rose', name: 'Rose Pink', primary: 'from-rose-500 to-rose-600', secondary: 'from-rose-50 to-rose-100' },
    { id: 'amber', name: 'Amber Gold', primary: 'from-amber-500 to-amber-600', secondary: 'from-amber-50 to-amber-100' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-2xl mx-4 rounded-2xl shadow-2xl ${
        config.theme === 'dark' 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Settings</h2>
              <p className={`text-sm ${config.theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Customize your DocuChat experience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              config.theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'ai', label: 'AI Settings', icon: Settings },
            { id: 'advanced', label: 'Advanced', icon: Monitor }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? config.theme === 'dark'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-blue-600 border-b-2 border-blue-600'
                  : config.theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              {/* Theme Mode */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Sun className="h-5 w-5 mr-2" />
                  Display Mode
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'light', label: 'Light', icon: Sun },
                    { value: 'dark', label: 'Dark', icon: Moon },
                    { value: 'auto', label: 'Auto', icon: Monitor }
                  ].map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => onConfigChange({ ...config, theme: mode.value as any })}
                      className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                        config.theme === mode.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : config.theme === 'dark'
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <mode.icon className="h-6 w-6" />
                      <span className="font-medium">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Themes */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Color Theme
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => onConfigChange({ ...config, colorTheme: theme.id })}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center space-x-3 ${
                        config.colorTheme === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : config.theme === 'dark'
                            ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${theme.primary}`}></div>
                      <div>
                        <p className="font-medium text-left">{theme.name}</p>
                        <div className={`w-16 h-2 rounded-full bg-gradient-to-r ${theme.secondary} mt-1`}></div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  OpenAI Model
                </label>
                <select
                  value={config.modelName}
                  onChange={(e) => onConfigChange({ ...config, modelName: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    config.theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <option value="GPT-4o-mini">GPT-4o-mini (Recommended)</option>
                  <option value="GPT-4">GPT-4</option>
                  <option value="GPT-3.5">GPT-3.5 Turbo</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Creativity: {config.temperature}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={config.temperature}
                  onChange={(e) => onConfigChange({ ...config, temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Max Response Length: {config.maxTokens}
                </label>
                <input
                  type="range"
                  min="500"
                  max="4000"
                  step="100"
                  value={config.maxTokens}
                  onChange={(e) => onConfigChange({ ...config, maxTokens: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Short</span>
                  <span>Detailed</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">AI Diagrams</label>
                  <p className="text-xs text-gray-500">Generate visual diagrams from content</p>
                </div>
                <button
                  onClick={() => onConfigChange({ ...config, enableDiagrams: !config.enableDiagrams })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.enableDiagrams ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.enableDiagrams ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium">Auto Download</label>
                  <p className="text-xs text-gray-500">Automatically download high-confidence analyses</p>
                </div>
                <button
                  onClick={() => onConfigChange({ ...config, autoDownload: !config.autoDownload })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    config.autoDownload ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      config.autoDownload ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Confidence Threshold: {Math.round(config.confidenceThreshold * 100)}%
                </label>
                <input
                  type="range"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  value={config.confidenceThreshold}
                  onChange={(e) => onConfigChange({ ...config, confidenceThreshold: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end space-x-3 p-6 border-t ${
          config.theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};