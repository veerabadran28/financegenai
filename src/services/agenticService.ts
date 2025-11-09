import OpenAI from 'openai';
import { Message } from '../types';
import { mockMcpService } from './mockMcpService';

export interface AgenticResponse {
  content: string;
  toolsUsed: string[];
  sources: Array<{ title: string; url: string }>;
  confidence: number;
  iterations: number;
}

export interface ToolCallResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class AgenticService {
  private openai: OpenAI;
  private maxIterations = 5;
  private mcpBaseUrl = 'http://localhost:8000';
  private useMock = false;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    });

    this.checkMcpServer();
  }

  private async checkMcpServer() {
    try {
      const response = await fetch(`${this.mcpBaseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
      });
      this.useMock = !response.ok;
      if (this.useMock) {
        console.log('⚠️  MCP server not available, using mock service');
      } else {
        console.log('✅ MCP server connected');
      }
    } catch (error) {
      this.useMock = true;
      console.log('⚠️  MCP server not available, using mock service for development');
    }
  }

  async processQuery(
    userQuery: string,
    mode: 'web' | 'work',
    conversationHistory: Message[],
    documentIds: string[] = []
  ): Promise<AgenticResponse> {

    const tools = mode === 'web' ? this.getWebTools() : undefined;

    let messages: any[] = this.buildMessages(userQuery, conversationHistory, mode, documentIds);
    let iterationCount = 0;
    const toolsUsed: string[] = [];
    const sources: Array<{ title: string; url: string }> = [];

    console.log(`🤖 Starting agentic processing in ${mode} mode...`);

    while (iterationCount < this.maxIterations) {
      iterationCount++;
      console.log(`🔄 Iteration ${iterationCount}/${this.maxIterations}`);

      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages,
          tools: mode === 'web' ? tools : undefined,
          tool_choice: mode === 'web' ? 'auto' : undefined,
          temperature: 0.7,
          max_tokens: 2000
        });

        const assistantMessage = response.choices[0].message;
        messages.push(assistantMessage);

        if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
          console.log(`🛠️  LLM requested ${assistantMessage.tool_calls.length} tool call(s)`);

          for (const toolCall of assistantMessage.tool_calls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments);

            console.log(`⚙️  Executing: ${toolName}`, toolArgs);
            toolsUsed.push(toolName);

            const toolResult = await this.executeToolCall(toolName, toolArgs);

            if (toolResult.success && toolResult.data) {
              if (toolResult.data.results) {
                toolResult.data.results.forEach((r: any) => {
                  if (r.url && r.title) {
                    sources.push({ title: r.title, url: r.url });
                  }
                });
              }

              if (toolResult.data.url && toolResult.data.title) {
                sources.push({ title: toolResult.data.title, url: toolResult.data.url });
              }
            }

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });
          }

          continue;
        }

        console.log('✅ Final response generated');
        return {
          content: assistantMessage.content || 'No response generated',
          toolsUsed: [...new Set(toolsUsed)],
          sources: sources.slice(0, 5),
          confidence: this.calculateConfidence(toolsUsed, sources),
          iterations: iterationCount
        };

      } catch (error) {
        console.error('❌ Error in agentic loop:', error);
        return {
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          toolsUsed,
          sources,
          confidence: 0.1,
          iterations: iterationCount
        };
      }
    }

    console.log('⚠️  Maximum iterations reached');
    return {
      content: 'I apologize, but I reached the maximum processing iterations. Please try a simpler query or rephrase your question.',
      toolsUsed,
      sources,
      confidence: 0.3,
      iterations: iterationCount
    };
  }

  private getWebTools(): any[] {
    return [
      {
        type: 'function',
        function: {
          name: 'search_web',
          description: 'Search the web for current, real-time information. Use when the user asks about recent events, current data, latest news, facts, or anything requiring up-to-date information from the internet.',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query optimized for web search engines. Be specific and include relevant keywords.'
              },
              max_results: {
                type: 'number',
                description: 'Maximum number of search results to return (1-20)',
                default: 10
              }
            },
            required: ['query']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'scrape_webpage',
          description: 'Fetch and extract detailed content from a specific webpage URL. Use when you have a URL from search results and need the full article content or detailed information.',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The complete URL to fetch and scrape'
              },
              extract_mode: {
                type: 'string',
                enum: ['full', 'main', 'readability'],
                description: 'Extraction mode: readability (cleaned article, best for news/blogs), main (main content only), full (entire page)',
                default: 'readability'
              }
            },
            required: ['url']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'summarize_webpage',
          description: 'Fetch a webpage and generate an AI-powered summary. Useful for long articles or when you need a quick overview of content from a URL.',
          parameters: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'The URL to summarize'
              },
              summary_length: {
                type: 'string',
                enum: ['short', 'medium', 'long'],
                description: 'Summary length: short (1-2 sentences), medium (paragraph), long (detailed analysis)',
                default: 'medium'
              }
            },
            required: ['url']
          }
        }
      }
    ];
  }

  private async executeToolCall(toolName: string, args: any): Promise<ToolCallResult> {
    if (this.useMock) {
      try {
        let result;
        switch (toolName) {
          case 'search_web':
            result = await mockMcpService.searchWeb(args.query, args.max_results);
            break;
          case 'scrape_webpage':
            result = await mockMcpService.scrapeWebpage(args.url, args.extract_mode);
            break;
          case 'summarize_webpage':
            result = await mockMcpService.summarizeWebpage(args.url, args.summary_length);
            break;
          default:
            return {
              success: false,
              error: `Unknown tool: ${toolName}`
            };
        }
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error: `Mock tool error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }

    try {
      const response = await fetch(`${this.mcpBaseUrl}/tools/${toolName}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `Tool call failed: ${response.statusText}`
        };
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error(`Error executing ${toolName}:`, error);
      return {
        success: false,
        error: `Tool execution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private buildMessages(
    query: string,
    history: Message[],
    mode: 'web' | 'work',
    documentIds: string[]
  ): any[] {
    const systemPrompt = mode === 'web'
      ? `You are a helpful AI assistant with access to web search and scraping tools.

Key capabilities:
- Search the web for current, real-time information
- Scrape and extract content from webpages
- Summarize articles and long-form content

Guidelines:
- ALWAYS use search_web when the user asks about current events, recent data, or factual information that may change over time
- Use scrape_webpage when you have a specific URL and need full article content
- Use summarize_webpage for long articles that need condensing
- Provide sources and citations for all factual claims
- Be transparent about which tools you're using
- If information is outdated or uncertain, search for the latest data
- Handle ANY type of question intelligently by deciding which tools to use

Examples of when to search:
- "What's happening with..." → search_web
- "Latest news on..." → search_web
- "Current price of..." → search_web
- "Who won the..." → search_web (if recent)
- "Write code for..." → No tools needed (use your knowledge)
- "Explain how..." → Decide based on whether current info is needed

Be conversational and helpful. Explain your reasoning when using tools.`
      : `You are a helpful AI assistant that analyzes uploaded documents. You have access to the full content of the user's uploaded documents and can answer questions about them naturally and conversationally.`;

    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ];

    history.slice(-6).forEach(msg => {
      messages.push({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    messages.push({ role: 'user', content: query });

    return messages;
  }

  private calculateConfidence(toolsUsed: string[], sources: any[]): number {
    let confidence = 0.5;

    if (toolsUsed.includes('search_web')) confidence += 0.2;
    if (toolsUsed.includes('scrape_webpage') || toolsUsed.includes('summarize_webpage')) confidence += 0.15;
    if (sources.length >= 3) confidence += 0.15;

    return Math.min(confidence, 0.95);
  }
}
