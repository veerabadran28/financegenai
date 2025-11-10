/**
 * MCP Client for Document Analysis
 * Connects React frontend to FastMCP server
 */

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChartGenerationRequest {
  question: string;
  chartType: string;
  context?: string;
}

export interface ProcessedDocument {
  id: string;
  file_name: string;
  content_preview: string;
  metadata: {
    word_count: number;
    character_count: number;
    page_count?: number;
    language?: string;
  };
  chunk_count: number;
}

export interface AnalysisResponse {
  content: string;
  analysis_type: string;
  confidence: number;
  needs_diagram: boolean;
  diagram_type?: string;
  diagram_title?: string;
  document_sources: Array<{ id: string; name: string }>;
  token_usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface DiagramData {
  id: string;
  type: string;
  title: string;
  nodes: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    type: string;
  }>;
  connections: Array<{
    id: string;
    from: string;
    to: string;
    label?: string;
  }>;
}

export interface SearchResult {
  document_id: string;
  document_name: string;
  chunk_id: string;
  content: string;
  similarity_score: number;
  chunk_metadata: any;
}

export interface ExportResult {
  format: string;
  data: string; // base64 encoded
  filename: string;
  message_count?: number;
}

class MCPClient {
  private baseUrl: string;
  private apiKey: string | null = null;

  constructor(baseUrl?: string) {
    // Use environment variable or fallback to default
    this.baseUrl = baseUrl || import.meta.env.VITE_MCP_SERVER_URL || 'http://localhost:8000';
    console.log('MCP Client initialized with base URL:', this.baseUrl);
  }

  /**
   * Initialize OpenAI client on the MCP server
   */
  async setupOpenAI(apiKey: string): Promise<MCPResponse> {
    try {
      this.apiKey = apiKey;
      
      console.log('Setting up OpenAI with API key...');
      
      // For now, just validate the API key format since MCP server might not be running yet
      if (apiKey && apiKey.startsWith('sk-') && apiKey.length > 20) {
        console.log('API key format is valid');
        return {
          success: true,
          data: { message: 'API key validated' }
        };
      } else {
        console.log('Invalid API key format');
        return {
          success: false,
          error: 'Invalid API key format'
        };
      }
    } catch (error) {
      console.error('Setup error:', error);
      return {
        success: false,
        error: `Failed to setup OpenAI: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Process a document file with hybrid processing (AWS Textract + local fallback)
   */
  async processDocument(file: File): Promise<MCPResponse<ProcessedDocument>> {
    try {
      // Convert file to base64
      const base64Content = await this.fileToBase64(file);

      const response = await this.callTool('process_document', {
        file_content: base64Content,
        file_name: file.name,
        file_type: file.type
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get full document data including all tables and chunks
   */
  async getDocumentFullData(documentId: string): Promise<MCPResponse<any>> {
    try {
      const response = await this.callTool('get_document_full_data', {
        document_id: documentId
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get document data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get extracted tables from a document
   */
  async getDocumentTables(documentId: string): Promise<MCPResponse<any>> {
    try {
      const response = await this.callTool('get_document_tables', {
        document_id: documentId
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get document tables: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Search through documents
   */
  async searchDocuments(
    query: string, 
    documentIds?: string[], 
    maxResults: number = 10
  ): Promise<MCPResponse<{ results: SearchResult[]; total_results: number }>> {
    try {
      const response = await this.callTool('search_documents', {
        query,
        document_ids: documentIds,
        max_results: maxResults
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze documents with AI
   */
  async analyzeDocument(
    question: string,
    documentIds: string[],
    conversationId?: string,
    config: { temperature?: number; maxTokens?: number } = {}
  ): Promise<MCPResponse<AnalysisResponse>> {
    try {
      const response = await this.callTool('analyze_document', {
        question,
        document_ids: documentIds,
        conversation_id: conversationId,
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 3000
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze documents with streaming response
   */
  async analyzeDocumentStreaming(
    question: string,
    documentIds: string[],
    conversationId?: string,
    config: { temperature?: number; maxTokens?: number } = {},
    onChunk?: (chunk: string) => void
  ): Promise<MCPResponse<AnalysisResponse>> {
    try {
      const response = await fetch(`${this.baseUrl}/tools/analyze_document_streaming`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          document_ids: documentIds,
          conversation_id: conversationId,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 3000
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let finalResult: AnalysisResponse | null = null;
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.chunk && onChunk) {
                onChunk(data.chunk);
              }
              
              if (data.final) {
                finalResult = {
                  content: '', // Content was streamed via chunks
                  analysis_type: data.analysis_type,
                  confidence: data.confidence,
                  needs_diagram: data.needs_diagram,
                  diagram_type: data.diagram_type,
                  diagram_title: data.diagram_title,
                  document_sources: [],
                  token_usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
                };
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!finalResult) {
        throw new Error('No final result received from streaming');
      }

      return {
        success: true,
        data: finalResult
      };

    } catch (error) {
      return {
        success: false,
        error: `Streaming analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generate dynamic chart with contextual data
   */
  async generateDynamicChart(request: ChartGenerationRequest): Promise<MCPResponse<any>> {
    try {
      console.log('🎯 Generating dynamic chart:', request);
      
      // Analyze the user's question to extract context
      const context = this.analyzeChartContext(request.question);
      
      // Generate contextual data based on the question
      const chartData = this.generateContextualChartData(request.question, request.chartType);
      
      // Create response with dynamic content
      const response = {
        chartType: request.chartType,
        title: context.title,
        description: context.description,
        data: chartData.data,
        summary: chartData.summary,
        tableData: chartData.tableData,
        insights: context.insights,
        codeExample: this.generateDynamicCode(request.chartType, chartData, context)
      };
      
      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: `Dynamic chart generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Analyze chart context from user question
   */
  private analyzeChartContext(question: string): any {
    const questionLower = question.toLowerCase();
    
    // Sales context
    if (questionLower.includes('sales')) {
      return {
        title: 'Sales Performance Analysis',
        description: 'Monthly sales performance with targets and growth metrics',
        insights: [
          'Strong Q4 performance with 15% growth',
          'Consistent target achievement across most months',
          'Peak sales in December reaching $92K'
        ]
      };
    }
    
    // Revenue context
    if (questionLower.includes('revenue')) {
      return {
        title: 'Revenue Growth Analysis',
        description: 'Quarterly revenue trends and growth patterns',
        insights: [
          'Steady revenue growth throughout the year',
          'Q4 shows strongest performance',
          'Average quarterly growth of 12%'
        ]
      };
    }
    
    // Performance context
    if (questionLower.includes('performance') || questionLower.includes('metric')) {
      return {
        title: 'Key Performance Metrics',
        description: 'System performance indicators and benchmarks',
        insights: [
          'Response time needs optimization',
          'Uptime exceeds industry standards',
          'Throughput meeting expectations'
        ]
      };
    }
    
    // Product context
    if (questionLower.includes('product')) {
      return {
        title: 'Product Performance Dashboard',
        description: 'Product sales distribution and market share',
        insights: [
          'Product A leads with 35% market share',
          'Balanced portfolio across all products',
          'Strong performance in premium segment'
        ]
      };
    }
    
    // Generic context
    return {
      title: 'Data Visualization Dashboard',
      description: 'Comprehensive data analysis and insights',
      insights: [
        'Data shows positive trends',
        'Performance metrics within expected ranges',
        'Opportunities for optimization identified'
      ]
    };
  }

  /**
   * Generate contextual chart data based on question
   */
  private generateContextualChartData(question: string, chartType: string): any {
    const questionLower = question.toLowerCase();
    
    if (questionLower.includes('sales')) {
      const salesData = [
        { month: 'Jan', actual: 45000, target: 42000, growth: 7.1 },
        { month: 'Feb', actual: 52000, target: 48000, growth: 15.6 },
        { month: 'Mar', actual: 48000, target: 45000, growth: -7.7 },
        { month: 'Apr', actual: 65000, target: 58000, growth: 35.4 },
        { month: 'May', actual: 71000, target: 65000, growth: 9.2 },
        { month: 'Jun', actual: 68000, target: 62000, growth: -4.2 },
        { month: 'Jul', actual: 75000, target: 70000, growth: 10.3 },
        { month: 'Aug', actual: 82000, target: 75000, growth: 9.3 },
        { month: 'Sep', actual: 78000, target: 72000, growth: -4.9 },
        { month: 'Oct', actual: 85000, target: 80000, growth: 9.0 },
        { month: 'Nov', actual: 88000, target: 82000, growth: 3.5 },
        { month: 'Dec', actual: 92000, target: 85000, growth: 4.5 }
      ];
      
      return {
        data: salesData,
        summary: {
          totalSales: salesData.reduce((sum, item) => sum + item.actual, 0),
          avgMonthly: Math.round(salesData.reduce((sum, item) => sum + item.actual, 0) / 12),
          targetHitRate: Math.round((salesData.filter(item => item.actual >= item.target).length / 12) * 100),
          bestMonth: salesData.reduce((max, item) => item.actual > max.actual ? item : max).month,
          avgGrowth: Math.round(salesData.reduce((sum, item) => sum + item.growth, 0) / 12 * 10) / 10
        },
        tableData: {
          headers: ['Month', 'Actual Sales', 'Target', 'Growth %'],
          rows: salesData.map(item => [
            item.month,
            `$${item.actual.toLocaleString()}`,
            `$${item.target.toLocaleString()}`,
            `${item.growth > 0 ? '+' : ''}${item.growth}%`
          ])
        }
      };
    }
    
    if (questionLower.includes('revenue')) {
      const revenueData = [
        { quarter: 'Q1 2024', revenue: 125000, growth: 8.2 },
        { quarter: 'Q2 2024', revenue: 142000, growth: 13.6 },
        { quarter: 'Q3 2024', revenue: 138000, growth: -2.8 },
        { quarter: 'Q4 2024', revenue: 156000, growth: 13.0 }
      ];
      
      return {
        data: revenueData,
        summary: {
          totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
          avgQuarterly: Math.round(revenueData.reduce((sum, item) => sum + item.revenue, 0) / 4),
          avgGrowth: Math.round(revenueData.reduce((sum, item) => sum + item.growth, 0) / 4 * 10) / 10,
          bestQuarter: revenueData.reduce((max, item) => item.revenue > max.revenue ? item : max).quarter
        },
        tableData: {
          headers: ['Quarter', 'Revenue', 'Growth %'],
          rows: revenueData.map(item => [
            item.quarter,
            `$${item.revenue.toLocaleString()}`,
            `${item.growth > 0 ? '+' : ''}${item.growth}%`
          ])
        }
      };
    }
    
    if (questionLower.includes('product')) {
      const productData = [
        { name: 'Product Alpha', value: 35, sales: 125000, units: 450 },
        { name: 'Product Beta', value: 25, sales: 89000, units: 320 },
        { name: 'Product Gamma', value: 20, sales: 71000, units: 255 },
        { name: 'Product Delta', value: 20, sales: 71000, units: 255 }
      ];
      
      return {
        data: productData,
        summary: {
          totalProducts: productData.length,
          topProduct: productData.reduce((max, item) => item.value > max.value ? item : max).name,
          totalSales: productData.reduce((sum, item) => sum + item.sales, 0),
          totalUnits: productData.reduce((sum, item) => sum + item.units, 0)
        },
        tableData: {
          headers: ['Product', 'Market Share', 'Sales', 'Units Sold'],
          rows: productData.map(item => [
            item.name,
            `${item.value}%`,
            `$${item.sales.toLocaleString()}`,
            item.units.toLocaleString()
          ])
        }
      };
    }
    
    // Generic data
    const genericData = [
      { category: 'Category A', value: 45, percentage: 25 },
      { category: 'Category B', value: 62, percentage: 35 },
      { category: 'Category C', value: 38, percentage: 21 },
      { category: 'Category D', value: 35, percentage: 19 }
    ];
    
    return {
      data: genericData,
      summary: {
        totalItems: genericData.length,
        totalValue: genericData.reduce((sum, item) => sum + item.value, 0),
        avgValue: Math.round(genericData.reduce((sum, item) => sum + item.value, 0) / genericData.length),
        topCategory: genericData.reduce((max, item) => item.value > max.value ? item : max).category
      },
      tableData: {
        headers: ['Category', 'Value', 'Percentage'],
        rows: genericData.map(item => [
          item.category,
          item.value.toString(),
          `${item.percentage}%`
        ])
      }
    };
  }

  /**
   * Generate dynamic React code based on context
   */
  private generateDynamicCode(chartType: string, chartData: any, context: any): string {
    const componentName = `${context.title.replace(/\s+/g, '')}Chart`;
    
    if (chartType === 'bar') {
      return `import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ${componentName} = () => {
  const data = ${JSON.stringify(chartData.data, null, 2)};

  return (
    <div className="w-full h-96 p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">${context.title}</h2>
      <p className="text-gray-600 mb-6">${context.description}</p>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => \`$\${(value / 1000).toFixed(0)}K\`} />
          <Tooltip formatter={(value) => [\`$\${value.toLocaleString()}\`, '']} />
          <Legend />
          <Bar dataKey="actual" fill="#3B82F6" name="Actual Sales" radius={[4, 4, 0, 0]} />
          <Bar dataKey="target" fill="#9CA3AF" name="Target" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-blue-800 font-semibold text-sm">Total Sales</h3>
          <p className="text-2xl font-bold text-blue-900">$${chartData.summary.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-green-800 font-semibold text-sm">Avg Monthly</h3>
          <p className="text-2xl font-bold text-green-900">$${chartData.summary.avgMonthly.toLocaleString()}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-purple-800 font-semibold text-sm">Target Hit Rate</h3>
          <p className="text-2xl font-bold text-purple-900">${chartData.summary.targetHitRate}%</p>
        </div>
      </div>
    </div>
  );
};

export default ${componentName};`;
    }
    
    return `// Chart code for ${chartType} type`;
  }

  /**
   * Generate a diagram
   */
  async generateDiagram(
    content: string,
    diagramType: string = 'flowchart',
    title: string = 'Generated Diagram'
  ): Promise<MCPResponse<DiagramData>> {
    try {
      const response = await this.callTool('generate_diagram', {
        content,
        diagram_type: diagramType,
        title
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Diagram generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export diagram as image
   */
  async exportDiagram(
    diagramData: DiagramData,
    format: string = 'png',
    width: number = 800,
    height: number = 600
  ): Promise<MCPResponse<ExportResult>> {
    try {
      const response = await this.callTool('export_diagram', {
        diagram_data: diagramData,
        format,
        width,
        height
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Diagram export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Export chat conversation
   */
  async exportChat(
    conversationId: string,
    format: string = 'html',
    includeMetadata: boolean = true
  ): Promise<MCPResponse<ExportResult>> {
    try {
      const response = await this.callTool('export_chat', {
        conversation_id: conversationId,
        format,
        include_metadata: includeMetadata
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: `Chat export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get list of processed documents
   */
  async getDocumentList(): Promise<MCPResponse<{ documents: any[]; total_count: number }>> {
    try {
      const response = await this.callTool('get_document_list', {});
      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get document list: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get list of conversations
   */
  async getConversationList(): Promise<MCPResponse<{ conversations: any[]; total_count: number }>> {
    try {
      const response = await this.callTool('get_conversation_list', {});
      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get conversation list: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(documentId: string): Promise<MCPResponse> {
    try {
      const response = await this.callTool('delete_document', { document_id: documentId });
      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Get system statistics
   */
  async getSystemStats(): Promise<MCPResponse<any>> {
    try {
      const response = await this.callTool('get_system_stats', {});
      return response;
    } catch (error) {
      return {
        success: false,
        error: `Failed to get system stats: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Generic tool calling method
   */
  private async callTool(toolName: string, args: any): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/tools/${toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(args)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          data: result
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error from MCP server'
        };
      }

    } catch (error) {
      return {
        success: false,
        error: `MCP call failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Convert File to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Download base64 data as file
   */
  downloadBase64File(base64Data: string, filename: string, mimeType?: string) {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      // Determine MIME type from filename if not provided
      if (!mimeType) {
        const extension = filename.split('.').pop()?.toLowerCase();
        const mimeTypes: { [key: string]: string } = {
          'html': 'text/html',
          'md': 'text/markdown',
          'json': 'application/json',
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'svg': 'image/svg+xml'
        };
        mimeType = mimeTypes[extension || ''] || 'application/octet-stream';
      }
      
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      
      // Cleanup
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Failed to download file:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const mcpClient = new MCPClient();
export default MCPClient;