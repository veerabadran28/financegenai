/**
 * Document Processor - Backend Integration
 * All document processing now happens on the backend with Docling
 * No more client-side PDF.js processing
 */

import { FileAttachment, ProcessedDocument } from '../types';
import { mcpClient } from '../services/mcpClient';

/**
 * Process documents using backend Docling service
 * Supports: PDF, DOCX, PPTX, XLSX, Images (with OCR), HTML, TXT
 */
export const processDocuments = async (
  files: FileAttachment[]
): Promise<ProcessedDocument[]> => {
  const processedDocs: ProcessedDocument[] = [];

  for (const fileAttachment of files) {
    try {
      console.log(`Processing document via backend: ${fileAttachment.name}`);

      // Fetch the file blob from the URL
      const response = await fetch(fileAttachment.url);
      const blob = await response.blob();

      // Create File object from blob
      const file = new File([blob], fileAttachment.name, { type: fileAttachment.type });

      // Send to backend for processing
      const result = await mcpClient.processDocument(file);

      if (result.success && result.data) {
        // Get full document data including tables
        const fullDataResult = await mcpClient.getDocumentFullData(result.data.documentId);

        if (fullDataResult.success && fullDataResult.data) {
          const fullData = fullDataResult.data;

          // Convert to ProcessedDocument format
          const processedDoc: ProcessedDocument = {
            id: fullData.id || result.data.documentId,
            fileName: fullData.fileName || fileAttachment.name,
            content: fullData.content || '',
            type: fullData.type || fileAttachment.type,
            metadata: {
              pageCount: fullData.metadata?.pageCount,
              wordCount: fullData.metadata?.wordCount || 0,
              characterCount: fullData.metadata?.characterCount || 0,
              language: fullData.metadata?.language,
              title: fullData.metadata?.title,
              author: fullData.metadata?.author
            },
            chunks: fullData.chunks || [],
            tables: fullData.tables || [],
            layout: fullData.layout,
            processor: fullData.processor,
            processedAt: fullData.processedAt
          };

          processedDocs.push(processedDoc);

          console.log(`✅ Successfully processed: ${fileAttachment.name}`);
          console.log(`   Processor: ${processedDoc.processor}`);
          console.log(`   Tables extracted: ${processedDoc.tables?.length || 0}`);
          console.log(`   Chunks created: ${processedDoc.chunks.length}`);
        } else {
          // Fallback if full data retrieval fails
          const errorDoc = createErrorDocument(
            fileAttachment.name,
            fileAttachment.type,
            'Failed to retrieve full document data'
          );
          processedDocs.push(errorDoc);
        }
      } else {
        // Processing failed
        const errorDoc = createErrorDocument(
          fileAttachment.name,
          fileAttachment.type,
          result.error || 'Unknown processing error'
        );
        processedDocs.push(errorDoc);
      }
    } catch (error) {
      console.error(`Error processing file ${fileAttachment.name}:`, error);

      const errorDoc = createErrorDocument(
        fileAttachment.name,
        fileAttachment.type,
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
      processedDocs.push(errorDoc);
    }
  }

  return processedDocs;
};

/**
 * Create error document when processing fails
 */
function createErrorDocument(
  fileName: string,
  type: string,
  errorMessage: string
): ProcessedDocument {
  const errorContent = `❌ Document Processing Error

File: ${fileName}
Error: ${errorMessage}

This document could not be processed. Please try:
1. Re-uploading the document
2. Ensuring the file is not corrupted or password-protected
3. Converting to a different format if possible

If the issue persists, contact support.`;

  return {
    id: `error-${Date.now()}-${Math.random()}`,
    fileName,
    content: errorContent,
    type,
    metadata: {
      wordCount: 0,
      characterCount: errorContent.length
    },
    chunks: [
      {
        id: 'error-chunk',
        content: errorContent,
        startIndex: 0,
        endIndex: errorContent.length,
        type: 'paragraph'
      }
    ],
    processor: 'error'
  };
}

/**
 * Search document content for specific query
 * Uses the enhanced chunks with table support
 */
export const searchDocumentContent = (
  documents: ProcessedDocument[],
  query: string
): any[] => {
  const results: any[] = [];
  const queryLower = query.toLowerCase();

  documents.forEach(doc => {
    // Search in chunks
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

    // Also search in extracted tables
    if (doc.tables && doc.tables.length > 0) {
      doc.tables.forEach(table => {
        // Search in table markdown
        if (table.markdown.toLowerCase().includes(queryLower)) {
          results.push({
            id: `table-${table.id}`,
            content: table.markdown,
            startIndex: 0,
            endIndex: table.markdown.length,
            type: 'table',
            metadata: {
              fileName: doc.fileName,
              hasTable: true,
              tableId: table.id,
              tableTitle: table.title,
              pageNumber: table.pageNumber,
              relevanceScore: calculateRelevanceScore(table.markdown, query)
            }
          });
        }
      });
    }
  });

  // Sort by relevance score
  return results.sort((a, b) =>
    (b.metadata?.relevanceScore || 0) - (a.metadata?.relevanceScore || 0)
  );
};

/**
 * Calculate relevance score for content matching
 */
function calculateRelevanceScore(content: string, query: string): number {
  const contentLower = content.toLowerCase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  let score = 0;
  queryWords.forEach(word => {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
    score += matches;
  });

  // Normalize by content length
  return score / content.length * 1000;
}
