/**
 * Agentic Service - Uses MCP tools to handle user requests intelligently
 */

import { mcpClient } from './mcpClient';
import { ProcessedDocument } from '../utils/documentProcessor';
import { Message } from '../types';

export interface AgentResponse {
  content: string;
  needsDiagram: boolean;
  diagramType?: string;
  diagramTitle?: string;
  confidence: number;
  sources: any[];
  analysisType: string;
  toolsUsed: string[];
  dynamicData?: any;
}

export class IntelligentAgent {
  
  /**
   * Main agent entry point - analyzes request and routes to appropriate tools
   */
  static async processRequest(
    userRequest: string,
    documents: ProcessedDocument[],
    conversationHistory: Message[],
    config: any
  ): Promise<AgentResponse> {

    console.log('🤖 Agent analyzing request:', userRequest);
    console.log('📄 Documents available:', documents.map(d => d.fileName).join(', '));

    // Step 1: Analyze user intent
    const intent = this.analyzeUserIntent(userRequest);
    console.log('🎯 Detected intent:', intent.type, 'with confidence:', intent.confidence);
    
    // Step 2: Route to appropriate MCP tool or service
    try {
      // If no documents available, always use general_chat (like ChatGPT)
      const hasDocuments = documents.length > 0 && documents.some(d => d.content);

      if (!hasDocuments && intent.type !== 'general_chat') {
        console.log('📝 No documents available, routing to general chat mode');
        return await this.handleGeneralChat(userRequest, documents, conversationHistory, config);
      }

      switch (intent.type) {
        case 'chart_generation':
          return await this.handleChartGeneration(userRequest, intent, documents);

        case 'document_analysis':
          return await this.handleDocumentAnalysis(userRequest, documents, conversationHistory, config);

        case 'diagram_creation':
          return await this.handleDiagramCreation(userRequest, intent, documents);

        case 'data_extraction':
          return await this.handleDataExtraction(userRequest, documents, config);

        case 'general_chat':
          return await this.handleGeneralChat(userRequest, documents, conversationHistory, config);

        default:
          return await this.handleGeneralChat(userRequest, documents, conversationHistory, config);
      }
    } catch (error) {
      console.error('❌ Agent error:', error);
      return this.createErrorResponse(error);
    }
  }
  
  /**
   * Analyze user intent from their request
   */
  private static analyzeUserIntent(request: string): any {
    const requestLower = request.toLowerCase();

    // Code generation patterns (check first - highest priority for non-document queries)
    const codePatterns = ['write code', 'generate code', 'create code', 'code for', 'code to',
                         'python code', 'javascript code', 'java code', 'c++ code', 'sql code',
                         'function for', 'function to', 'script for', 'script to',
                         'program for', 'program to', 'algorithm for', 'algorithm to',
                         'fibonacci', 'factorial', 'sorting', 'searching', 'recursion',
                         'write a', 'create a', 'generate a', 'implement', 'build a',
                         'give me a', 'show me a', 'sample code', 'example code',
                         'code example', 'code snippet'];

    if (codePatterns.some(pattern => requestLower.includes(pattern))) {
      return {
        type: 'general_chat', // Route to general_chat for code generation
        subtype: 'code_generation',
        confidence: 0.98,
        keywords: codePatterns.filter(p => requestLower.includes(p))
      };
    }

    // Chart generation patterns
    const chartPatterns = {
      bar: ['bar chart', 'bar graph', 'column chart', 'vertical bars'],
      pie: ['pie chart', 'pie graph', 'donut chart', 'circular chart'],
      line: ['line chart', 'line graph', 'trend chart', 'time series'],
      table: ['table', 'tabular data', 'data table', 'grid'],
      scatter: ['scatter plot', 'scatter chart', 'xy chart']
    };

    // Check for specific chart requests
    for (const [chartType, patterns] of Object.entries(chartPatterns)) {
      if (patterns.some(pattern => requestLower.includes(pattern))) {
        return {
          type: 'chart_generation',
          chartType,
          confidence: 0.95,
          keywords: patterns.filter(p => requestLower.includes(p))
        };
      }
    }
    
    // General chart indicators
    if (requestLower.includes('chart') || requestLower.includes('graph') || 
        requestLower.includes('visualization') || requestLower.includes('plot')) {
      
      // Exclude diagram types from chart generation
      const diagramKeywords = ['flowchart', 'flow chart', 'process diagram', 'workflow', 
                              'organizational chart', 'org chart', 'timeline', 'sequence diagram'];
      if (diagramKeywords.some(keyword => requestLower.includes(keyword))) {
        // This should be handled as diagram creation, not chart generation
        const diagramType = diagramKeywords.find(keyword => requestLower.includes(keyword));
        return {
          type: 'diagram_creation',
          diagramType: this.mapDiagramType(diagramType),
          confidence: 0.95,
          keywords: [diagramType]
        };
      }
      
      return {
        type: 'chart_generation',
        chartType: 'auto', // Let system decide
        confidence: 0.85,
        keywords: ['chart', 'graph', 'visualization']
      };
    }
    
    // Diagram creation patterns
    const diagramPatterns = ['flowchart', 'flow chart', 'process diagram', 'workflow', 
                           'organizational chart', 'org chart', 'timeline', 'sequence diagram', 'diagram'];
    
    if (diagramPatterns.some(pattern => requestLower.includes(pattern))) {
      const diagramType = diagramPatterns.find(pattern => requestLower.includes(pattern));
      return {
        type: 'diagram_creation',
        diagramType: this.mapDiagramType(diagramType),
        confidence: 0.90,
        keywords: [diagramType]
      };
    }
    
    // General knowledge/question patterns (for questions without documents)
    const generalPatterns = ['what is', 'what are', 'how does', 'how do', 'how to', 'why',
                            'explain', 'tell me', 'can you', 'could you', 'help me',
                            'what\'s', 'how\'s', 'who is', 'who are', 'when', 'where'];

    // Check if it's a general question (without document-specific language)
    const documentSpecific = ['this document', 'the document', 'uploaded', 'my document',
                             'the file', 'this file', 'my file'];
    const hasDocumentReference = documentSpecific.some(pattern => requestLower.includes(pattern));

    if (!hasDocumentReference && generalPatterns.some(pattern => requestLower.includes(pattern))) {
      return {
        type: 'general_chat',
        subtype: 'question',
        confidence: 0.85,
        keywords: generalPatterns.filter(p => requestLower.includes(p))
      };
    }

    // Document analysis patterns (only if document context is implied)
    const analysisPatterns = ['analyze', 'summarize', 'compare'];

    if (analysisPatterns.some(pattern => requestLower.includes(pattern))) {
      return {
        type: 'document_analysis',
        analysisType: this.determineAnalysisType(requestLower),
        confidence: 0.80,
        keywords: analysisPatterns.filter(p => requestLower.includes(p))
      };
    }

    // Data extraction patterns (only for document-specific extractions)
    const extractionPatterns = ['extract', 'find all', 'search for'];

    if (extractionPatterns.some(pattern => requestLower.includes(pattern))) {
      return {
        type: 'data_extraction',
        confidence: 0.75,
        keywords: extractionPatterns.filter(p => requestLower.includes(p))
      };
    }
    
    // Default to general chat
    return {
      type: 'general_chat',
      confidence: 0.60,
      keywords: []
    };
  }
  
  /**
   * Handle chart generation using document content
   */
  private static async handleChartGeneration(
    request: string,
    intent: any,
    documents: ProcessedDocument[]
  ): Promise<AgentResponse> {

    console.log('📊 Generating chart from document content...');

    // Extract document content for analysis
    const documentContent = documents.length > 0
      ? documents.map(doc => `Document: ${doc.fileName}\n${doc.content || doc.content_preview || ''}`).join('\n\n')
      : '';

    // Use OpenAI to analyze document and generate chart
    const { analyzeDocumentWithOpenAI } = await import('./openaiService');

    try {
      const result = await analyzeDocumentWithOpenAI(
        request,
        documents,
        [],
        { temperature: 0.7, maxTokens: 3000 }
      );

      return {
        content: result.content,
        needsDiagram: true,
        diagramType: intent.chartType === 'auto' ? 'bar' : intent.chartType,
        diagramTitle: result.diagramTitle || `${intent.chartType} Chart`,
        confidence: result.confidence,
        sources: result.sources,
        analysisType: result.analysisType,
        toolsUsed: ['openai_analysis'],
        dynamicData: result.dynamicData
      };
    } catch (error) {
      console.error('❌ Chart generation error:', error);
      throw error;
    }
  }
  
  /**
   * Handle document analysis using MCP tools
   */
  private static async handleDocumentAnalysis(
    request: string,
    documents: ProcessedDocument[],
    conversationHistory: Message[],
    config: any
  ): Promise<AgentResponse> {
    
    console.log('📄 Analyzing documents via MCP tools...');
    
    if (documents.length === 0) {
      return {
        content: "I'd be happy to help analyze documents, but I don't see any uploaded documents. Please upload some documents first, and then I can provide detailed analysis based on your questions.",
        needsDiagram: false,
        confidence: 0.95,
        sources: [],
        analysisType: 'analysis',
        toolsUsed: ['validation']
      };
    }
    
    try {
      // Get document IDs for MCP
      const documentIds = documents.map(doc => doc.fileName);
      
      // Use MCP analyze_document tool
      const analysisResponse = await mcpClient.analyzeDocument(
        request,
        documentIds,
        crypto.randomUUID(), // conversation ID
        {
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 3000
        }
      );
      
      if (analysisResponse.success) {
        return {
          content: analysisResponse.data.content,
          needsDiagram: analysisResponse.data.needs_diagram || false,
          diagramType: analysisResponse.data.diagram_type,
          diagramTitle: analysisResponse.data.diagram_title,
          confidence: analysisResponse.data.confidence || 0.80,
          sources: this.extractSourcesFromDocuments(documents),
          analysisType: 'analysis',
          toolsUsed: ['analyze_document']
        };
      } else {
        throw new Error(analysisResponse.error || 'Document analysis failed');
      }
      
    } catch (error) {
      console.log('📄 MCP analysis failed, using fallback...');
      
      // Fallback to local analysis
      const { analyzeDocumentWithOpenAI } = await import('./openaiService');
      
      try {
        const result = await analyzeDocumentWithOpenAI(request, documents, conversationHistory, config);
        
        return {
          content: result.content,
          needsDiagram: result.needsDiagram,
          diagramType: result.diagramType,
          diagramTitle: result.diagramTitle,
          confidence: result.confidence,
          sources: result.sources,
          analysisType: result.analysisType,
          toolsUsed: ['openai_fallback']
        };
      } catch (fallbackError) {
        throw new Error(`Both MCP and fallback analysis failed: ${fallbackError}`);
      }
    }
  }
  
  /**
   * Handle diagram creation using MCP tools
   */
  private static async handleDiagramCreation(
    request: string,
    intent: any,
    documents: ProcessedDocument[]
  ): Promise<AgentResponse> {
    
    console.log('🔄 Creating diagram via MCP tools...');
    
    try {
      const diagramResponse = await mcpClient.generateDiagram(
        request,
        intent.diagramType,
        this.generateDiagramTitle(intent.diagramType, request)
      );
      
      if (diagramResponse.success) {
        return {
          content: `I've created a ${intent.diagramType} diagram based on your request. The diagram shows the key relationships and flow between different elements.`,
          needsDiagram: true,
          diagramType: intent.diagramType,
          diagramTitle: diagramResponse.data.title,
          confidence: 0.90,
          sources: [],
          analysisType: 'analysis',
          toolsUsed: ['generate_diagram']
        };
      } else {
        throw new Error(diagramResponse.error || 'Diagram creation failed');
      }
      
    } catch (error) {
      console.log('🔄 MCP diagram creation failed, using fallback...');
      
      return {
        content: `I've created a ${intent.diagramType} diagram for you. The diagram illustrates the process flow and key decision points based on your request.`,
        needsDiagram: true,
        diagramType: intent.diagramType,
        diagramTitle: this.generateDiagramTitle(intent.diagramType, request),
        confidence: 0.85,
        sources: [],
        analysisType: 'analysis',
        toolsUsed: ['local_generation']
      };
    }
  }
  
  /**
   * Handle data extraction using MCP tools
   */
  private static async handleDataExtraction(
    request: string,
    documents: ProcessedDocument[],
    config: any
  ): Promise<AgentResponse> {
    
    console.log('🔍 Extracting data via MCP tools...');
    
    if (documents.length === 0) {
      return {
        content: "I can help extract specific data from your documents. Please upload some documents first, and then ask me to find specific information like dates, numbers, names, or other details.",
        needsDiagram: false,
        confidence: 0.95,
        sources: [],
        analysisType: 'extraction',
        toolsUsed: ['validation']
      };
    }
    
    try {
      // Use MCP search_documents tool for data extraction
      const searchResponse = await mcpClient.searchDocuments(
        request,
        documents.map(doc => doc.fileName),
        10
      );
      
      if (searchResponse.success && searchResponse.data.results.length > 0) {
        const extractedData = searchResponse.data.results
          .map(result => `**${result.document_name}**: ${result.content}`)
          .join('\n\n');
        
        return {
          content: `Here's the extracted data based on your request:\n\n${extractedData}`,
          needsDiagram: false,
          confidence: 0.85,
          sources: searchResponse.data.results.map(r => ({
            fileName: r.document_name,
            chunkId: r.chunk_id,
            relevance: r.similarity_score,
            excerpt: r.content
          })),
          analysisType: 'extraction',
          toolsUsed: ['search_documents']
        };
      } else {
        return {
          content: "I couldn't find specific data matching your request in the uploaded documents. Could you try rephrasing your question or being more specific about what you're looking for?",
          needsDiagram: false,
          confidence: 0.70,
          sources: [],
          analysisType: 'extraction',
          toolsUsed: ['search_documents']
        };
      }
      
    } catch (error) {
      console.log('🔍 MCP data extraction failed, using fallback...');
      
      return {
        content: "I can help extract data from your documents. Please be more specific about what information you're looking for (dates, numbers, names, etc.) and I'll search through your uploaded documents.",
        needsDiagram: false,
        confidence: 0.60,
        sources: [],
        analysisType: 'extraction',
        toolsUsed: ['fallback']
      };
    }
  }
  
  /**
   * Handle general chat using MCP or OpenAI
   */
  private static async handleGeneralChat(
    request: string,
    documents: ProcessedDocument[],
    conversationHistory: Message[],
    config: any
  ): Promise<AgentResponse> {

    console.log('💬 Handling general chat...');

    // Always use OpenAI for general chat - it handles both document and non-document modes
    // The OpenAI service will automatically detect if documents are present and adjust accordingly
    return await this.handleDocumentAnalysis(request, documents, conversationHistory, config);
  }
  
  // Helper methods
  
  private static mapDiagramType(pattern: string): string {
    const mapping: { [key: string]: string } = {
      'flowchart': 'flowchart',
      'flow chart': 'flowchart',
      'process diagram': 'process',
      'workflow': 'process',
      'organizational chart': 'organizational',
      'org chart': 'organizational',
      'timeline': 'timeline',
      'sequence diagram': 'mermaid',
      'diagram': 'flowchart'
    };
    
    return mapping[pattern] || 'flowchart';
  }
  
  private static determineAnalysisType(request: string): string {
    if (request.includes('summary') || request.includes('summarize')) return 'summary';
    if (request.includes('compare')) return 'comparison';
    if (request.includes('recommend')) return 'recommendation';
    if (request.includes('extract') || request.includes('find')) return 'extraction';
    return 'analysis';
  }
  
  /**
   * Format dynamic chart response from MCP
   */
  private static formatDynamicChartResponse(chartData: any, request: string): string {
    const tableMarkdown = this.generateTableMarkdown(chartData.tableData);
    const insightsMarkdown = chartData.insights.map((insight: string) => `• ${insight}`).join('\n');
    
    return `I've created a professional **${chartData.chartType} chart** analyzing your request: "${request}"

## 📊 **${chartData.title}**

${chartData.description}

### 📋 **Data Overview:**

${tableMarkdown}

### 🎯 **Key Insights:**

${insightsMarkdown}

### 📈 **Summary Statistics:**

${this.formatSummaryStats(chartData.summary, chartData.chartType)}

## 💻 **Features:**

• **Interactive Chart** - Hover for detailed tooltips
• **Professional Design** - Modern styling with animations  
• **Export Ready** - Download as PNG/JPEG for presentations
• **React Code** - Click "View Code" to see the complete component
• **Responsive** - Works perfectly on all screen sizes

The chart uses **Recharts library** and includes comprehensive data visualization with summary cards showing key performance metrics.`;
  }
  
  /**
   * Generate markdown table from table data
   */
  private static generateTableMarkdown(tableData: any): string {
    const headers = `| ${tableData.headers.join(' | ')} |`;
    const separator = `|${tableData.headers.map(() => '---').join('|')}|`;
    const rows = tableData.rows.map((row: string[]) => `| ${row.join(' | ')} |`).join('\n');
    
    return `${headers}\n${separator}\n${rows}`;
  }
  
  /**
   * Generate contextual chart data based on request
   */
  private static generateContextualChartData(request: string, chartType: string): string {
    const requestLower = request.toLowerCase();
    
    if (requestLower.includes('sales')) {
      return `**Sample Sales Data:**

| Product | Sales ($) | Units |
|---------|-----------|-------|
| Product A | $45,000 | 150 |
| Product B | $62,000 | 210 |
| Product C | $38,000 | 95 |
| Product D | $71,000 | 240 |

The ${chartType} chart visualizes this sales data with proper scaling, axes, and labels.`;
    }
    
    if (requestLower.includes('revenue') || requestLower.includes('financial')) {
      return `**Sample Revenue Data:**

| Quarter | Revenue ($) | Growth |
|---------|-------------|--------|
| Q1 2024 | $125,000 | +8% |
| Q2 2024 | $142,000 | +12% |
| Q3 2024 | $138,000 | +15% |
| Q4 2024 | $156,000 | +18% |

The chart shows quarterly performance with clear visual comparison.`;
    }
    
    if (requestLower.includes('performance') || requestLower.includes('metric')) {
      return `**Sample Performance Metrics:**

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Response Time | 250ms | 200ms | ⚠️ |
| Uptime | 99.8% | 99.9% | ✅ |
| Error Rate | 0.1% | 0.05% | ⚠️ |
| Throughput | 1000/s | 1200/s | ✅ |

Visual ${chartType} makes it easy to compare current vs target performance.`;
    }
    
    // Generic test data
    return `**Sample Test Data:**

| Category | Value | Percentage |
|----------|-------|------------|
| Category A | 45 | 25% |
| Category B | 62 | 35% |
| Category C | 38 | 21% |
| Category D | 35 | 19% |

The ${chartType} chart displays this data with proper proportional visualization and clear labeling.`;
  }
  
  /**
   * Format summary statistics based on chart type
   */
  private static formatSummaryStats(summary: any, chartType: string): string {
    const stats = Object.entries(summary)
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const formattedValue = typeof value === 'number' && value > 1000 
          ? `$${value.toLocaleString()}` 
          : value;
        return `• **${label}**: ${formattedValue}`;
      })
      .join('\n');
    
    return stats;
  }
  
  /**
   * Generate chart response text (fallback)
   */
  private static generateChartResponseText(chartType: string, request: string): string {
    return `I've created a professional **${chartType} chart** based on your request.

The chart includes:
• Interactive tooltips and hover effects
• Professional styling with modern design
• Export functionality (PNG, JPEG)
• Responsive layout for all devices`;
  }
  
  private static generateDiagramTitle(diagramType: string, request: string): string {
    const titles: { [key: string]: string } = {
      'flowchart': 'Process Flowchart',
      'process': 'Process Workflow',
      'organizational': 'Organizational Structure',
      'timeline': 'Project Timeline',
      'mermaid': 'Sequence Diagram'
    };
    
    return titles[diagramType] || 'Generated Diagram';
  }
  
  private static extractSourcesFromDocuments(documents: ProcessedDocument[]): any[] {
    return documents.slice(0, 3).map(doc => ({
      fileName: doc.fileName,
      chunkId: 'doc-summary',
      relevance: 0.8,
      excerpt: doc.content?.substring(0, 200) + '...' || 'Document content'
    }));
  }
  
  private static createErrorResponse(error: any): AgentResponse {
    return {
      content: `I encountered an issue processing your request: ${error.message || 'Unknown error'}. Please try rephrasing your question or contact support if the problem persists.`,
      needsDiagram: false,
      confidence: 0.30,
      sources: [],
      analysisType: 'analysis',
      toolsUsed: ['error_handler']
    };
  }
}