export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
  attachments?: FileAttachment[];
  diagram?: DiagramData;
  analysisMetadata?: AnalysisMetadata;
}

export interface AnalysisMetadata {
  analysisType: 'summary' | 'analysis' | 'comparison' | 'extraction' | 'recommendation';
  confidence: number;
  sources: DocumentSource[];
  processingTime?: number;
  tokenCount?: number;
}

export interface DocumentSource {
  fileName: string;
  chunkId: string;
  relevance: number;
  excerpt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

export interface DiagramData {
  id: string;
  type: 'flowchart' | 'diagram' | 'process' | 'organizational' | 'timeline' | 'bar' | 'pie' | 'line' | 'table' | 'mermaid';
  title: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  metadata?: any;
}

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'executive' | 'manager' | 'employee' | 'milestone' | 'deliverable' | 'bar' | 'slice' | 'header' | 'cell' | 'axis' | 'point' | 'data';
}

export interface DiagramConnection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface ChatConfig {
  theme: 'light' | 'dark' | 'auto';
  colorTheme?: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
  enableDiagrams: boolean;
  autoDownload: boolean;
  enterpriseMode: boolean;
  confidenceThreshold: number;
}

export interface DocumentAnalytics {
  totalDocuments: number;
  totalWords: number;
  totalPages: number;
  documentTypes: string[];
  averageConfidence: number;
  mostReferencedDocument: string;
  analysisHistory: AnalysisHistoryItem[];
}

export interface AnalysisHistoryItem {
  timestamp: Date;
  question: string;
  analysisType: string;
  confidence: number;
  documentsUsed: string[];
}