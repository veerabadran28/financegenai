import { FileAttachment } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ProcessedDocument {
  fileName: string;
  content: string;
  type: string;
  metadata: DocumentMetadata;
  chunks: DocumentChunk[];
}

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

export interface DocumentChunk {
  id: string;
  content: string;
  startIndex: number;
  endIndex: number;
  type: 'paragraph' | 'heading' | 'table' | 'list';
  metadata?: any;
}

export const processDocuments = async (files: FileAttachment[]): Promise<ProcessedDocument[]> => {
  const processedDocs: ProcessedDocument[] = [];

  for (const file of files) {
    try {
      console.log(`Processing document: ${file.name}`);
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      let processedDoc: ProcessedDocument;
      
      if (file.type === 'application/pdf') {
        processedDoc = await processPDFDocument(file.name, blob);
      } else if (file.type === 'text/plain') {
        processedDoc = await processTextDocument(file.name, blob);
      } else if (file.type.includes('word') || file.type.includes('document')) {
        processedDoc = await processWordDocument(file.name, blob);
      } else {
        processedDoc = await processGenericDocument(file.name, blob, file.type);
      }

      processedDocs.push(processedDoc);
      console.log(`Successfully processed: ${file.name}`);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      processedDocs.push(createErrorDocument(file.name, file.type, error));
    }
  }

  return processedDocs;
};

const processPDFDocument = async (fileName: string, blob: Blob): Promise<ProcessedDocument> => {
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    const chunks: DocumentChunk[] = [];
    let chunkIndex = 0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let pageText = '';
      textContent.items.forEach((item: any) => {
        if (item.str) {
          pageText += item.str + ' ';
        }
      });

      if (pageText.trim()) {
        const startIndex = fullText.length;
        fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
        const endIndex = fullText.length;

        chunks.push({
          id: `chunk-${chunkIndex++}`,
          content: pageText.trim(),
          startIndex,
          endIndex,
          type: 'paragraph',
          metadata: { pageNumber: pageNum }
        });
      }
    }

    const metadata = await extractPDFMetadata(pdf);
    
    return {
      fileName,
      content: fullText.trim(),
      type: 'application/pdf',
      metadata: {
        ...metadata,
        pageCount: pdf.numPages,
        wordCount: countWords(fullText),
        characterCount: fullText.length
      },
      chunks
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return createFallbackPDFDocument(fileName);
  }
};

const processTextDocument = async (fileName: string, blob: Blob): Promise<ProcessedDocument> => {
  const content = await blob.text();
  const chunks = createTextChunks(content);
  
  return {
    fileName,
    content,
    type: 'text/plain',
    metadata: {
      wordCount: countWords(content),
      characterCount: content.length,
      language: detectLanguage(content)
    },
    chunks
  };
};

const processWordDocument = async (fileName: string, blob: Blob): Promise<ProcessedDocument> => {
  // Try to read as text first
  try {
    const content = await blob.text();
    if (content && content.trim().length > 0 && !content.includes('\0')) {
      const chunks = createTextChunks(content);
      return {
        fileName,
        content,
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          wordCount: countWords(content),
          characterCount: content.length,
          language: detectLanguage(content)
        },
        chunks
      };
    }
  } catch (error) {
    console.warn('Could not read Word document as text:', error);
  }
  
  // Fallback error message
  const errorContent = `Unable to process Word document "${fileName}". Please try converting to PDF or TXT format for better compatibility.`;
  const chunks = createTextChunks(errorContent);
  
  return {
    fileName,
    content: errorContent,
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    metadata: {
      wordCount: countWords(errorContent),
      characterCount: errorContent.length
    },
    chunks
  };
};

const processGenericDocument = async (fileName: string, blob: Blob, type: string): Promise<ProcessedDocument> => {
  try {
    const content = await blob.text();
    
    if (!content || content.trim().length === 0) {
      throw new Error('Document appears to be empty or unreadable');
    }
    
    const chunks = createTextChunks(content);
    
    return {
      fileName,
      content,
      type,
      metadata: {
        wordCount: countWords(content),
        characterCount: content.length
      },
      chunks
    };
  } catch (error) {
    console.error(`Error processing ${fileName}:`, error);
    return createErrorDocument(fileName, type, error);
  }
};

const extractPDFMetadata = async (pdf: any): Promise<Partial<DocumentMetadata>> => {
  try {
    const metadata = await pdf.getMetadata();
    return {
      title: metadata.info?.Title || undefined,
      author: metadata.info?.Author || undefined,
      subject: metadata.info?.Subject || undefined,
      keywords: metadata.info?.Keywords ? metadata.info.Keywords.split(',').map((k: string) => k.trim()) : undefined,
      createdDate: metadata.info?.CreationDate ? new Date(metadata.info.CreationDate) : undefined,
      modifiedDate: metadata.info?.ModDate ? new Date(metadata.info.ModDate) : undefined
    };
  } catch (error) {
    console.warn('Could not extract PDF metadata:', error);
    return {};
  }
};

const createTextChunks = (content: string): DocumentChunk[] => {
  const chunks: DocumentChunk[] = [];
  const paragraphs = content.split(/\n\s*\n/);
  let currentIndex = 0;
  let chunkId = 0;

  paragraphs.forEach(paragraph => {
    if (paragraph.trim()) {
      const startIndex = currentIndex;
      const endIndex = currentIndex + paragraph.length;
      
      chunks.push({
        id: `chunk-${chunkId++}`,
        content: paragraph.trim(),
        startIndex,
        endIndex,
        type: detectChunkType(paragraph),
        metadata: {}
      });
    }
    currentIndex += paragraph.length + 2; // +2 for the double newline
  });

  return chunks;
};

const detectChunkType = (text: string): DocumentChunk['type'] => {
  const trimmed = text.trim();
  
  if (/^#{1,6}\s/.test(trimmed) || /^[A-Z][^.!?]*:?\s*$/.test(trimmed)) {
    return 'heading';
  }
  if (/^\s*[-*+]\s/.test(trimmed) || /^\s*\d+\.\s/.test(trimmed)) {
    return 'list';
  }
  if (/\|.*\|/.test(trimmed) || /^\s*\+[-=+]+\+/.test(trimmed)) {
    return 'table';
  }
  
  return 'paragraph';
};

const countWords = (text: string): number => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};

const detectLanguage = (text: string): string => {
  // Simple language detection - in production use a proper library
  const sample = text.toLowerCase().substring(0, 1000);
  
  if (/\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/.test(sample)) {
    return 'en';
  }
  if (/\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/.test(sample)) {
    return 'fr';
  }
  if (/\b(der|die|das|und|oder|aber|in|auf|zu|für|von|mit|durch)\b/.test(sample)) {
    return 'de';
  }
  
  return 'unknown';
};

const createErrorDocument = (fileName: string, type: string, error: any): ProcessedDocument => {
  const errorMessage = `Error processing document "${fileName}": ${error.message || 'Unknown error occurred'}`;
  
  return {
    fileName,
    content: errorMessage,
    type,
    metadata: {
      wordCount: 0,
      characterCount: errorMessage.length
    },
    chunks: [{
      id: 'error-chunk',
      content: errorMessage,
      startIndex: 0,
      endIndex: errorMessage.length,
      type: 'paragraph'
    }]
  };
};

const createFallbackPDFDocument = (fileName: string): ProcessedDocument => {
  const content = `ERROR: Unable to process PDF document "${fileName}"

The document could not be read properly. This may be due to:
- Encrypted or password-protected PDF
- Corrupted file format
- Unsupported PDF version
- Network issues during upload

Please try:
1. Re-uploading the document
2. Ensuring the PDF is not password-protected
3. Converting to a different format if possible

If the issue persists, the document may contain complex formatting that requires manual review.`;

  const chunks = createTextChunks(content);
  
  return {
    fileName,
    content,
    type: 'application/pdf',
    metadata: {
      pageCount: 0,
      wordCount: countWords(content),
      characterCount: content.length,
      title: 'Processing Error',
      author: 'System',
      language: 'en'
    },
    chunks
  };
};


export const searchDocumentContent = (documents: ProcessedDocument[], query: string): DocumentChunk[] => {
  const results: DocumentChunk[] = [];
  const queryLower = query.toLowerCase();
  
  documents.forEach(doc => {
    doc.chunks.forEach(chunk => {
      if (chunk.content.toLowerCase().includes(queryLower)) {
        results.push({
          ...chunk,
          metadata: {
            ...chunk.metadata,
            fileName: doc.fileName,
            relevanceScore: calculateRelevanceScore(chunk.content, query)
          }
        });
      }
    });
  });
  
  return results.sort((a, b) => (b.metadata?.relevanceScore || 0) - (a.metadata?.relevanceScore || 0));
};

const calculateRelevanceScore = (content: string, query: string): number => {
  const contentLower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);
  
  let score = 0;
  queryWords.forEach(word => {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
    score += matches;
  });
  
  return score / content.length * 1000; // Normalize by content length
};