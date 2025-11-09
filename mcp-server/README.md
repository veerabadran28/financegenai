# FastMCP Document Analysis Server

A comprehensive MCP (Model Context Protocol) server built with FastMCP for document analysis and AI-powered chat functionality.

## 🚀 Features

### Document Processing Tools
- **process_document**: Upload and process PDF, Word, and text documents
- **search_documents**: Advanced semantic search across document content
- **get_document_list**: List all processed documents
- **delete_document**: Remove documents from storage

### AI Analysis Tools
- **setup_openai_client**: Initialize OpenAI API connection
- **analyze_document**: Comprehensive document analysis with AI
- **analyze_document_streaming**: Real-time streaming AI responses
- **generate_diagram**: Create flowcharts, org charts, and process diagrams

### Export & Utility Tools
- **export_diagram**: Export diagrams as PNG, JPEG, or SVG
- **export_chat**: Export conversations as HTML, Markdown, or JSON
- **get_conversation_list**: List all chat conversations
- **get_system_stats**: System health and usage statistics

## 🛠️ Installation

1. **Navigate to MCP server directory:**
   ```bash
   cd mcp-server
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the server:**
   ```bash
   python start.py
   ```

   Or directly:
   ```bash
   python main.py
   ```

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: Your OpenAI API key (optional, can be set via tool call)

### Server Settings
- **Host**: `0.0.0.0` (configurable)
- **Port**: `8000` (configurable)
- **Protocol**: HTTP with MCP over stdio/HTTP

## 📋 Tool Reference

### Document Processing

#### `process_document`
```python
await process_document(
    file_content="base64_encoded_content",
    file_name="document.pdf",
    file_type="application/pdf"
)
```

#### `search_documents`
```python
await search_documents(
    query="search terms",
    document_ids=["doc1", "doc2"],  # optional
    max_results=10
)
```

### AI Analysis

#### `analyze_document`
```python
await analyze_document(
    question="What is this document about?",
    document_ids=["doc1", "doc2"],
    conversation_id="conv123",  # optional
    temperature=0.7,
    max_tokens=3000
)
```

#### `analyze_document_streaming`
```python
async for chunk in analyze_document_streaming(
    question="Explain the main points",
    document_ids=["doc1"],
    conversation_id="conv123"
):
    # Process streaming response
    pass
```

### Diagram Generation

#### `generate_diagram`
```python
await generate_diagram(
    content="Process description...",
    diagram_type="flowchart",  # flowchart, process, organizational, timeline
    title="My Diagram"
)
```

#### `export_diagram`
```python
await export_diagram(
    diagram_data=diagram_dict,
    format="png",  # png, jpeg, svg
    width=800,
    height=600
)
```

### Export Tools

#### `export_chat`
```python
await export_chat(
    conversation_id="conv123",
    format="html",  # html, markdown, json
    include_metadata=True
)
```

## 🏗️ Architecture

### Data Storage
- **In-Memory Storage**: Documents and conversations stored in memory
- **Document Store**: `Dict[str, ProcessedDocument]`
- **Conversation Store**: `Dict[str, List[ChatMessage]]`

### Processing Pipeline
1. **Document Upload** → Base64 decode → File type detection
2. **Content Extraction** → PDF/Word/Text parsing → Chunking
3. **AI Analysis** → Context building → OpenAI API → Response processing
4. **Export Generation** → Template rendering → Format conversion

### Supported File Types
- **PDF**: `.pdf` files with text extraction
- **Word**: `.docx` and `.doc` files
- **Text**: `.txt` files with UTF-8 encoding
- **Generic**: Any text-based file format

## 🔍 Advanced Features

### Semantic Search
- **TF-IDF Vectorization**: Advanced text similarity matching
- **Relevance Scoring**: Ranked results with confidence scores
- **Multi-document Search**: Search across multiple documents simultaneously

### AI-Powered Diagrams
- **Template-based Generation**: Fallback diagrams for reliability
- **AI-Enhanced Creation**: OpenAI-generated diagram structures
- **Multiple Formats**: Flowcharts, org charts, timelines, process diagrams

### Export Capabilities
- **Multiple Formats**: HTML, Markdown, JSON, PNG, JPEG, SVG
- **Rich Metadata**: Analysis confidence, source references, timestamps
- **Professional Styling**: Publication-ready exports

## 🚦 Error Handling

### Graceful Degradation
- **Document Processing**: Fallback to error documents for failed processing
- **AI Analysis**: Fallback responses for API failures
- **Diagram Generation**: Template-based fallbacks for AI failures

### Comprehensive Logging
- **Processing Status**: Detailed error messages and success confirmations
- **Performance Metrics**: Token usage, processing times, confidence scores
- **System Health**: Memory usage, uptime, connection status

## 🔗 Integration

### React Frontend Integration
```typescript
// Example MCP client usage
const mcpClient = new MCPClient('http://localhost:8000');

// Process document
const result = await mcpClient.callTool('process_document', {
    file_content: base64Content,
    file_name: 'document.pdf',
    file_type: 'application/pdf'
});

// Analyze with streaming
const stream = mcpClient.streamTool('analyze_document_streaming', {
    question: 'What are the key points?',
    document_ids: [result.document_id]
});
```

### API Endpoints
- **MCP Protocol**: Standard MCP tool calling interface
- **HTTP REST**: Direct HTTP access to tools (if enabled)
- **WebSocket**: Real-time streaming support

## 📊 Performance

### Optimization Features
- **Chunked Processing**: Large documents processed in chunks
- **Async Operations**: Non-blocking I/O for better performance
- **Memory Management**: Efficient storage and cleanup
- **Caching**: Response caching for repeated queries

### Scalability
- **Horizontal Scaling**: Multiple server instances supported
- **Load Balancing**: Stateless design for easy distribution
- **Resource Management**: Configurable limits and timeouts

## 🛡️ Security

### Data Protection
- **In-Memory Storage**: No persistent file storage by default
- **API Key Security**: Secure OpenAI API key handling
- **Input Validation**: Comprehensive input sanitization
- **Error Sanitization**: Safe error message handling

## 📈 Monitoring

### System Statistics
```python
stats = await get_system_stats()
# Returns: document counts, conversation metrics, system health
```

### Health Checks
- **API Connectivity**: OpenAI API status monitoring
- **Resource Usage**: Memory and processing metrics
- **Error Rates**: Failed operation tracking

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Install development dependencies
3. Run tests: `python -m pytest`
4. Start development server: `python main.py`

### Adding New Tools
1. Define tool function with `@app.tool()` decorator
2. Add proper type hints and documentation
3. Implement error handling
4. Add tests and update documentation

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the error logs in the console
2. Verify OpenAI API key configuration
3. Ensure all dependencies are installed
4. Check network connectivity for API calls

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with core document processing
- **v1.1.0**: Added streaming support and diagram generation
- **v1.2.0**: Enhanced export capabilities and system monitoring

### Roadmap
- [ ] Persistent storage options
- [ ] Multi-language document support
- [ ] Advanced diagram editing
- [ ] Batch processing capabilities
- [ ] API rate limiting and quotas