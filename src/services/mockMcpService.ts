export class MockMcpService {
  async searchWeb(query: string, maxResults: number = 10) {
    console.log('🔍 [MOCK] Searching web for:', query);

    await this.delay(800);

    return {
      success: true,
      query,
      results: [
        {
          rank: 1,
          title: `Latest developments in ${query}`,
          snippet: `Recent updates about ${query} show significant progress. Industry experts report major breakthroughs in this area, with new innovations emerging rapidly.`,
          url: `https://example.com/article-1`,
          published_date: new Date().toISOString()
        },
        {
          rank: 2,
          title: `${query}: What you need to know`,
          snippet: `Comprehensive guide covering the most important aspects of ${query}. This analysis provides key insights from leading researchers and practitioners.`,
          url: `https://example.com/article-2`,
          published_date: new Date().toISOString()
        },
        {
          rank: 3,
          title: `Breaking news about ${query}`,
          snippet: `Just announced: significant changes in ${query} are reshaping the landscape. Here's what experts are saying about these developments.`,
          url: `https://example.com/article-3`,
          published_date: new Date().toISOString()
        }
      ],
      total_results: 3,
      timestamp: new Date().toISOString()
    };
  }

  async scrapeWebpage(url: string, extractMode: string = 'readability') {
    console.log('📄 [MOCK] Scraping webpage:', url);

    await this.delay(1000);

    return {
      success: true,
      url,
      title: 'Article Title - Detailed Analysis',
      content: `This is the extracted content from the webpage. It contains detailed information about the topic, including key findings, expert opinions, and comprehensive analysis.

The article discusses various aspects of the subject matter, providing readers with valuable insights. Multiple perspectives are presented, backed by research and real-world examples.

Key points include:
- Important finding number one
- Significant development number two
- Critical insight number three

The conclusion emphasizes the importance of these developments and their potential impact on the future.`,
      content_length: 450,
      description: 'A comprehensive article about the topic',
      timestamp: new Date().toISOString()
    };
  }

  async summarizeWebpage(url: string, summaryLength: string = 'medium') {
    console.log('📝 [MOCK] Summarizing webpage:', url);

    await this.delay(1200);

    const summaries = {
      short: 'Brief one-sentence summary of the article content.',
      medium: 'This article provides a comprehensive overview of the topic, discussing key developments and their implications. It presents multiple viewpoints and analyzes recent trends.',
      long: 'This detailed article examines the subject matter from multiple angles, presenting both historical context and current developments. The author discusses various perspectives from industry experts, analyzes recent trends, and provides insights into potential future directions. Key findings include several important breakthroughs and their implications for the field.'
    };

    return {
      success: true,
      url,
      title: 'Article Title',
      summary: summaries[summaryLength as keyof typeof summaries] || summaries.medium,
      original_length: 2500,
      timestamp: new Date().toISOString()
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const mockMcpService = new MockMcpService();
