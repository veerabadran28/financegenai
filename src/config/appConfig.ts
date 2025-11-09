import { ChatConfig } from '../types';

export const defaultConfig: ChatConfig = {
  theme: 'light',
  colorTheme: 'blue',
  modelName: 'GPT-4o-mini',
  temperature: 0.7,
  maxTokens: 3000,
  enableDiagrams: true,
  autoDownload: false,
  enterpriseMode: true,
  confidenceThreshold: 0.8,
};

export const supportedFileTypes = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/csv',
  'application/json'
];

export const maxFileSize = 25 * 1024 * 1024; // 25MB for enterprise use

export const enterpriseQuestions = [
  "What is this document about?",
  "Summarize the main points",
  "What are the key details?",
  "Explain this to me",
  "What should I know about this?",
  "Are there any important dates or numbers?",
  "What actions do I need to take?",
  "Create a flowchart of the process described",
  "What are the main requirements mentioned?",
  "Help me understand this document"
];

export const generalQuestions = [
  "Show me a bar chart of quarterly sales",
  "Write a React component for a todo list",
  "Explain how async/await works in JavaScript",
  "Create a pie chart comparing market shares",
  "Generate a Python function to sort a list",
  "Show me sample data in a table format"
];

export const analysisTypes = {
  summary: {
    name: 'Executive Summary',
    description: 'High-level overview and key insights',
    icon: '📋'
  },
  analysis: {
    name: 'Deep Analysis',
    description: 'Comprehensive examination and insights',
    icon: '🔍'
  },
  comparison: {
    name: 'Comparative Analysis',
    description: 'Compare multiple documents or concepts',
    icon: '⚖️'
  },
  extraction: {
    name: 'Data Extraction',
    description: 'Extract specific information and data points',
    icon: '📊'
  },
  recommendation: {
    name: 'Strategic Recommendations',
    description: 'Actionable recommendations and next steps',
    icon: '💡'
  }
};