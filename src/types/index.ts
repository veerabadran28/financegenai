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

// Table extraction types
export interface ExtractedTable {
  id: string;
  title?: string;
  headers: string[];
  rows: string[][];
  pageNumber?: number;
  markdown: string;  // Markdown formatted table
}

// Enhanced document chunk with table support
export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  type: 'paragraph' | 'heading' | 'table' | 'list';
  metadata?: {
    pageNumber?: number;
    hasTable?: boolean;
    tableId?: string;
    hasVisualElements?: boolean;
    [key: string]: any;
  };
}

// Document layout information
export interface DocumentLayout {
  hasMultipleColumns: boolean;
  pageCount: number;
  sections: Array<{
    type: string;
    pageRange: [number, number];
  }>;
}

// Document metadata
export interface DocumentMetadata {
  pageCount?: number;
  wordCount: number;
  characterCount: number;
  language?: string;
  createdDate?: Date;
  modifiedDate?: Date;
  author?: string;
  title?: string;
  subject?: string;
  keywords?: string[];
}

// Enhanced processed document
export interface ProcessedDocument {
  id: string;
  fileName: string;
  content: string;
  type: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
  tables?: ExtractedTable[];  // NEW: Extracted tables
  layout?: DocumentLayout;     // NEW: Document layout
  processor?: string;          // Processor used (textract_analyze/local_pymupdf_pdfplumber)
  processedAt?: string;        // NEW: Processing timestamp
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