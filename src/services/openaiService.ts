import OpenAI from 'openai';
import { ProcessedDocument, DocumentChunk, searchDocumentContent } from '../utils/documentProcessor';
import { Message } from '../types';
import { DynamicDiagramGenerator } from './diagramGenerator';

// Validate API key on initialization
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

if (!apiKey) {
  console.error('❌ CRITICAL: VITE_OPENAI_API_KEY is not set in .env file');
} else if (!apiKey.startsWith('sk-')) {
  console.error('❌ CRITICAL: Invalid API key format. Must start with "sk-"');
} else if (apiKey.length < 40) {
  console.error('❌ CRITICAL: API key appears incomplete or invalid');
} else {
  console.log('✅ OpenAI API key loaded successfully');
}

const openai = new OpenAI({
  apiKey: apiKey || 'invalid-key',
  dangerouslyAllowBrowser: true
});

export interface ChatResponse {
  content: string;
  needsDiagram: boolean;
  diagramType?: 'flowchart' | 'process' | 'diagram' | 'organizational' | 'timeline' | 'bar' | 'pie' | 'line' | 'table' | 'mermaid';
  diagramTitle?: string;
  confidence: number;
  sources: DocumentSource[];
  analysisType: 'summary' | 'analysis' | 'comparison' | 'extraction' | 'recommendation';
}

export interface DocumentSource {
  fileName: string;
  chunkId: string;
  relevance: number;
  excerpt: string;
}

export const analyzeDocumentWithOpenAI = async (
  question: string,
  documents: ProcessedDocument[],
  conversationHistory: Message[],
  config: { temperature: number; maxTokens: number; modelName: string }
): Promise<ChatResponse> => {
  try {
    // Check if OpenAI is configured
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('OpenAI API key is not configured properly. Please check your .env file.');
    }

    console.log('✅ OpenAI API key found, processing request...');

    // Perform semantic search to find relevant content
    const relevantChunks = searchDocumentContent(documents, question);
    const topChunks = relevantChunks.slice(0, 10); // Use top 10 most relevant chunks

    // Build comprehensive context
    const documentContext = buildDocumentContext(documents, topChunks);
    const analysisType = determineAnalysisType(question);

    const hasDocuments = documents.length > 0 && documents.some(d => d.content && !d.content.includes('ERROR:'));
    const systemPrompt = createChatGPTSystemPrompt(hasDocuments);
    const messages = buildConversationMessages(conversationHistory, question, hasDocuments ? documentContext : '');

    console.log('📤 Sending request to OpenAI with context and conversation history');
    console.log('📊 Document chunks:', topChunks.length, 'Context length:', documentContext.length);
    console.log('📝 Total messages:', messages.length + 1, 'Max tokens:', config.maxTokens);

    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const totalChars = systemPrompt.length + messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const estimatedTokens = Math.ceil(totalChars / 4);
    console.log('🔢 Estimated input tokens:', estimatedTokens);

    if (estimatedTokens > 100000) {
      console.warn('⚠️ Warning: Input is very large, this might cause issues');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
    });

    console.log('✅ Received response from OpenAI');

    const content = response.choices[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    
    // Analyze response for diagram needs
    const diagramAnalysis = analyzeDiagramNeeds(question, content);
    
    // Extract sources and calculate confidence
    const sources = extractSources(topChunks, documents);
    const confidence = calculateConfidence(content, sources, documents, diagramAnalysis.needsDiagram);

    // Clean content and prepare final response
    let cleanContent = content;
    if (content.includes('DIAGRAM_NEEDED')) {
      const diagramMatch = content.match(/DIAGRAM_NEEDED\s+(\w+)\s+(.+?)(?:\n|$)/);
      if (diagramMatch) {
        cleanContent = content.replace(/DIAGRAM_NEEDED\s+\w+\s+.+?(?:\n|$)/, '').trim();

        // If content is mostly empty after cleaning, provide a better response
        if (cleanContent.length < 50) {
          cleanContent = generateChartResponse(diagramAnalysis.diagramType, question);
        }
      }
    } else if (diagramAnalysis.needsDiagram) {
      // Generate proper response for chart requests
      cleanContent = generateChartResponse(diagramAnalysis.diagramType, question);
    }

    // Extract dynamic data from the AI response for chart rendering
    const dynamicData = diagramAnalysis.needsDiagram
      ? extractChartDataFromResponse(content, diagramAnalysis.diagramType, diagramAnalysis.diagramTitle)
      : undefined;

    return {
      content: cleanContent,
      needsDiagram: diagramAnalysis.needsDiagram,
      diagramType: diagramAnalysis.diagramType,
      diagramTitle: diagramAnalysis.diagramTitle,
      confidence,
      sources,
      analysisType,
      dynamicData
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return handleAPIError(error);
  }
};

export const analyzeDocumentWithOpenAIStreaming = async (
  question: string,
  documents: ProcessedDocument[],
  conversationHistory: Message[],
  config: { temperature: number; maxTokens: number; modelName: string },
  onChunk: (chunk: string) => void
): Promise<ChatResponse> => {
  try {
    // Perform semantic search to find relevant content
    const relevantChunks = searchDocumentContent(documents, question);
    const topChunks = relevantChunks.slice(0, 10); // Use top 10 most relevant chunks

    // Build comprehensive context
    const documentContext = buildDocumentContext(documents, topChunks);
    const analysisType = determineAnalysisType(question);

    const hasDocuments = documents.length > 0 && documents.some(d => d.content && !d.content.includes('ERROR:'));
    const systemPrompt = createChatGPTSystemPrompt(hasDocuments);
    const messages = buildConversationMessages(conversationHistory, question, hasDocuments ? documentContext : '');

    console.log('Sending request to OpenAI with context and conversation history');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      stream: true,
    });

    let fullContent = '';
    
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) {
        fullContent += delta;
        onChunk(delta);
      }
    }

    if (!fullContent) {
      fullContent = 'I apologize, but I could not generate a response. Please try again.';
    }
    
    // Analyze response for diagram needs
    const diagramAnalysis = analyzeDiagramNeeds(question, fullContent);
    
    // Extract sources and calculate confidence
    const sources = extractSources(topChunks, documents);
    const confidence = calculateConfidence(fullContent, sources, documents, diagramAnalysis.needsDiagram);

    // Clean content and prepare final response
    let cleanContent = fullContent;
    if (fullContent.includes('DIAGRAM_NEEDED')) {
      const diagramMatch = fullContent.match(/DIAGRAM_NEEDED\s+(\w+)\s+(.+?)(?:\n|$)/);
      if (diagramMatch) {
        cleanContent = fullContent.replace(/DIAGRAM_NEEDED\s+\w+\s+.+?(?:\n|$)/g, '').trim();

        // If content is mostly empty after cleaning, provide a better response
        if (cleanContent.length < 50) {
          cleanContent = generateChartResponse(diagramAnalysis.diagramType, question);
        }
      }
    } else if (diagramAnalysis.needsDiagram) {
      // Generate proper response for chart requests
      cleanContent = generateChartResponse(diagramAnalysis.diagramType, question);
    }

    // Extract dynamic data from the AI response for chart rendering
    const dynamicData = diagramAnalysis.needsDiagram
      ? extractChartDataFromResponse(fullContent, diagramAnalysis.diagramType, diagramAnalysis.diagramTitle)
      : undefined;

    return {
      content: cleanContent,
      needsDiagram: diagramAnalysis.needsDiagram,
      diagramType: diagramAnalysis.diagramType,
      diagramTitle: diagramAnalysis.diagramTitle,
      confidence,
      sources,
      analysisType,
      dynamicData
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    return handleAPIError(error);
  }
};

const buildDocumentContext = (documents: ProcessedDocument[], relevantChunks: DocumentChunk[]): string => {
  let context = '';
  
  // Add document content directly
  context += '=== UPLOADED DOCUMENTS ===\n\n';
  documents.forEach(doc => {
    context += `--- ${doc.fileName} ---\n`;
    if (doc.content && !doc.content.includes('ERROR:')) {
      // Include full content for better analysis
      context += doc.content + '\n\n';
    } else {
      context += 'Document could not be processed properly.\n\n';
    }
  });

  // Only add relevant chunks if we have many documents
  if (documents.length > 3 && relevantChunks.length > 0) {
    context += '=== MOST RELEVANT SECTIONS ===\n';
    relevantChunks.slice(0, 5).forEach((chunk, index) => {
      const doc = documents.find(d => d.chunks.some(c => c.id === chunk.id));
      if (doc) {
        context += `\n--- Relevant section ${index + 1} (from ${doc.fileName}) ---\n`;
        context += chunk.content + '\n';
      }
    });
  }

  return context;
};

const determineAnalysisType = (question: string): ChatResponse['analysisType'] => {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('summary') || questionLower.includes('summarize') || questionLower.includes('overview')) {
    return 'summary';
  }
  if (questionLower.includes('compare') || questionLower.includes('difference') || questionLower.includes('versus')) {
    return 'comparison';
  }
  if (questionLower.includes('recommend') || questionLower.includes('suggest') || questionLower.includes('should')) {
    return 'recommendation';
  }
  if (questionLower.includes('extract') || questionLower.includes('find') || questionLower.includes('list')) {
    return 'extraction';
  }
  
  return 'analysis';
};

const createChatGPTSystemPrompt = (hasDocuments: boolean): string => {
  if (!hasDocuments) {
    return `You are an intelligent AI assistant similar to ChatGPT with advanced capabilities in analysis, visualization, and code generation.

KEY CAPABILITIES:
1. **General Knowledge**: Answer any question on any topic
2. **Code Generation**: Write clean, production-ready code in any programming language
3. **Data Visualization**: Create charts with realistic sample data when requested
4. **Problem Solving**: Help users solve technical and non-technical problems
5. **Conversational**: Maintain natural, helpful conversations

**WHEN CREATING CHARTS/VISUALIZATIONS WITHOUT DOCUMENTS:**
- Generate realistic, contextually appropriate sample data
- Use meaningful labels and values that match the user's request
- START your response with: "DIAGRAM_NEEDED [type] [descriptive-title]"
- Then create a markdown table with the data

Example for "show me a bar chart of quarterly sales":
DIAGRAM_NEEDED bar Quarterly-Sales-Performance

Here's a sample quarterly sales breakdown:

| Quarter | Sales ($) | Target ($) |
|---------|----------|------------|
| Q1 2024 | 245000 | 230000 |
| Q2 2024 | 278000 | 250000 |
| Q3 2024 | 312000 | 280000 |
| Q4 2024 | 298000 | 290000 |

This shows strong performance with sales exceeding targets in most quarters.

**WHEN GENERATING CODE:**
- Provide complete, working code with proper imports
- Include helpful comments and best practices
- Format code cleanly with proper indentation
- Explain what the code does after showing it

Be helpful, accurate, and conversational like ChatGPT.`;
  }

  return `You are an intelligent document analysis assistant with the ability to extract, analyze, and visualize data from uploaded documents.

CRITICAL INSTRUCTIONS:
- You have FULL ACCESS to all uploaded document content
- ALWAYS extract ACTUAL DATA from the documents provided - NEVER generate fake or placeholder data
- When asked for charts/visualizations, analyze the document to find real numbers, dates, values, and data points
- Be conversational and natural like ChatGPT, but always use the actual document content

KEY CAPABILITIES:
1. **Data Extraction**: Extract real numbers, dates, amounts, percentages from documents
2. **Document Analysis**: Summarize, explain, and answer questions based on actual document content
3. **Chart Generation**: Create charts using ONLY data extracted from the provided documents
4. **Conversational**: Maintain context and chat naturally about the documents

WHEN CREATING CHARTS/VISUALIZATIONS:
- EXTRACT actual data from the document (numbers, dates, categories, amounts, etc.)
- IDENTIFY the data structure (what are the labels, what are the values)
- CREATE a markdown table with ONLY the data that should be visualized in the chart
- The table MUST have at least 2 columns: Category/Label in first column, Numeric Value(s) in remaining columns
- EXPLAIN what the data represents from the document
- START your response with: "DIAGRAM_NEEDED [type] [descriptive-title]"

Example format for creating charts (use actual data from documents, not these example values):
DIAGRAM_NEEDED bar Your-Chart-Title

Then create a table with actual data from the document:
| Category | Value 1 | Value 2 | Value 3 |
|----------|---------|---------|---------|
| Item A | [number] | [number] | [number] |
| Item B | [number] | [number] | [number] |
| Item C | [number] | [number] | [number] |

Notes:
- Use 2+ columns for multiple data series in bar charts
- First column is always the category/label
- All other columns should be numeric values
- Table headers become the legend labels

SUPPORTED DIAGRAM TYPES:
- bar: Bar charts (for comparing values)
- pie: Pie charts (for showing proportions)
- line: Line charts (for trends over time)
- table: Data tables (for structured data)
- flowchart: Process flowcharts
- timeline: Timeline visualizations
- mermaid: Complex diagrams

REMEMBER:
- NEVER make up data - only use what's in the documents
- If no suitable data for a chart exists, explain what you found and suggest alternatives
- Always reference specific details from the actual documents
- Be accurate and helpful`;
};

const buildConversationMessages = (conversationHistory: Message[], currentQuestion: string, documentContext: string) => {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

  const hasDocuments = documentContext.trim().length > 0;
  const isFirstMessage = conversationHistory.length === 0;

  if (hasDocuments) {
    // DOCUMENT MODE: Include document context
    if (isFirstMessage) {
      // First message: Send full document context
      messages.push({
        role: 'user',
        content: `Here are my uploaded documents:\n\n${documentContext}`
      });
      messages.push({
        role: 'assistant',
        content: "I can see your uploaded documents and I'm ready to help you with any questions about them. What would you like to know?"
      });
    } else {
      // Subsequent messages: Only send document reference if needed
      const hasDocumentInHistory = conversationHistory.some(msg =>
        msg.content.includes('uploaded documents') || msg.content.includes('document analysis')
      );

      if (!hasDocumentInHistory) {
        // Edge case: History exists but no document context was provided
        messages.push({
          role: 'user',
          content: `Context: I have uploaded documents that we're analyzing. Here's a brief overview:\n${documentContext.substring(0, 1000)}...`
        });
        messages.push({
          role: 'assistant',
          content: "I understand. I'll reference the documents we discussed earlier."
        });
      }
    }
  } else {
    // GENERAL MODE: No documents, just conversational AI like ChatGPT
    if (isFirstMessage) {
      messages.push({
        role: 'assistant',
        content: "Hello! I'm your AI assistant. I can help with questions, generate code, create visualizations with sample data, and more. What can I help you with?"
      });
    }
  }

  // Add recent conversation history (last 10 messages to stay within token limits)
  const recentHistory = conversationHistory.slice(-10);
  recentHistory.forEach(msg => {
    if (msg.type === 'user') {
      messages.push({ role: 'user', content: msg.content });
    } else {
      // Clean assistant content (remove metadata formatting)
      let cleanContent = msg.content;
      if (cleanContent.includes('DIAGRAM_NEEDED')) {
        cleanContent = cleanContent.replace(/DIAGRAM_NEEDED\s+\w+\s+.+?(?:\n|$)/, '').trim();
      }
      messages.push({ role: 'assistant', content: cleanContent });
    }
  });

  // Add current question
  messages.push({ role: 'user', content: currentQuestion });

  return messages;
};

const analyzeDiagramNeeds = (question: string, content: string) => {
  const questionLower = question.toLowerCase();
  const contentLower = content.toLowerCase();
  
  const needsDiagram = content.includes('DIAGRAM_NEEDED') || 
                      questionLower.includes('bar chart') ||
                      questionLower.includes('pie chart') ||
                      questionLower.includes('line chart') ||
                      questionLower.includes('table') ||
                      questionLower.includes('mermaid') ||
                      questionLower.includes('chart') ||
                      questionLower.includes('graph') ||
                      questionLower.includes('flowchart') ||
                      questionLower.includes('diagram') ||
                      questionLower.includes('process flow') ||
                      questionLower.includes('workflow') ||
                      questionLower.includes('organizational chart') ||
                      questionLower.includes('timeline') ||
                      questionLower.includes('show me') ||
                      questionLower.includes('create a') ||
                      questionLower.includes('give me a') ||
                      questionLower.includes('make a') ||
                      questionLower.includes('draw a');

  let diagramType: ChatResponse['diagramType'] = 'flowchart';
  let diagramTitle = 'Generated Diagram';

  if (content.includes('DIAGRAM_NEEDED')) {
    const diagramMatch = content.match(/DIAGRAM_NEEDED\s+(\w+)\s+(.+?)(?:\n|$)/);
    if (diagramMatch) {
      diagramType = diagramMatch[1] as ChatResponse['diagramType'];
      diagramTitle = diagramMatch[2].trim();
    }
  } else if (needsDiagram) {
    // Auto-detect diagram type from question
    if (questionLower.includes('bar chart') || questionLower.includes('bar graph')) {
      diagramType = 'bar' as ChatResponse['diagramType'];
      diagramTitle = 'Bar Chart';
    } else if (questionLower.includes('pie chart') || questionLower.includes('pie graph')) {
      diagramType = 'pie' as ChatResponse['diagramType'];
      diagramTitle = 'Pie Chart';
    } else if (questionLower.includes('line chart') || questionLower.includes('line graph')) {
      diagramType = 'line' as ChatResponse['diagramType'];
      diagramTitle = 'Line Chart';
    } else if (questionLower.includes('table') || questionLower.includes('tabular')) {
      diagramType = 'table' as ChatResponse['diagramType'];
      diagramTitle = 'Data Table';
    } else if (questionLower.includes('mermaid')) {
      diagramType = 'mermaid' as ChatResponse['diagramType'];
      diagramTitle = 'Mermaid Diagram';
    } else if (questionLower.includes('organizational') || questionLower.includes('org chart')) {
      diagramType = 'organizational';
      diagramTitle = 'Organizational Structure';
    } else if (questionLower.includes('timeline') || questionLower.includes('schedule')) {
      diagramType = 'timeline';
      diagramTitle = 'Project Timeline';
    } else if (questionLower.includes('process') || questionLower.includes('workflow')) {
      diagramType = 'process';
      diagramTitle = 'Process Workflow';
    } else if (questionLower.includes('flowchart')) {
      diagramType = 'flowchart';
      diagramTitle = 'Decision Flowchart';
    } else {
      diagramType = 'diagram';
      diagramTitle = 'Concept Diagram';
    }
  }

  console.log('Diagram analysis:', { needsDiagram, diagramType, diagramTitle, question });
  return { needsDiagram, diagramType, diagramTitle };
};

const extractSources = (chunks: DocumentChunk[], documents: ProcessedDocument[]): DocumentSource[] => {
  return chunks.slice(0, 5).map(chunk => {
    const doc = documents.find(d => d.chunks.some(c => c.id === chunk.id));
    return {
      fileName: doc?.fileName || 'Unknown',
      chunkId: chunk.id,
      relevance: chunk.metadata?.relevanceScore || 0,
      excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : '')
    };
  });
};

const calculateConfidence = (content: string, sources: DocumentSource[], documents: ProcessedDocument[], isDiagramRequest: boolean): number => {
  let confidence = 0.5; // Base confidence
  
  // For chart/diagram requests, set high confidence
  if (isDiagramRequest) {
    confidence = 0.9; // Very high confidence for chart generation
    return Math.min(confidence, 0.95);
  }
  
  // Increase confidence based on number of sources
  confidence += Math.min(sources.length * 0.1, 0.3);
  
  // Increase confidence based on content length and detail
  if (content.length > 500) confidence += 0.1;
  if (content.length > 1000) confidence += 0.1;
  
  // Increase confidence if specific data or numbers are referenced
  if (/\d+%|\$\d+|\d+\.\d+/.test(content)) confidence += 0.1;
  
  // Cap at 0.95 to maintain realistic expectations
  return Math.min(confidence, 0.95);
};

const handleAPIError = (error: any): ChatResponse => {
  console.error('🔍 Analyzing error:', error);
  console.error('🔍 Error type:', typeof error);
  console.error('🔍 Error keys:', error ? Object.keys(error) : 'none');

  let errorMessage = '❌ **System Error**: I encountered an issue while processing your request.';
  let errorDetails = '';

  // Handle OpenAI SDK errors
  if (error?.status) {
    console.error('📋 API Status Code:', error.status);

    if (error.status === 401) {
      errorMessage = '🔑 **Authentication Failed**: Your OpenAI API key is invalid, expired, or revoked.\n\n**Solution:** Get a new API key from https://platform.openai.com/api-keys and update your `.env` file.';
    } else if (error.status === 429) {
      errorMessage = '⏱️ **Rate Limited**: Too many requests. Please wait a moment and try again.';
    } else if (error.status === 402 || error.status === 403) {
      errorMessage = '💳 **Payment Required**: Your OpenAI account has insufficient credits or billing issues.\n\n**Solution:** Add payment method at https://platform.openai.com/account/billing';
    } else if (error.status >= 500) {
      errorMessage = '🔧 **OpenAI Server Error**: OpenAI servers are experiencing issues. Please try again in a few moments.';
    } else {
      errorMessage = `❌ **API Error (${error.status})**: ${error.message || 'Unknown error'}`;
    }
  } else if (error instanceof Error) {
    errorDetails = error.message;
    console.error('📋 Error message:', errorDetails);

    if (errorDetails.includes('API key') || errorDetails.includes('Incorrect API key') || errorDetails.includes('401')) {
      errorMessage = '🔑 **Authentication Error**: Invalid or expired OpenAI API key.\n\n**Solution:** Update your API key in the `.env` file with a valid key from https://platform.openai.com/api-keys';
    } else if (errorDetails.includes('quota') || errorDetails.includes('insufficient_quota')) {
      errorMessage = '💳 **Quota Exceeded**: OpenAI API quota has been exceeded.\n\n**Solution:** Check billing at https://platform.openai.com/account/billing';
    } else if (errorDetails.includes('rate limit') || errorDetails.includes('429')) {
      errorMessage = '⏱️ **Rate Limited**: Too many requests. Please wait a moment and try again.';
    } else if (errorDetails.includes('network') || errorDetails.includes('fetch')) {
      errorMessage = '🌐 **Network Error**: Connection issue detected. Please check your internet connection.';
    } else if (errorDetails.includes('timeout')) {
      errorMessage = '⏰ **Timeout Error**: The request took too long. Please try again with a shorter document or simpler question.';
    } else {
      // Show actual error in development
      errorMessage = `❌ **Error**: ${errorDetails.substring(0, 200)}`;
    }
  }

  return {
    content: errorMessage + '\n\n💡 **Quick Troubleshooting:**\n1. Check browser console (F12) for detailed error logs\n2. Verify your OpenAI API key is valid and active\n3. Ensure you have sufficient OpenAI credits\n4. Try refreshing the page and attempting again',
    needsDiagram: false,
    confidence: 0,
    sources: [],
    analysisType: 'analysis'
  };
};

const generateChartResponse = (diagramType: string, question: string): string => {
  const questionLower = question.toLowerCase();
  
  // Generate contextual sample data based on chart type and question
  let sampleData = '';
  let description = '';
  
  if (diagramType === 'bar') {
    description = "I've created a professional bar chart with sample data";
    
    if (questionLower.includes('sales')) {
      sampleData = `
**Sample Sales Data:**

| Product | Sales ($) | Units |
|---------|-----------|-------|
| Product A | $45,000 | 150 |
| Product B | $62,000 | 210 |
| Product C | $38,000 | 95 |
| Product D | $71,000 | 240 |
| Product E | $55,000 | 180 |

The bar chart visualizes this data with proper scaling, axes, and labels.`;
    } else if (questionLower.includes('revenue') || questionLower.includes('financial')) {
      sampleData = `
**Sample Revenue Data:**

| Quarter | Revenue ($) | Growth |
|---------|-------------|--------|
| Q1 2024 | $125,000 | +8% |
| Q2 2024 | $142,000 | +12% |
| Q3 2024 | $138,000 | +15% |
| Q4 2024 | $156,000 | +18% |

The chart shows quarterly performance with clear visual comparison.`;
    } else if (questionLower.includes('performance') || questionLower.includes('metric')) {
      sampleData = `
**Sample Performance Metrics:**

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Response Time | 250ms | 200ms | ⚠️ |
| Uptime | 99.8% | 99.9% | ✅ |
| Error Rate | 0.1% | 0.05% | ⚠️ |
| Throughput | 1000/s | 1200/s | ✅ |

Visual bars make it easy to compare current vs target performance.`;
    } else {
      sampleData = `
**Sample Test Data:**

| Category | Value | Percentage |
|----------|-------|------------|
| Category A | 45 | 25% |
| Category B | 62 | 35% |
| Category C | 38 | 21% |
| Category D | 35 | 19% |

The bar chart displays this data with proper proportional bars and clear labeling.`;
    }
  } else if (diagramType === 'pie') {
    description = "I've created a circular pie chart with sample data";
    sampleData = `
**Sample Distribution Data:**

| Segment | Value | Percentage |
|---------|-------|------------|
| Segment A | 35 | 35% |
| Segment B | 25 | 25% |
| Segment C | 20 | 20% |
| Segment D | 20 | 20% |

The pie chart shows these proportions as colored slices with percentage labels.`;
  } else if (diagramType === 'line') {
    description = "I've created a line chart showing trends over time";
    sampleData = `
**Sample Trend Data:**

| Period | Value | Change |
|--------|-------|--------|
| Jan | 45 | - |
| Feb | 52 | +7 |
| Mar | 48 | -4 |
| Apr | 65 | +17 |
| May | 71 | +6 |

The line chart connects these data points to show the trend clearly.`;
  } else if (diagramType === 'table') {
    description = "I've created a structured data table";
    sampleData = `
**Sample Tabular Data:**

| Item | Category | Value | Status |
|------|----------|-------|--------|
| Item A | Type 1 | 125 | Active |
| Item B | Type 2 | 210 | Active |
| Item C | Type 1 | 85 | Inactive |
| Item D | Type 3 | 175 | Pending |

The table organizes this information in a clear, sortable format.`;
  } else {
    description = `I've created a ${diagramType} diagram`;
    sampleData = `The ${diagramType} shows the relationships and flow between different elements based on your request.`;
  }
  
  return `${description}. ${sampleData}

💡 **You can customize this chart by:**
- Clicking "Edit" to modify data, labels, and styling
- Adding or removing data points
- Changing colors and formatting
- Exporting in PNG, JPEG, or SVG formats`;
};

export const generateDiagramWithOpenAI = async (
  content: string,
  diagramType: string,
  title: string
): Promise<any> => {
  console.log('Generating diagram:', { diagramType, title, content: content.substring(0, 100) });
  
  try {
    // First try AI generation
    try {
      const prompt = createDiagramPrompt(content, diagramType, title);
      console.log('Trying AI generation...');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert diagram generator. Analyze the content and create appropriate diagrams. Return ONLY valid JSON with nodes and connections arrays.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      let jsonContent = response.choices[0]?.message?.content || '';
      console.log('AI response received:', jsonContent.substring(0, 200));
      
      // Clean and parse AI response
      jsonContent = jsonContent.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      if (jsonContent) {
        const aiDiagram = JSON.parse(jsonContent);
        if (aiDiagram.nodes && Array.isArray(aiDiagram.nodes)) {
          console.log('AI generation successful');
          return {
            id: crypto.randomUUID(),
            type: diagramType,
            title: aiDiagram.title || title,
            nodes: aiDiagram.nodes,
            connections: aiDiagram.connections || []
          };
        }
      }
    } catch (aiError) {
      console.log('AI generation failed, using dynamic generator:', aiError);
    }

    // Fallback to dynamic generation
    console.log('Using dynamic diagram generator...');
    const dynamicDiagram = DynamicDiagramGenerator.generateDiagram({
      type: diagramType,
      title,
      content,
      context: content
    });
    
    console.log('Dynamic generation successful:', dynamicDiagram);
    return dynamicDiagram;
  } catch (error) {
    console.error('Diagram generation error:', error);
    
    // Final fallback to dynamic generator
    console.log('Using final fallback dynamic generation...');
    return DynamicDiagramGenerator.generateDiagram({
      type: diagramType,
      title: title || 'Generated Diagram',
      content: content || '',
      context: content || ''
    });
  }
};

const createDiagramPrompt = (content: string, diagramType: string, title: string): string => {
  const basePrompt = `Create a professional ${diagramType} based on this request: "${content.substring(0, 1000)}"

Generate a JSON object with this EXACT structure:
{
  "title": "${title}",
  "nodes": [
    {"id": "1", "x": 100, "y": 50, "width": 180, "height": 80, "text": "Sample Data", "type": "data"},
    {"id": "2", "x": 300, "y": 50, "width": 180, "height": 80, "text": "Value: 30", "type": "bar"}
  ],
  "connections": [
    {"id": "c1", "from": "1", "to": "2", "label": ""}
  ]
}`;

  const typeSpecificInstructions = {
    'bar': `
Requirements for bar chart:
- Use node types: "bar", "axis", "data"
- Create vertical bars with heights representing values
- Position bars from bottom up (y-coordinate decreases with value)
- Include x-axis and y-axis lines
- Add category labels below bars and value labels on y-axis
- Bars should be positioned at y = (400 - value*5) for proper scaling`,
    
    'pie': `
Requirements for pie chart:
- Use node types: "slice", "label", "percentage"
- Create circular segments representing data portions
- Position slices around a center point
- Include percentage labels and category names
- Use different colors for each slice`,
    
    'line': `
Requirements for line chart:
- Use node types: "point", "axis", "label"
- Create data points connected by lines
- Position points to show trends over time
- Include axis labels and value markers
- Show clear progression or trend`,
    
    'table': `
Requirements for table:
- Use node types: "header", "cell", "row"
- Create structured grid layout
- Position cells in rows and columns
- Include clear headers and data cells
- Maintain consistent spacing and alignment`,
    
    'mermaid': `
Requirements for mermaid diagram:
- Use node types based on mermaid syntax
- Create flowchart, sequence, or other mermaid types
- Position nodes according to mermaid conventions
- Include proper mermaid syntax in text fields
- Support various mermaid diagram types`,
    
    flowchart: `
Requirements for flowchart:
- Use node types: "start", "process", "decision", "end"
- Create 6-10 nodes showing decision flow
- Add "Yes/No" labels to decision branches
- Position nodes vertically with 120px spacing`,
    
    process: `
Requirements for process diagram:
- Use node types: "start", "process", "end"
- Create 5-8 sequential process steps
- Show clear workflow progression
- Include subprocess details where relevant`,
    
    organizational: `
Requirements for organizational chart:
- Use node types: "executive", "manager", "employee"
- Create hierarchical structure
- Position nodes to show reporting relationships
- Include role titles and departments`,
    
    timeline: `
Requirements for timeline:
- Use node types: "milestone", "phase", "deliverable"
- Arrange nodes chronologically
- Include dates and durations
- Show dependencies between phases`
  };

  return basePrompt + (typeSpecificInstructions[diagramType as keyof typeof typeSpecificInstructions] || typeSpecificInstructions.flowchart);
};

const generateEnhancedFallbackDiagram = (title: string, type: string, content: string) => {
  // Create more sophisticated fallback diagrams based on content analysis
  const contentLower = content.toLowerCase();
  
  if (type === 'bar') {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      nodes: [
        // Axes
        { id: 'y-axis', x: 40, y: 100, width: 3, height: 300, text: '', type: 'axis' },
        { id: 'x-axis', x: 40, y: 400, width: 400, height: 3, text: '', type: 'axis' },
        
        // Y-axis labels
        { id: 'y-50', x: 10, y: 150, width: 30, height: 20, text: '50', type: 'data' },
        { id: 'y-40', x: 10, y: 190, width: 30, height: 20, text: '40', type: 'data' },
        { id: 'y-30', x: 10, y: 230, width: 30, height: 20, text: '30', type: 'data' },
        { id: 'y-20', x: 10, y: 270, width: 30, height: 20, text: '20', type: 'data' },
        { id: 'y-10', x: 10, y: 310, width: 30, height: 20, text: '10', type: 'data' },
        { id: 'y-0', x: 15, y: 380, width: 30, height: 20, text: '0', type: 'data' },
        
        // Bars
        { id: 'bar-a', x: 80, y: 250, width: 50, height: 150, text: '30', type: 'bar' },
        { id: 'bar-b', x: 160, y: 300, width: 50, height: 100, text: '20', type: 'bar' },
        { id: 'bar-c', x: 240, y: 150, width: 50, height: 250, text: '50', type: 'bar' },
        { id: 'bar-d', x: 320, y: 200, width: 50, height: 200, text: '40', type: 'bar' },
        
        // Category labels
        { id: 'label-a', x: 80, y: 420, width: 50, height: 25, text: 'Sales', type: 'data' },
        { id: 'label-b', x: 160, y: 420, width: 50, height: 25, text: 'Marketing', type: 'data' },
        { id: 'label-c', x: 240, y: 420, width: 50, height: 25, text: 'Support', type: 'data' },
        { id: 'label-d', x: 320, y: 420, width: 50, height: 25, text: 'Dev', type: 'data' }
      ],
      connections: []
    };
  }
  
  if (type === 'pie') {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      nodes: [
        { id: '1', x: 150, y: 100, width: 100, height: 100, text: 'Slice A\n30%', type: 'slice' },
        { id: '2', x: 250, y: 150, width: 80, height: 80, text: 'Slice B\n25%', type: 'slice' },
        { id: '3', x: 200, y: 250, width: 90, height: 90, text: 'Slice C\n35%', type: 'slice' },
        { id: '4', x: 100, y: 200, width: 70, height: 70, text: 'Slice D\n10%', type: 'slice' }
      ],
      connections: []
    };
  }
  
  if (type === 'table') {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      nodes: [
        { id: 'h1', x: 50, y: 50, width: 100, height: 40, text: 'Category', type: 'header' },
        { id: 'h2', x: 150, y: 50, width: 100, height: 40, text: 'Value', type: 'header' },
        { id: 'h3', x: 250, y: 50, width: 100, height: 40, text: 'Percentage', type: 'header' },
        { id: 'c1', x: 50, y: 90, width: 100, height: 30, text: 'Item A', type: 'cell' },
        { id: 'c2', x: 150, y: 90, width: 100, height: 30, text: '30', type: 'cell' },
        { id: 'c3', x: 250, y: 90, width: 100, height: 30, text: '25%', type: 'cell' },
        { id: 'c4', x: 50, y: 120, width: 100, height: 30, text: 'Item B', type: 'cell' },
        { id: 'c5', x: 150, y: 120, width: 100, height: 30, text: '45', type: 'cell' },
        { id: 'c6', x: 250, y: 120, width: 100, height: 30, text: '37.5%', type: 'cell' }
      ],
      connections: []
    };
  }
  
  if (type === 'organizational') {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      nodes: [
        { id: '1', x: 200, y: 50, width: 160, height: 70, text: 'Executive Team', type: 'executive' },
        { id: '2', x: 100, y: 170, width: 140, height: 70, text: 'Operations', type: 'manager' },
        { id: '3', x: 300, y: 170, width: 140, height: 70, text: 'Strategy', type: 'manager' },
        { id: '4', x: 50, y: 290, width: 120, height: 70, text: 'Team A', type: 'employee' },
        { id: '5', x: 170, y: 290, width: 120, height: 70, text: 'Team B', type: 'employee' }
      ],
      connections: [
        { id: 'c1', from: '1', to: '2' },
        { id: 'c2', from: '1', to: '3' },
        { id: 'c3', from: '2', to: '4' },
        { id: 'c4', from: '2', to: '5' }
      ]
    };
  }
  
  if (type === 'timeline') {
    return {
      id: crypto.randomUUID(),
      type,
      title,
      nodes: [
        { id: '1', x: 50, y: 100, width: 120, height: 60, text: 'Phase 1', type: 'milestone' },
        { id: '2', x: 200, y: 100, width: 120, height: 60, text: 'Phase 2', type: 'milestone' },
        { id: '3', x: 350, y: 100, width: 120, height: 60, text: 'Phase 3', type: 'milestone' },
        { id: '4', x: 500, y: 100, width: 120, height: 60, text: 'Completion', type: 'deliverable' }
      ],
      connections: [
        { id: 'c1', from: '1', to: '2', label: '3 months' },
        { id: 'c2', from: '2', to: '3', label: '6 months' },
        { id: 'c3', from: '3', to: '4', label: '2 months' }
      ]
    };
  }
  
  // Default enhanced flowchart
  return {
    id: crypto.randomUUID(),
    type,
    title,
    nodes: [
      { id: '1', x: 100, y: 50, width: 180, height: 80, text: 'Initialize Process', type: 'start' },
      { id: '2', x: 100, y: 170, width: 180, height: 80, text: 'Analyze Document Content', type: 'process' },
      { id: '3', x: 100, y: 290, width: 200, height: 80, text: 'Requirements Satisfied?', type: 'decision' },
      { id: '4', x: 350, y: 290, width: 160, height: 80, text: 'Refine Approach', type: 'process' },
      { id: '5', x: 100, y: 410, width: 180, height: 80, text: 'Implement Solution', type: 'process' },
      { id: '6', x: 100, y: 530, width: 180, height: 80, text: 'Process Complete', type: 'end' }
    ],
    connections: [
      { id: 'c1', from: '1', to: '2' },
      { id: 'c2', from: '2', to: '3' },
      { id: 'c3', from: '3', to: '4', label: 'No' },
      { id: 'c4', from: '4', to: '2' },
      { id: 'c5', from: '3', to: '5', label: 'Yes' },
      { id: 'c6', from: '5', to: '6' }
    ]
  };
};

/**
 * Extract chart data from AI response text
 * Looks for markdown tables and converts them into chart data
 */
const extractChartDataFromResponse = (responseText: string, chartType: string, chartTitle: string): any => {
  console.log('🔍 Extracting chart data from AI response...', chartType);

  // Look for markdown tables in the response
  const tableRegex = /\|([^\n]+)\|\n\|[-:\s|]+\|\n((?:\|[^\n]+\|\n?)+)/g;
  const tables = [];
  let match;

  while ((match = tableRegex.exec(responseText)) !== null) {
    const headers = match[1].split('|').map(h => h.trim()).filter(h => h);
    const rows = match[2].trim().split('\n').map(row =>
      row.split('|').map(cell => cell.trim()).filter(cell => cell)
    );

    tables.push({ headers, rows });
  }

  if (tables.length === 0) {
    console.log('⚠️ No tables found in response, returning null');
    return null;
  }

  // Use the first table with numeric data
  const dataTable = tables.find(table =>
    table.rows.some(row => row.some(cell => !isNaN(parseFloat(cell.replace(/[^0-9.-]/g, '')))))
  ) || tables[0];

  console.log('📊 Found data table:', dataTable);

  // Extract labels and values
  const labels: string[] = [];
  const values: number[] = [];
  const rawData: any[] = [];

  dataTable.rows.forEach(row => {
    if (row.length >= 2) {
      const label = row[0];
      const valueStr = row[1];

      // Try to extract number from the value
      const numMatch = valueStr.match(/[\d,]+\.?\d*/);
      if (numMatch) {
        const value = parseFloat(numMatch[0].replace(/,/g, ''));
        if (!isNaN(value)) {
          labels.push(label);
          values.push(value);
          rawData.push({ label, value, raw: row });
        }
      }
    }
  });

  if (labels.length === 0 || values.length === 0) {
    console.log('⚠️ No valid numeric data extracted');
    return null;
  }

  // Calculate statistics
  const total = values.reduce((sum, v) => sum + v, 0);
  const average = total / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);

  // Build chart data structure compatible with chart renderers
  const chartData = {
    chartType,
    title: chartTitle || 'Data Visualization',
    description: `Data extracted from document analysis`,
    xAxisKey: dataTable.headers[0]?.toLowerCase().replace(/\s+/g, '_') || 'category',
    // Format data for different chart types
    data: labels.map((label, i) => {
      // Create dynamic data point with the actual column names
      const dataPoint: any = {};

      // Use first column as the x-axis key (category/label)
      const xKey = dataTable.headers[0]?.toLowerCase().replace(/\s+/g, '_') || 'category';
      dataPoint[xKey] = label;

      // Use second column as the primary value
      const yKey = dataTable.headers[1]?.toLowerCase().replace(/\s+/g, '_') || 'value';
      dataPoint[yKey] = values[i];

      // Add any additional columns from the raw data
      if (rawData[i]?.raw) {
        rawData[i].raw.forEach((cellValue: string, colIndex: number) => {
          if (colIndex >= 2 && dataTable.headers[colIndex]) {
            const key = dataTable.headers[colIndex].toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
            // Try to parse as number
            const numMatch = cellValue.match(/[\d,]+\.?\d*/);
            if (numMatch) {
              const numValue = parseFloat(numMatch[0].replace(/,/g, ''));
              if (!isNaN(numValue)) {
                dataPoint[key] = numValue;
              } else {
                dataPoint[key] = cellValue;
              }
            } else {
              dataPoint[key] = cellValue;
            }
          }
        });
      }

      return dataPoint;
    }),
    summary: {
      total: Math.round(total),
      average: Math.round(average),
      maximum: max,
      minimum: min,
      count: values.length
    },
    tableData: {
      headers: dataTable.headers,
      rows: dataTable.rows
    },
    insights: [
      `Total of ${labels.length} data points analyzed`,
      `Highest value: ${labels[values.indexOf(max)]} (${max.toLocaleString()})`,
      `Lowest value: ${labels[values.indexOf(min)]} (${min.toLocaleString()})`,
      `Average value: ${Math.round(average).toLocaleString()}`
    ]
  };

  console.log('✅ Extracted chart data:', chartData);
  return chartData;
};