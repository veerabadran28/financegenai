# Insights-B: Advanced Document Analysis Chatbot

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**A production-grade, AI-powered document analysis platform with dual-mode intelligence:**
**Web Mode** for real-time web search and **Work Mode** for deep document analysis

[Features](#features) • [Architecture](#architecture) • [Installation](#installation) • [Usage](#usage) • [API Reference](#api-reference) • [Database](#database) • [Contributing](#contributing)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
  - [System Overview](#system-overview)
  - [Technology Stack](#technology-stack)
  - [Data Flow](#data-flow)
  - [Component Hierarchy](#component-hierarchy)
- [Installation](#installation)
  - [Prerequisites](#prerequisites)
  - [Environment Setup](#environment-setup)
  - [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Service Layer](#service-layer)
- [Database Schema](#database-schema)
- [Dual-Mode System](#dual-mode-system)
- [AI Integration](#ai-integration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Performance Optimization](#performance-optimization)
- [Security](#security)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Insights-B** is an enterprise-grade document analysis chatbot that combines the power of GPT-4o-mini with advanced document processing capabilities. It operates in two intelligent modes:

### 🌐 Web Mode
- **Real-time web search** using DuckDuckGo
- **Agentic function calling** with OpenAI
- **Webpage scraping** and summarization
- **Source attribution** with clickable links
- **Search history** persistence

### 💼 Work Mode
- **Advanced document analysis** (PDF, Word, Text)
- **Intelligent Q&A** over uploaded documents
- **Smart diagram generation** (flowcharts, charts, tables)
- **Conversation memory** with Supabase
- **Multi-document context** understanding

---

## Key Features

### 🤖 **Intelligent AI Conversations**
- Natural language processing with GPT-4o-mini
- Context-aware responses with conversation history
- Streaming responses for real-time feedback
- Intent detection and automatic routing

### 📄 **Advanced Document Processing**
- **Supported Formats**: PDF, Word (DOCX), Plain Text, CSV, JSON
- **Client-side processing** using PDF.js
- **Chunking strategy** for RAG (Retrieval Augmented Generation)
- **Metadata extraction** (word count, pages, author)
- **Multi-document support** with cross-referencing

### 📊 **Dynamic Visualizations**
- **Flowcharts**: Process flows, decision trees
- **Charts**: Bar, pie, line, scatter plots
- **Tables**: Data grids with formatting
- **Organizational Charts**: Hierarchy visualizations
- **Timelines**: Project roadmaps and schedules
- **Interactive editing** with drag-and-drop

### 💾 **Enterprise Data Persistence**
- **Supabase integration** for conversations
- **Conversation history** with full replay
- **Document storage** per conversation
- **User preferences** and settings
- **Search history** tracking

### 🎨 **Modern UI/UX**
- **Dark/Light theme** support
- **Responsive design** for mobile and desktop
- **Smooth animations** and transitions
- **Accessibility** features
- **Real-time status** indicators

### 🔒 **Security & Privacy**
- **Row-Level Security (RLS)** in Supabase
- **API key validation**
- **Client-side encryption** for sensitive data
- **CORS protection**
- **Safe content rendering**

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Insights-B Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐           ┌──────────────┐                   │
│  │  Web Mode    │           │  Work Mode   │                   │
│  │  🌐 Search   │           │  💼 Docs     │                   │
│  └──────┬───────┘           └──────┬───────┘                   │
│         │                          │                            │
│         v                          v                            │
│  ┌──────────────────────────────────────────┐                  │
│  │      AgenticService / IntelligentAgent   │                  │
│  │   (Intent Detection & Tool Orchestration)│                  │
│  └──────────────┬───────────────────────────┘                  │
│                 │                                               │
│       ┌─────────┴──────────┐                                   │
│       v                    v                                    │
│  ┌─────────────┐    ┌──────────────┐                          │
│  │  OpenAI     │    │  Web Search  │                          │
│  │  GPT-4o-mini│    │  Service     │                          │
│  └─────────────┘    └──────────────┘                          │
│                                                                  │
│  ┌──────────────────────────────────────────┐                  │
│  │         Document Processing Pipeline      │                  │
│  │  PDF.js → Content Extraction → Chunking  │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                  │
│  ┌──────────────────────────────────────────┐                  │
│  │            Supabase Database             │                  │
│  │  Conversations | Messages | Documents    │                  │
│  │  Preferences | Search History            │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### **Frontend**
- **React 18.3.1** - UI framework with hooks
- **TypeScript 5.5.3** - Type-safe JavaScript
- **Vite 5.4.2** - Fast build tool and dev server
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **Lucide React 0.344.0** - Icon library

#### **AI & ML**
- **OpenAI 4.28.0** - GPT-4o-mini integration
- **Function Calling** - Agentic tool use
- **RAG Pattern** - Document context retrieval

#### **Document Processing**
- **pdf.js (pdfjs-dist) 3.11.174** - PDF parsing
- **Custom parsers** - Word, text, CSV support

#### **Data Visualization**
- **Chart.js 4.5.1** - Canvas-based charts
- **react-chartjs-2 5.3.1** - React wrapper
- **Recharts 3.3.0** - Declarative charts
- **Custom SVG** - Flowcharts and diagrams

#### **Backend & Storage**
- **Supabase 2.80.0** - PostgreSQL database
- **Row-Level Security** - Data access control
- **Real-time subscriptions** - Live updates

#### **Markdown & Content**
- **react-markdown 9.0.1** - Markdown rendering
- **remark-gfm 4.0.0** - GitHub Flavored Markdown

---

### Data Flow

#### **Work Mode Flow (Document Analysis)**

```
User uploads document
        │
        v
┌───────────────────┐
│  FileUpload.tsx   │ ─→ Create FileAttachment object
└─────────┬─────────┘
          │
          v
┌───────────────────────┐
│ documentProcessor.ts  │ ─→ Extract text & metadata
│  - processPDFDocument │     Create document chunks
│  - processTextDocument│
└─────────┬─────────────┘
          │
          v
┌────────────────────┐
│ App.tsx useEffect  │ ─→ Store in processedDocuments[]
└─────────┬──────────┘
          │
          v
┌───────────────────────┐
│ conversationService   │ ─→ Save to Supabase database
└───────────────────────┘

User asks question
        │
        v
┌───────────────────┐
│  ChatInput.tsx    │ ─→ Create user message
└─────────┬─────────┘
          │
          v
┌───────────────────┐
│  App.tsx handler  │ ─→ Save to messages state
└─────────┬─────────┘
          │
          v
┌────────────────────────┐
│ IntelligentAgent       │ ─→ Analyze user intent
│  - analyzeUserIntent() │     Route to handler
└─────────┬──────────────┘
          │
          v
┌─────────────────────────┐
│ handleDocumentAnalysis  │ ─→ Use OpenAI with context
│  - Build prompt         │     Include document chunks
│  - Call GPT-4o-mini     │     Extract answer
└─────────┬───────────────┘
          │
          v
┌──────────────────┐
│ Response Display │ ─→ Render with metadata
└──────────────────┘     Show confidence, sources
```

#### **Web Mode Flow (Agentic Search)**

```
User asks question in Web Mode
        │
        v
┌───────────────────┐
│  ModeToggle       │ ─→ mode = 'web'
└─────────┬─────────┘
          │
          v
┌───────────────────────┐
│  AgenticService       │ ─→ Use OpenAI function calling
│  - processQuery()     │     Define web search tools
└─────────┬─────────────┘
          │
          v
┌──────────────────────────┐
│ OpenAI decides to search │ ─→ Calls search_web tool
└─────────┬────────────────┘
          │
          v
┌────────────────────┐
│ executeToolCall()  │ ─→ Route to webSearchService
└─────────┬──────────┘
          │
          v
┌─────────────────────┐
│ webSearchService    │ ─→ Fetch DuckDuckGo results
│  - searchWeb()      │     Parse HTML response
│  - scrapeWebpage()  │     Extract content
└─────────┬───────────┘
          │
          v
┌────────────────────┐
│ Return results to  │ ─→ AI synthesizes answer
│ OpenAI for analysis│     Cites sources
└─────────┬──────────┘
          │
          v
┌──────────────────┐
│ Response Display │ ─→ Show answer + sources
└──────────────────┘     Clickable links
```

### Component Hierarchy

```
App.tsx (Root)
│
├─── Sidebar.tsx
│    ├─── Document Analytics Display
│    ├─── Export Chat Button
│    └─── Settings Toggle
│
├─── Header
│    ├─── ModeToggle.tsx (Web/Work)
│    ├─── Conversations Button
│    └─── New Conversation Button
│
├─── Main Content Area
│    ├─── FileUpload.tsx (Conditional)
│    │    └─── Uploaded Files List
│    │
│    └─── Chat Display
│         └─── ChatMessage.tsx (Multiple)
│              ├─── User Message
│              ├─── Assistant Message
│              ├─── DiagramEditor.tsx (Optional)
│              └─── ChartRenderer.tsx (Optional)
│
├─── ChatInput.tsx
│    ├─── Sample Questions
│    └─── Message Textarea
│
├─── SettingsPanel.tsx (Modal)
│    ├─── Theme Settings
│    ├─── Model Configuration
│    └─── Feature Toggles
│
└─── Conversations Modal (Conditional)
     └─── Conversation List Items
```

---

## Installation

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **OpenAI API Key** - Get from [OpenAI Platform](https://platform.openai.com/)
- **Supabase Account** (Optional but recommended) - [Sign up](https://supabase.com/)

### Environment Setup

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/insights-b.git
cd insights-b
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Configure environment variables** (`.env` file):

```env
# Required: OpenAI API Key
VITE_OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Supabase (for conversation persistence)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Development Setup

1. **Start the development server**
```bash
npm run dev
```

2. **Open your browser**
```
http://localhost:5173
```

3. **Build for production**
```bash
npm run build
```

4. **Preview production build**
```bash
npm run preview
```

### Supabase Setup (Optional but Recommended)

1. **Create a new Supabase project**
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Click "New Project"
   - Note your project URL and anon key

2. **Run the migration**
   - Navigate to SQL Editor in Supabase Dashboard
   - Copy contents of `supabase/migrations/20251108072058_create_conversation_system.sql`
   - Execute the SQL

3. **Verify tables created**
   - Check Table Editor for: `conversations`, `messages`, `documents`, `user_preferences`, `search_history`

4. **Update `.env` file** with your Supabase credentials

---

## Project Structure

```
insights-b/
│
├── src/
│   ├── components/           # React UI Components
│   │   ├── App.tsx          # Main application component (995 lines)
│   │   ├── ChatInput.tsx    # Message input with suggestions
│   │   ├── ChatMessage.tsx  # Message display with diagrams
│   │   ├── ChartRenderer.tsx# Chart visualization component
│   │   ├── DiagramEditor.tsx# Interactive diagram editor
│   │   ├── FileUpload.tsx   # Document upload interface
│   │   ├── ModeToggle.tsx   # Web/Work mode switcher
│   │   ├── Sidebar.tsx      # Navigation and analytics
│   │   └── SettingsPanel.tsx# Configuration modal
│   │
│   ├── services/            # Business Logic Layer
│   │   ├── agenticService.ts    # Web mode agentic orchestrator
│   │   ├── agentService.ts      # Work mode intelligent routing
│   │   ├── conversationService.ts# Database operations
│   │   ├── diagramGenerator.ts  # Dynamic diagram creation
│   │   ├── mcpClient.ts         # MCP protocol handler
│   │   ├── mockMcpService.ts    # Testing mock service
│   │   ├── openaiService.ts     # OpenAI API integration
│   │   ├── preferencesService.ts# User settings management
│   │   └── webSearchService.ts  # Client-side web search
│   │
│   ├── utils/               # Utility Functions
│   │   ├── documentProcessor.ts # PDF/Word/Text parsing
│   │   ├── downloadHandler.ts   # Export functionality
│   │   ├── fileHandler.ts       # File upload handling
│   │   └── mockAI.ts            # AI response mocking
│   │
│   ├── types/               # TypeScript Definitions
│   │   └── index.ts         # All interfaces and types
│   │
│   ├── config/              # Configuration
│   │   └── appConfig.ts     # Default settings
│   │
│   ├── lib/                 # External Libraries
│   │   └── supabase.ts      # Supabase client setup
│   │
│   ├── main.tsx             # React entry point
│   ├── index.css            # Global styles
│   └── vite-env.d.ts        # Vite type declarations
│
├── supabase/
│   └── migrations/
│       └── 20251108072058_create_conversation_system.sql
│
├── mcp-server/              # Optional Python MCP Server
│   ├── main.py              # FastMCP server implementation
│   ├── start.py             # Server startup script
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # MCP server documentation
│
├── public/                  # Static assets
├── index.html               # HTML entry point
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── eslint.config.js         # ESLint configuration
└── README.md                # This file
```

---

## Core Components

### 1. App.tsx (Main Application)
**Location**: `src/App.tsx` (995 lines)

The root component orchestrating the entire application.

**Key Responsibilities**:
- State management for messages, documents, conversations
- Mode switching (Web/Work)
- API key validation
- Document processing coordination
- Message handling and AI orchestration
- Conversation persistence

**State Variables**:
```typescript
const [messages, setMessages] = useState<Message[]>([]);
const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
const [processedDocuments, setProcessedDocuments] = useState<any[]>([]);
const [config, setConfig] = useState<ChatConfig>(defaultConfig);
const [mode, setMode] = useState<'web' | 'work'>('work');
const [conversationId, setConversationId] = useState<string | null>(null);
const [agenticService, setAgenticService] = useState<AgenticService | null>(null);
```

**Key Methods**:
- `handleSendMessage()` - Process user messages
- `handleFileUpload()` - Manage document uploads
- `handleNewConversation()` - Create new conversation
- `handleLoadConversation()` - Load existing conversation
- `getDocumentAnalytics()` - Calculate document statistics

**Usage Example**:
```typescript
// App.tsx handles the complete chat flow
function App() {
  // Initialize services on mount
  useEffect(() => {
    const checkApiKey = async () => {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const result = await mcpClient.setupOpenAI(apiKey);
      if (result.success) {
        const agentService = new AgenticService(apiKey);
        setAgenticService(agentService);
      }
    };
    checkApiKey();
  }, []);

  // Handle user messages differently based on mode
  const handleSendMessage = async (content: string) => {
    if (mode === 'web' && agenticService) {
      // Use agentic web search
      const result = await agenticService.processQuery(
        content, mode, conversationHistory
      );
    } else {
      // Use document analysis
      const response = await IntelligentAgent.processRequest(
        content, documents, conversationHistory, config
      );
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar {...props} />
      <MainContent>
        <Header>
          <ModeToggle mode={mode} onChange={setMode} />
        </Header>
        <ChatDisplay>
          {messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
        </ChatDisplay>
        <ChatInput onSendMessage={handleSendMessage} />
      </MainContent>
    </div>
  );
}
```

### 2. ModeToggle.tsx
**Location**: `src/components/ModeToggle.tsx` (38 lines)

Dual-mode switcher component for Web and Work modes.

**Props**:
```typescript
interface ModeToggleProps {
  mode: 'web' | 'work';
  onChange: (mode: 'web' | 'work') => void;
}
```

**Features**:
- Visual distinction between modes (blue for Web, teal for Work)
- Smooth transitions
- Icons from lucide-react (Globe, Briefcase)
- Dark mode support

**Usage Example**:
```typescript
<ModeToggle
  mode={mode}
  onChange={(newMode) => {
    setMode(newMode);
    preferencesService.setMode(newMode);
  }}
/>
```

### 3. ChatMessage.tsx
**Location**: `src/components/ChatMessage.tsx`

Displays individual chat messages with support for diagrams, charts, and metadata.

**Props**:
```typescript
interface ChatMessageProps {
  message: Message;
  onUpdateMessage?: (messageId: string, updates: Partial<Message>) => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  timestamp: Date;
  attachments?: FileAttachment[];
  diagram?: DiagramData;
  analysisMetadata?: AnalysisMetadata;
}
```

**Features**:
- Markdown rendering with react-markdown
- Streaming text support
- Diagram embedding
- Chart visualization
- Source attribution
- Confidence badges
- Copy to clipboard
- Export options

**Usage Example**:
```typescript
<ChatMessage
  message={{
    id: '123',
    type: 'assistant',
    content: 'Here is the analysis...',
    analysisMetadata: {
      analysisType: 'summary',
      confidence: 0.95,
      sources: [{ fileName: 'report.pdf', ... }]
    }
  }}
  onUpdateMessage={handleUpdateMessage}
/>
```

### 4. ChatInput.tsx
**Location**: `src/components/ChatInput.tsx`

User input component with sample questions and file attachments.

**Props**:
```typescript
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onAttachFiles: () => void;
  disabled?: boolean;
  hasDocuments?: boolean;
  theme?: 'light' | 'dark' | 'auto';
}
```

**Features**:
- Multi-line textarea with Enter to send
- Sample question chips
- Attachment button
- Context-aware placeholders
- Disabled state handling

**Sample Questions**:
- With documents: "What is this document about?", "Summarize the main points"
- Without documents: "Write a React component", "Explain async/await"

### 5. FileUpload.tsx
**Location**: `src/components/FileUpload.tsx`

Document upload interface with drag-and-drop support.

**Props**:
```typescript
interface FileUploadProps {
  onFileUpload: (file: FileAttachment) => void;
  uploadedFiles: FileAttachment[];
  onRemoveFile: (fileId: string) => void;
}
```

**Supported Formats**:
- PDF (`.pdf`)
- Word (`.doc`, `.docx`)
- Text (`.txt`)
- CSV (`.csv`)
- JSON (`.json`)

**Max File Size**: 25MB

**Features**:
- Drag-and-drop zone
- File type validation
- Size validation
- Progress indicators
- Uploaded files list
- Remove file capability

### 6. DiagramEditor.tsx
**Location**: `src/components/DiagramEditor.tsx`

Interactive diagram editor with drag-and-drop nodes and connections.

**Props**:
```typescript
interface DiagramEditorProps {
  diagram: DiagramData;
  onUpdate?: (diagram: DiagramData) => void;
  readOnly?: boolean;
}

interface DiagramData {
  id: string;
  type: 'flowchart' | 'diagram' | 'process' | 'organizational' | 'timeline';
  title: string;
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  metadata?: any;
}
```

**Features**:
- SVG-based rendering
- Draggable nodes
- Connection paths
- Zoom controls
- Export as PNG/SVG
- Edit mode toggle
- Node styling

### 7. ChartRenderer.tsx
**Location**: `src/components/ChartRenderer.tsx`

Chart visualization component using Chart.js and Recharts.

**Supported Chart Types**:
- Bar charts
- Line charts
- Pie charts
- Scatter plots
- Area charts

**Props**:
```typescript
interface ChartRendererProps {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'area';
  data: any;
  options?: ChartOptions;
}
```

### 8. Sidebar.tsx
**Location**: `src/components/Sidebar.tsx`

Navigation sidebar with document analytics and controls.

**Displays**:
- Document count
- Word count
- Average confidence
- Analysis count
- Export chat button
- Settings button

### 9. SettingsPanel.tsx
**Location**: `src/components/SettingsPanel.tsx`

Configuration modal for app settings.

**Settings**:
- Theme (light/dark/auto)
- Model name display
- Temperature (0-1)
- Max tokens
- Enable/disable diagrams
- Auto-download toggle
- Confidence threshold

---

## Service Layer

### 1. AgenticService (Web Mode)
**Location**: `src/services/agenticService.ts`

Orchestrates web search using OpenAI function calling.

**Key Methods**:

```typescript
class AgenticService {
  async processQuery(
    userQuery: string,
    mode: 'web' | 'work',
    conversationHistory: Message[],
    documentIds: string[] = []
  ): Promise<AgenticResponse>

  private getWebTools(): Array<OpenAI.ChatCompletionTool>

  private async executeToolCall(
    toolName: string,
    args: any
  ): Promise<ToolCallResult>
}
```

**Available Tools**:
1. **search_web** - Search the web using DuckDuckGo
2. **scrape_webpage** - Extract content from a URL
3. **summarize_webpage** - Summarize web content

**Function Calling Flow**:
```typescript
// 1. Define tools for OpenAI
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for current information',
      parameters: {
        query: { type: 'string', description: 'Search query' },
        max_results: { type: 'number', description: 'Max results' }
      }
    }
  }
];

// 2. OpenAI decides to use the tool
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: conversationHistory,
  tools: tools,
  tool_choice: 'auto'
});

// 3. Execute the tool
if (response.choices[0].message.tool_calls) {
  const toolCall = response.choices[0].message.tool_calls[0];
  const result = await executeToolCall(
    toolCall.function.name,
    JSON.parse(toolCall.function.arguments)
  );
}

// 4. Return results to AI for final answer
const finalResponse = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...conversationHistory, {
    role: 'function',
    name: toolCall.function.name,
    content: JSON.stringify(result)
  }]
});
```

**Usage Example**:
```typescript
const agenticService = new AgenticService(apiKey);

const result = await agenticService.processQuery(
  "What's the latest news about AI?",
  'web',
  conversationHistory
);

console.log(result.content);        // AI's answer
console.log(result.sources);        // Web sources used
console.log(result.toolsUsed);      // ['search_web', 'scrape_webpage']
console.log(result.confidence);     // 0.95
```

### 2. IntelligentAgent (Work Mode)
**Location**: `src/services/agentService.ts`

Intelligent request router for document analysis.

**Key Methods**:

```typescript
class IntelligentAgent {
  static async processRequest(
    userRequest: string,
    documents: ProcessedDocument[],
    conversationHistory: Message[],
    config: ChatConfig
  ): Promise<AgentResponse>

  private static analyzeUserIntent(request: string): IntentAnalysis

  private static async handleDocumentAnalysis(
    request: string,
    documents: ProcessedDocument[],
    history: Message[],
    config: ChatConfig
  ): Promise<AgentResponse>

  private static async handleChartGeneration(
    request: string,
    intent: IntentAnalysis,
    documents: ProcessedDocument[]
  ): Promise<AgentResponse>

  private static async handleDiagramCreation(
    request: string,
    intent: IntentAnalysis,
    documents: ProcessedDocument[]
  ): Promise<AgentResponse>
}
```

**Intent Detection**:
```typescript
private static analyzeUserIntent(request: string): IntentAnalysis {
  const requestLower = request.toLowerCase();

  // Code generation (highest priority)
  if (requestLower.includes('write code') ||
      requestLower.includes('generate code')) {
    return { type: 'general_chat', subtype: 'code_generation' };
  }

  // Chart generation
  if (requestLower.includes('bar chart') ||
      requestLower.includes('pie chart')) {
    return { type: 'chart_generation' };
  }

  // Diagram creation
  if (requestLower.includes('flowchart') ||
      requestLower.includes('diagram')) {
    return { type: 'diagram_creation' };
  }

  // Document analysis
  if (documents.length > 0) {
    return { type: 'document_analysis' };
  }

  // Default: general chat
  return { type: 'general_chat' };
}
```

**Document Analysis Flow**:
```typescript
private static async handleDocumentAnalysis(
  request: string,
  documents: ProcessedDocument[],
  history: Message[],
  config: ChatConfig
): Promise<AgentResponse> {

  // 1. Extract relevant chunks from documents
  const relevantChunks = documents.flatMap(doc =>
    doc.chunks.filter(chunk =>
      this.isChunkRelevant(chunk.content, request)
    )
  );

  // 2. Build context for AI
  const context = relevantChunks
    .map(chunk => chunk.content)
    .join('\n\n');

  // 3. Create prompt with document context
  const prompt = `
    Documents: ${documents.map(d => d.fileName).join(', ')}

    Context:
    ${context}

    Question: ${request}

    Please provide a detailed answer based solely on the document content.
  `;

  // 4. Call OpenAI
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are a document analysis assistant.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.3
  });

  // 5. Return structured response
  return {
    content: response.choices[0].message.content,
    needsDiagram: false,
    confidence: 0.9,
    sources: relevantChunks.map(chunk => ({
      fileName: chunk.metadata.fileName,
      relevance: 0.9
    })),
    analysisType: 'analysis'
  };
}
```

### 3. WebSearchService
**Location**: `src/services/webSearchService.ts`

Client-side web search using DuckDuckGo.

**Key Methods**:

```typescript
class WebSearchService {
  async searchWeb(
    query: string,
    maxResults: number = 10
  ): Promise<WebSearchResponse>

  async scrapeWebpage(url: string): Promise<WebPageContent>
}
```

**Search Implementation**:
```typescript
async searchWeb(query: string, maxResults: number = 10) {
  // 1. Build DuckDuckGo URL
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  // 2. Use CORS proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;

  // 3. Fetch results
  const response = await fetch(proxyUrl);
  const data = await response.json();

  // 4. Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.contents, 'text/html');

  // 5. Extract results
  const results = [];
  doc.querySelectorAll('.result').forEach((element, index) => {
    if (index >= maxResults) return;

    results.push({
      rank: index + 1,
      title: element.querySelector('.result__title')?.textContent,
      snippet: element.querySelector('.result__snippet')?.textContent,
      url: element.querySelector('.result__url')?.textContent
    });
  });

  return { success: true, query, results, total_results: results.length };
}
```

**Scraping Implementation**:
```typescript
async scrapeWebpage(url: string) {
  // 1. Fetch via CORS proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  const data = await response.json();

  // 2. Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.contents, 'text/html');

  // 3. Extract metadata
  const title = doc.querySelector('title')?.textContent || 'Untitled';
  const description = doc.querySelector('meta[name="description"]')?.content || '';

  // 4. Remove unwanted elements
  doc.querySelectorAll('script, style, nav, footer').forEach(el => el.remove());

  // 5. Extract main content
  const mainContent = doc.querySelector('main') ||
                     doc.querySelector('article') ||
                     doc.body;

  const content = mainContent?.textContent
    ?.replace(/\s+/g, ' ')
    .trim()
    .substring(0, 10000);

  return { success: true, url, title, content, description };
}
```

### 4. ConversationService
**Location**: `src/services/conversationService.ts`

Database operations for conversation persistence.

**Key Methods**:

```typescript
class ConversationService {
  async createConversation(title?: string): Promise<string | null>

  async getConversation(conversationId: string): Promise<Conversation | null>

  async listConversations(limit = 50): Promise<Conversation[]>

  async updateConversationTitle(id: string, title: string): Promise<void>

  async deleteConversation(conversationId: string): Promise<void>

  async saveMessage(
    conversationId: string,
    message: Message,
    sequenceNumber: number
  ): Promise<void>

  async getMessages(conversationId: string): Promise<Message[]>

  async saveDocument(
    conversationId: string,
    document: any
  ): Promise<void>

  async getDocuments(conversationId: string): Promise<any[]>

  async generateConversationTitle(firstMessage: string): Promise<string>
}
```

**Usage Example**:
```typescript
// Create new conversation
const conversationId = await conversationService.createConversation();

// Save user message
await conversationService.saveMessage(
  conversationId,
  userMessage,
  0 // sequence number
);

// Save document
await conversationService.saveDocument(conversationId, {
  file_name: 'report.pdf',
  content: extractedText,
  metadata: { word_count: 5000 }
});

// Load conversation later
const messages = await conversationService.getMessages(conversationId);
const documents = await conversationService.getDocuments(conversationId);
```

### 5. PreferencesService
**Location**: `src/services/preferencesService.ts`

User preferences and search history management.

**Key Methods**:

```typescript
class PreferencesService {
  async getMode(): Promise<'web' | 'work'>

  async setMode(mode: 'web' | 'work'): Promise<void>

  async saveSearchHistory(
    query: string,
    mode: 'web' | 'work',
    toolsUsed: string[],
    sources: Array<{ title: string; url: string }>,
    responsePreview: string
  ): Promise<void>

  async getSearchHistory(limit: number = 50): Promise<SearchHistory[]>

  async clearSearchHistory(): Promise<void>
}
```

**User ID Generation**:
```typescript
private getOrCreateUserId(): string {
  let userId = localStorage.getItem('insights_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('insights_user_id', userId);
  }
  return userId;
}
```

### 6. DocumentProcessor
**Location**: `src/utils/documentProcessor.ts`

Client-side document parsing utilities.

**Key Methods**:

```typescript
export const processDocuments = async (
  files: FileAttachment[]
): Promise<ProcessedDocument[]>

const processPDFDocument = async (
  fileName: string,
  blob: Blob
): Promise<ProcessedDocument>

const processTextDocument = async (
  fileName: string,
  blob: Blob
): Promise<ProcessedDocument>

const processWordDocument = async (
  fileName: string,
  blob: Blob
): Promise<ProcessedDocument>
```

**PDF Processing**:
```typescript
const processPDFDocument = async (fileName: string, blob: Blob) => {
  // 1. Load PDF
  const arrayBuffer = await blob.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  const chunks = [];

  // 2. Extract text from each page
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    let pageText = '';
    textContent.items.forEach((item: any) => {
      pageText += item.str + ' ';
    });

    // 3. Create chunk for this page
    chunks.push({
      id: `chunk-${pageNum}`,
      content: pageText.trim(),
      type: 'paragraph',
      metadata: { pageNumber: pageNum }
    });

    fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
  }

  // 4. Calculate metadata
  const wordCount = fullText.split(/\s+/).length;
  const characterCount = fullText.length;

  return {
    fileName,
    content: fullText,
    type: 'application/pdf',
    metadata: {
      pageCount: pdf.numPages,
      wordCount,
      characterCount
    },
    chunks
  };
};
```

**Chunking Strategy**:
- PDFs: One chunk per page
- Text files: Split by paragraphs (double newlines)
- Word docs: Split by sections
- Max chunk size: 1500 characters
- Overlap: 200 characters between chunks

### 7. DiagramGenerator
**Location**: `src/services/diagramGenerator.ts`

Dynamic diagram and chart generation.

**Key Methods**:

```typescript
class DynamicDiagramGenerator {
  static generateDiagram(request: DiagramRequest): DiagramData

  private static detectDiagramType(input: string): string

  private static generateBarChart(request: DiagramRequest): DiagramData
  private static generatePieChart(request: DiagramRequest): DiagramData
  private static generateFlowchart(request: DiagramRequest): DiagramData
  private static generateOrgChart(request: DiagramRequest): DiagramData
  private static generateTimeline(request: DiagramRequest): DiagramData
}
```

**Flowchart Generation**:
```typescript
private static generateFlowchart(request: DiagramRequest): DiagramData {
  const nodes: DiagramNode[] = [
    {
      id: 'start',
      x: 400,
      y: 50,
      width: 120,
      height: 60,
      text: 'Start',
      type: 'start'
    },
    {
      id: 'process1',
      x: 400,
      y: 150,
      width: 180,
      height: 80,
      text: 'Process Step 1',
      type: 'process'
    },
    {
      id: 'decision',
      x: 400,
      y: 280,
      width: 150,
      height: 100,
      text: 'Decision?',
      type: 'decision'
    },
    {
      id: 'end',
      x: 400,
      y: 450,
      width: 120,
      height: 60,
      text: 'End',
      type: 'end'
    }
  ];

  const connections: DiagramConnection[] = [
    { id: 'c1', from: 'start', to: 'process1' },
    { id: 'c2', from: 'process1', to: 'decision' },
    { id: 'c3', from: 'decision', to: 'end', label: 'Yes' }
  ];

  return {
    id: crypto.randomUUID(),
    type: 'flowchart',
    title: request.title,
    nodes,
    connections
  };
}
```

### 8. OpenAI Service
**Location**: `src/services/openaiService.ts`

Direct OpenAI API integration helpers.

**Key Functions**:

```typescript
export async function generateDiagramWithOpenAI(
  context: string,
  diagramType: string,
  title: string
): Promise<DiagramData>

export async function analyzeDocumentWithOpenAI(
  documentContent: string,
  question: string
): Promise<string>

export async function summarizeText(
  text: string,
  maxLength: number = 500
): Promise<string>
```

---

## Database Schema

### Tables Overview

The Insights-B platform uses Supabase (PostgreSQL) with 5 main tables:

1. **conversations** - Conversation sessions
2. **messages** - Chat messages
3. **documents** - Uploaded documents
4. **user_preferences** - User settings
5. **search_history** - Web search history

### Entity Relationship Diagram

```
┌─────────────────┐
│  conversations  │
│  id (PK)        │
│  title          │
│  created_at     │
│  updated_at     │
│  metadata       │
└────────┬────────┘
         │
         │ 1:N
         │
    ┌────┴───────────────────────┐
    │                            │
    v                            v
┌─────────────┐          ┌─────────────┐
│  messages   │          │  documents  │
│  id (PK)    │          │  id (PK)    │
│  conv_id(FK)│          │  conv_id(FK)│
│  role       │          │  file_name  │
│  content    │          │  content    │
│  metadata   │          │  chunks     │
│  seq_num    │          │  metadata   │
└─────────────┘          └─────────────┘

┌──────────────────┐     ┌──────────────────┐
│user_preferences  │     │  search_history  │
│  id (PK)         │     │  id (PK)         │
│  user_id         │     │  user_id         │
│  mode            │     │  query           │
│  created_at      │     │  mode            │
│  updated_at      │     │  tools_used      │
└──────────────────┘     │  sources         │
                         │  response        │
                         └──────────────────┘
```

### Table Definitions

#### 1. conversations

Stores conversation sessions.

```sql
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'New Conversation',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

**Columns**:
- `id` - Unique conversation identifier
- `title` - Auto-generated from first message
- `created_at` - Conversation start time
- `updated_at` - Last activity time (auto-updated)
- `metadata` - Additional conversation data (JSON)

**Sample Row**:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Analysis of Q3 Financial Report",
  "created_at": "2024-11-08T10:30:00Z",
  "updated_at": "2024-11-08T11:45:00Z",
  "metadata": {
    "document_count": 3,
    "message_count": 15,
    "tags": ["finance", "quarterly"]
  }
}
```

#### 2. messages

Stores individual chat messages.

```sql
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  sequence_number integer NOT NULL
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, sequence_number);
```

**Columns**:
- `id` - Unique message identifier
- `conversation_id` - Foreign key to conversations
- `role` - Message author ('user' | 'assistant' | 'system')
- `content` - Message text (supports Markdown)
- `metadata` - Analysis metadata, confidence, sources
- `created_at` - Message timestamp
- `sequence_number` - Message order in conversation

**Sample Row**:
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "assistant",
  "content": "Based on the Q3 report, revenue increased by 23%...",
  "metadata": {
    "analysisType": "summary",
    "confidence": 0.95,
    "sources": [
      {
        "fileName": "Q3_Report.pdf",
        "chunkId": "chunk-3",
        "relevance": 0.92
      }
    ],
    "processingTime": 2340,
    "tokenCount": 856
  },
  "created_at": "2024-11-08T10:31:00Z",
  "sequence_number": 1
}
```

#### 3. documents

Stores uploaded documents and their content.

```sql
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  content text NOT NULL,
  content_preview text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  chunks jsonb DEFAULT '[]'::jsonb,
  uploaded_at timestamptz DEFAULT now()
);

CREATE INDEX idx_documents_conversation ON documents(conversation_id);
```

**Columns**:
- `id` - Unique document identifier
- `conversation_id` - Foreign key to conversations
- `file_name` - Original filename
- `content` - Full extracted text
- `content_preview` - First 500 characters
- `metadata` - Document metadata (pages, words, etc.)
- `chunks` - Chunked content for RAG (JSON array)
- `uploaded_at` - Upload timestamp

**Sample Row**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "file_name": "Q3_Report.pdf",
  "content": "Quarterly Financial Report...\n\n[Full 50,000 character content]",
  "content_preview": "Quarterly Financial Report\n\nExecutive Summary\n\nThis quarter saw significant growth...",
  "metadata": {
    "word_count": 8543,
    "character_count": 52341,
    "page_count": 45,
    "language": "en"
  },
  "chunks": [
    {
      "id": "chunk-0",
      "content": "--- Page 1 ---\nQuarterly Financial Report...",
      "startIndex": 0,
      "endIndex": 1200,
      "type": "paragraph",
      "metadata": { "pageNumber": 1 }
    },
    {
      "id": "chunk-1",
      "content": "--- Page 2 ---\nRevenue Analysis...",
      "startIndex": 1200,
      "endIndex": 2400,
      "type": "paragraph",
      "metadata": { "pageNumber": 2 }
    }
  ],
  "uploaded_at": "2024-11-08T10:30:15Z"
}
```

#### 4. user_preferences

Stores user-specific settings.

```sql
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL UNIQUE,
  mode text NOT NULL DEFAULT 'work' CHECK (mode IN ('web', 'work')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Columns**:
- `id` - Unique preference record ID
- `user_id` - User identifier (from localStorage)
- `mode` - Last selected mode ('web' | 'work')
- `created_at` - First preference save
- `updated_at` - Last update time

#### 5. search_history

Tracks web search queries and results.

```sql
CREATE TABLE search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  query text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('web', 'work')),
  tools_used text[] DEFAULT ARRAY[]::text[],
  sources jsonb DEFAULT '[]'::jsonb,
  response_preview text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_search_history_user ON search_history(user_id, created_at DESC);
```

**Columns**:
- `id` - Unique search record ID
- `user_id` - User identifier
- `query` - Search query text
- `mode` - Mode when search was performed
- `tools_used` - Array of tool names used
- `sources` - JSON array of source objects
- `response_preview` - First 500 chars of response
- `created_at` - Search timestamp

**Sample Row**:
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440003",
  "user_id": "user_1699453200_abc123xyz",
  "query": "Latest AI developments 2024",
  "mode": "web",
  "tools_used": ["search_web", "scrape_webpage"],
  "sources": [
    {
      "title": "OpenAI Announces GPT-5",
      "url": "https://example.com/gpt5-announcement"
    },
    {
      "title": "Google's Gemini 2.0 Release",
      "url": "https://example.com/gemini-2"
    }
  ],
  "response_preview": "Recent AI developments in 2024 include major releases from OpenAI and Google. OpenAI announced GPT-5 with enhanced reasoning capabilities...",
  "created_at": "2024-11-08T14:22:00Z"
}
```

### Row Level Security (RLS)

All tables have RLS enabled for security. Current policies allow public access for demo purposes:

```sql
-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Demo policies (allow all)
CREATE POLICY "Anyone can view conversations"
  ON conversations FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can create conversations"
  ON conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
```

**Production RLS** (commented out, for future use):
```sql
-- Restrict to authenticated users only
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
```

### Database Triggers

**Auto-update conversation timestamp**:
```sql
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();
```

### Database Queries

**Common Operations**:

```typescript
// Create conversation
const { data: conv } = await supabase
  .from('conversations')
  .insert({ title: 'New Conversation' })
  .select('id')
  .maybeSingle();

// Save message
await supabase
  .from('messages')
  .insert({
    conversation_id: convId,
    role: 'user',
    content: 'What is this document about?',
    sequence_number: 0
  });

// Load conversation with messages
const { data: messages } = await supabase
  .from('messages')
  .select('*')
  .eq('conversation_id', convId)
  .order('sequence_number', { ascending: true });

// Search conversations
const { data: conversations } = await supabase
  .from('conversations')
  .select('*')
  .order('updated_at', { ascending: false })
  .limit(50);

// Delete conversation (cascade deletes messages and documents)
await supabase
  .from('conversations')
  .delete()
  .eq('id', convId);
```

---

## Dual-Mode System

### Architecture Overview

Insights-B operates in two distinct modes, each optimized for different use cases:

```
┌─────────────────────────────────────────────────┐
│              User Interface                      │
│  [🌐 Web Mode] ←→ ModeToggle ←→ [💼 Work Mode]  │
└──────────────┬──────────────────────┬───────────┘
               │                      │
               v                      v
        ┌──────────────┐      ┌──────────────┐
        │ Web Mode     │      │ Work Mode    │
        │              │      │              │
        │ AgenticService│      │IntelligentAgent│
        │              │      │              │
        │ - Web Search │      │ - Doc Analysis│
        │ - Scraping   │      │ - RAG        │
        │ - Function   │      │ - Diagrams   │
        │   Calling    │      │ - Charts     │
        └──────────────┘      └──────────────┘
```

### Web Mode (🌐)

**Purpose**: Real-time information retrieval from the internet.

**Use Cases**:
- Current events and news
- Real-time data (stock prices, weather)
- Research and fact-checking
- Product comparisons
- Latest documentation

**How it Works**:

1. **User selects Web mode** via ModeToggle
2. **User asks question**: "What's the latest news about SpaceX?"
3. **AgenticService** takes over:
   ```typescript
   const result = await agenticService.processQuery(
     query,
     'web',
     conversationHistory
   );
   ```
4. **OpenAI Function Calling**:
   - AI decides if web search is needed
   - Calls `search_web` tool with query
   - Optionally calls `scrape_webpage` for details
5. **WebSearchService** executes:
   - Searches DuckDuckGo
   - Parses results
   - Returns to AI
6. **AI synthesizes answer**:
   - Combines search results
   - Cites sources
   - Provides final response

**Example Interaction**:
```
User: "What are the key features of React 18?"

AI (thinking):
  1. Detects need for web search
  2. Calls search_web("React 18 features")
  3. Gets top 5 results
  4. Calls scrape_webpage() on official React blog
  5. Synthesizes answer

AI (response):
"React 18 introduces several major features:

1. **Automatic Batching**: Updates are batched automatically
2. **Transitions**: Mark updates as non-urgent
3. **Suspense**: Better async rendering
4. **Concurrent Rendering**: Improved performance

Sources:
1. [React 18 Release](https://react.dev/blog/2022/03/29/react-v18)
2. [React Docs - New Features](https://react.dev/reference/react)"
```

**Available Tools**:

```typescript
{
  "search_web": {
    "description": "Search the web for current information",
    "parameters": {
      "query": "string",
      "max_results": "number (default: 10)"
    }
  },
  "scrape_webpage": {
    "description": "Extract full content from a specific URL",
    "parameters": {
      "url": "string"
    }
  },
  "summarize_webpage": {
    "description": "Get a summary of a webpage",
    "parameters": {
      "url": "string",
      "summary_length": "short | medium | long"
    }
  }
}
```

**Persistence**:
- Queries saved to `search_history` table
- Tools used tracked
- Sources preserved
- Can replay searches

### Work Mode (💼)

**Purpose**: Deep analysis of uploaded documents.

**Use Cases**:
- Document summarization
- Q&A over PDFs, Word docs
- Data extraction
- Comparative analysis
- Report generation
- Diagram creation

**How it Works**:

1. **User uploads documents**:
   ```typescript
   <FileUpload onFileUpload={handleFileUpload} />
   ```
2. **Document processing**:
   ```typescript
   const processed = await processDocuments(uploadedFiles);
   // Extracts text, creates chunks, generates metadata
   ```
3. **User asks question**: "What are the key findings?"
4. **IntelligentAgent** analyzes intent:
   ```typescript
   const intent = analyzeUserIntent(request);
   // Returns: { type: 'document_analysis', confidence: 0.95 }
   ```
5. **Document analysis**:
   - Find relevant chunks
   - Build context from documents
   - Call OpenAI with full context
6. **Response with sources**:
   - AI answer based on documents
   - Cites specific pages/sections
   - Shows confidence level

**Example Interaction**:
```
User uploads: "Q3_Financial_Report.pdf" (45 pages, 8,543 words)

System: "✅ Successfully processed Q3_Financial_Report.pdf - 8,543 words, 45 pages"

User: "What was the revenue growth this quarter?"

AI (thinking):
  1. Detects document_analysis intent
  2. Searches document chunks for "revenue" + "growth"
  3. Finds relevant sections on pages 3, 12, 28
  4. Builds context with those sections
  5. Calls GPT-4o-mini with context

AI (response):
"Based on the Q3 Financial Report:

Revenue grew by **23.4%** compared to Q2, reaching **$42.7M**.

Key drivers:
- Enterprise contracts: +35% ($18.2M)
- SaaS subscriptions: +18% ($15.3M)
- Professional services: +12% ($9.2M)

**Sources:**
- Q3_Financial_Report.pdf, Page 3 (Executive Summary)
- Q3_Financial_Report.pdf, Page 12 (Revenue Breakdown)
- Q3_Financial_Report.pdf, Page 28 (YoY Comparison)

**Confidence:** 95%"
```

**Intent Types**:

```typescript
enum IntentType {
  DOCUMENT_ANALYSIS = 'document_analysis',    // Q&A over docs
  CHART_GENERATION = 'chart_generation',      // Create charts
  DIAGRAM_CREATION = 'diagram_creation',      // Create diagrams
  DATA_EXTRACTION = 'data_extraction',        // Extract tables/data
  GENERAL_CHAT = 'general_chat'               // General questions
}
```

**RAG Pipeline**:

```
1. Document Upload
   └→ Extract text (PDF.js, custom parsers)

2. Chunking
   └→ Split into semantic chunks (1500 chars, 200 overlap)

3. Storage
   └→ Save to Supabase with metadata

4. User Query
   └→ Analyze intent

5. Retrieval
   └→ Find relevant chunks (keyword matching)

6. Augmentation
   └→ Build prompt with context

7. Generation
   └→ Call GPT-4o-mini with full context

8. Response
   └→ Return answer with sources
```

### Mode Switching

**Automatic Persistence**:
```typescript
// When user switches modes
const handleModeChange = async (newMode: 'web' | 'work') => {
  setMode(newMode);
  await preferencesService.setMode(newMode);
};

// On app load
useEffect(() => {
  const loadPreferences = async () => {
    const savedMode = await preferencesService.getMode();
    setMode(savedMode);
  };
  loadPreferences();
}, []);
```

**UI Indication**:
```typescript
<ModeToggle
  mode={mode}
  onChange={handleModeChange}
/>

// Visual states:
// Web mode: Blue highlight, Globe icon
// Work mode: Teal highlight, Briefcase icon
```

### Mode Comparison

| Feature | Web Mode 🌐 | Work Mode 💼 |
|---------|------------|-------------|
| **Data Source** | Internet (DuckDuckGo) | Uploaded documents |
| **Freshness** | Real-time | Static (upload time) |
| **Context Length** | 10,000 chars per page | Full document(s) |
| **Tools Used** | search_web, scrape_webpage | document_analysis, RAG |
| **Sources** | URLs with titles | Page numbers, sections |
| **Best For** | Current info, research | Document Q&A, analysis |
| **Limitations** | CORS proxy dependent | Requires document upload |
| **Persistence** | search_history table | conversations + documents |

---

## AI Integration

### OpenAI GPT-4o-mini

**Model**: `gpt-4o-mini`
**Purpose**: Fast, cost-effective AI for both modes

**Configuration**:
```typescript
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true  // Client-side usage
});
```

### Function Calling (Web Mode)

**Tool Definition**:
```typescript
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'search_web',
      description: 'Search the web for current information using DuckDuckGo',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The search query to look up'
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10
          }
        },
        required: ['query']
      }
    }
  }
];
```

**Usage**:
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: conversationHistory,
  tools: tools,
  tool_choice: 'auto'  // Let AI decide
});

// Check if AI wants to use a tool
if (response.choices[0].message.tool_calls) {
  const toolCall = response.choices[0].message.tool_calls[0];

  // Execute the tool
  const result = await executeToolCall(
    toolCall.function.name,
    JSON.parse(toolCall.function.arguments)
  );

  // Return result to AI
  const finalResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      ...conversationHistory,
      response.choices[0].message,
      {
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result)
      }
    ]
  });
}
```

### Prompt Engineering

**System Prompts**:

```typescript
// Work Mode - Document Analysis
const systemPrompt = `You are an intelligent document analysis assistant.

Your capabilities:
- Analyze uploaded documents (PDFs, Word, Text)
- Answer questions based ONLY on document content
- Cite sources with page numbers and sections
- Provide confidence scores
- Generate diagrams when helpful

Rules:
1. ONLY use information from provided documents
2. If answer not in documents, say "I cannot find this information in the documents"
3. Always cite sources: "According to [Document Name], page [X]..."
4. Be concise but thorough
5. Use bullet points for lists
6. Suggest diagrams when appropriate`;

// Web Mode - Real-time Search
const systemPrompt = `You are a helpful AI assistant with real-time web search capabilities.

Your capabilities:
- Search the web for current information
- Scrape and analyze web pages
- Synthesize information from multiple sources
- Provide citations for all claims

Rules:
1. Use web search for current/real-time info
2. Always cite sources with URLs
3. Verify information from multiple sources when possible
4. Indicate if information is from a single source
5. Be transparent about limitations`;
```

**Few-Shot Examples**:

```typescript
const fewShotExamples = [
  {
    role: 'user',
    content: 'What are the key findings in the document?'
  },
  {
    role: 'assistant',
    content: `Based on the document analysis, here are the key findings:

1. **Revenue Growth**: 23% increase YoY (Page 3)
2. **Customer Retention**: 94% retention rate (Page 8)
3. **Market Share**: Expanded to 18% of target market (Page 15)

**Sources:**
- Annual_Report.pdf, Page 3 (Executive Summary)
- Annual_Report.pdf, Page 8 (Customer Metrics)
- Annual_Report.pdf, Page 15 (Market Analysis)

**Confidence:** 98%`
  }
];
```

### Temperature Settings

```typescript
// Document Analysis - Lower temperature for accuracy
temperature: 0.3  // More deterministic, factual

// Creative Tasks - Higher temperature
temperature: 0.7  // More creative, varied

// Code Generation - Lowest temperature
temperature: 0.1  // Very precise, reproducible

// General Chat - Medium temperature
temperature: 0.5  // Balanced
```

### Token Management

```typescript
// Max tokens by task
const tokenLimits = {
  documentAnalysis: 3000,    // Detailed analysis
  summary: 500,              // Concise summaries
  chatResponse: 1500,        // Standard responses
  codeGeneration: 2000,      // Code blocks
  diagramGeneration: 1000    // Diagram descriptions
};

// Usage tracking
interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// Estimate tokens (rough approximation)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
```

### Streaming Responses

```typescript
// Enable streaming for real-time feedback
const stream = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: conversationHistory,
  stream: true
});

for await (const chunk of stream) {
  const content = chunk.choices[0]?.delta?.content || '';

  // Update UI in real-time
  setMessages(prev => prev.map(msg =>
    msg.id === streamingMessageId
      ? { ...msg, content: msg.content + content }
      : msg
  ));
}

// Mark streaming complete
setMessages(prev => prev.map(msg =>
  msg.id === streamingMessageId
    ? { ...msg, isStreaming: false }
    : msg
));
```

### Error Handling

```typescript
try {
  const response = await openai.chat.completions.create({...});
} catch (error: any) {
  if (error.response?.status === 401) {
    return '🔑 API Key Error: Your OpenAI API key is invalid.';
  } else if (error.response?.status === 429) {
    return '⏱️ Rate Limited: Too many requests. Please wait.';
  } else if (error.message.includes('quota')) {
    return '💳 Quota Exceeded: Check your OpenAI billing.';
  } else {
    return `❌ Error: ${error.message}`;
  }
}
```

---

## Usage Examples

### Basic Document Analysis

```typescript
// 1. Upload a document
const file = new File([pdfBlob], "report.pdf", { type: "application/pdf" });
const attachment = await createFileAttachment(file);
handleFileUpload(attachment);

// 2. Wait for processing
// System automatically processes and displays:
// "✅ Successfully processed report.pdf - 5,000 words, 20 pages"

// 3. Ask questions
await handleSendMessage("What are the main conclusions?");

// Response includes:
// - AI-generated answer
// - Source citations (page numbers)
// - Confidence score
// - Processing metadata
```

### Web Search Example

```typescript
// 1. Switch to Web mode
setMode('web');

// 2. Ask a current events question
await handleSendMessage("What's the latest news about AI?");

// Behind the scenes:
// - AgenticService detects need for search
// - Calls search_web tool
// - Gets top 10 results from DuckDuckGo
// - Optionally scrapes top pages
// - Synthesizes answer with citations

// Response includes:
// - Synthesized answer
// - Clickable source links
// - Tool execution trace
```

### Diagram Generation

```typescript
// Ask for a flowchart
await handleSendMessage("Create a flowchart showing the login process");

// System:
// 1. Detects diagram_creation intent
// 2. Generates diagram data
// 3. Renders interactive SVG
// 4. Allows editing and export

// User can:
// - Drag nodes
// - Edit text
// - Export as PNG/SVG
// - Share diagram
```

### Multi-Document Analysis

```typescript
// Upload multiple documents
handleFileUpload(createFileAttachment(doc1)); // Q1_Report.pdf
handleFileUpload(createFileAttachment(doc2)); // Q2_Report.pdf
handleFileUpload(createFileAttachment(doc3)); // Q3_Report.pdf

// Ask comparative question
await handleSendMessage("Compare revenue trends across all three quarters");

// System:
// - Searches all three documents
// - Finds revenue data in each
// - Compares and synthesizes
// - Cites all sources
// - May generate chart automatically
```

### Conversation Management

```typescript
// Create new conversation
await handleNewConversation();

// Save conversation (automatic)
// - Messages saved as you chat
// - Documents saved on upload
// - All linked to conversation_id

// Load previous conversation
const conversations = await conversationService.listConversations();
await handleLoadConversation(conversations[0]);

// Delete conversation
await handleDeleteConversation(conversationId);
```

---

## Deployment

### Build for Production

```bash
# Install dependencies
npm install

# Build optimized bundle
npm run build

# Output: dist/ directory
# - dist/index.html
# - dist/assets/*.js (minified)
# - dist/assets/*.css
```

### Environment Variables for Production

```env
# Required
VITE_OPENAI_API_KEY=sk-prod-key-here

# Recommended (for persistence)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key
```

### Hosting Options

#### 1. Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# vercel.com → Project → Settings → Environment Variables
```

#### 2. Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
netlify deploy --prod

# Configure environment variables in Netlify UI
```

#### 3. Static Hosting (S3, Cloudflare Pages)

```bash
# Build
npm run build

# Upload dist/ directory to your host
aws s3 sync dist/ s3://your-bucket --acl public-read
```

### Supabase Production Setup

1. **Create production project** in Supabase
2. **Run migration** in SQL Editor
3. **Configure RLS** for production security
4. **Update environment variables** in hosting platform
5. **Test connection** before going live

### Performance Optimization

**Code Splitting**:
```typescript
// Lazy load heavy components
const DiagramEditor = lazy(() => import('./components/DiagramEditor'));
const ChartRenderer = lazy(() => import('./components/ChartRenderer'));

<Suspense fallback={<LoadingSpinner />}>
  <DiagramEditor diagram={diagram} />
</Suspense>
```

**Image Optimization**:
```bash
# Compress images before deployment
npx @squoosh/cli --webp auto public/*.png
```

**Bundle Analysis**:
```bash
# Analyze bundle size
npm run build -- --mode analyze
```

---

## Troubleshooting

### Common Issues

#### 1. API Key Not Working

**Error**: "🔑 API Key Error: Your OpenAI API key is invalid."

**Solutions**:
- Verify key starts with `sk-`
- Check `.env` file has correct variable name: `VITE_OPENAI_API_KEY`
- Restart dev server after changing `.env`
- Check OpenAI account status and billing

#### 2. Document Processing Fails

**Error**: "❌ Document Processing Error"

**Solutions**:
- Ensure file size < 25MB
- Check file format is supported (PDF, DOCX, TXT)
- Try converting document to PDF
- Check browser console for detailed error
- Verify PDF.js worker is loading correctly

#### 3. Supabase Connection Issues

**Error**: "Supabase credentials not found"

**Solutions**:
- Verify `.env` has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project is active
- Verify RLS policies allow access
- Test connection in browser console:
  ```javascript
  console.log(import.meta.env.VITE_SUPABASE_URL);
  ```

#### 4. Web Search Not Working

**Error**: Search returns no results

**Solutions**:
- Check network connectivity
- Verify CORS proxy (allorigins.win) is accessible
- Try different search query
- Check browser console for blocked requests
- Ensure Web mode is selected

#### 5. Slow Performance

**Solutions**:
- Clear browser cache
- Check network speed
- Reduce document size/count
- Use lower temperature setting
- Enable production build optimizations

### Debug Mode

Enable detailed logging:

```typescript
// In App.tsx or service files
const DEBUG = true;

if (DEBUG) {
  console.log('🔍 User query:', query);
  console.log('📄 Documents:', documents.length);
  console.log('💬 History:', conversationHistory.length);
  console.log('🎯 Intent:', intent);
  console.log('✅ Response:', response);
}
```

### Browser Console Checks

```javascript
// Check environment variables
console.log('API Key:', import.meta.env.VITE_OPENAI_API_KEY ? 'Set' : 'Missing');
console.log('Supabase:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');

// Check Supabase connection
console.log('Supabase enabled:', isSupabaseEnabled);

// Check mode
console.log('Current mode:', mode);

// Check documents
console.log('Processed documents:', processedDocuments.length);
```

---

## Performance Optimization

### Frontend Optimizations

**1. Code Splitting**:
```typescript
const DiagramEditor = lazy(() => import('./components/DiagramEditor'));
const ChartRenderer = lazy(() => import('./components/ChartRenderer'));
```

**2. Memo Usage**:
```typescript
const MemoizedChatMessage = memo(ChatMessage, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content &&
         prev.message.isStreaming === next.message.isStreaming;
});
```

**3. Virtual Scrolling** (for long conversations):
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={100}
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

### Database Optimizations

**1. Indexes**:
```sql
CREATE INDEX idx_messages_conversation ON messages(conversation_id, sequence_number);
CREATE INDEX idx_documents_conversation ON documents(conversation_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
```

**2. Pagination**:
```typescript
const { data } = await supabase
  .from('conversations')
  .select('*')
  .order('updated_at', { ascending: false })
  .range(0, 49);  // First 50
```

**3. Selective Loading**:
```typescript
// Load only needed columns
const { data } = await supabase
  .from('documents')
  .select('id, file_name, content_preview, metadata')  // Skip full content
  .eq('conversation_id', convId);
```

### AI Optimization

**1. Chunk Size Tuning**:
```typescript
const OPTIMAL_CHUNK_SIZE = 1500;  // chars
const CHUNK_OVERLAP = 200;        // chars
```

**2. Caching**:
```typescript
const responseCache = new Map<string, string>();

async function getCachedResponse(key: string, generator: () => Promise<string>) {
  if (responseCache.has(key)) {
    return responseCache.get(key)!;
  }
  const response = await generator();
  responseCache.set(key, response);
  return response;
}
```

**3. Parallel Processing**:
```typescript
// Process multiple documents in parallel
const results = await Promise.all(
  files.map(file => processDocument(file))
);
```

---

## Security

### API Key Protection

**DO NOT**:
- ❌ Commit `.env` to Git
- ❌ Expose in client-side code
- ❌ Log API keys
- ❌ Share API keys publicly

**DO**:
- ✅ Use environment variables
- ✅ Add `.env` to `.gitignore`
- ✅ Rotate keys regularly
- ✅ Use different keys for dev/prod
- ✅ Monitor usage in OpenAI dashboard

### Content Security

**XSS Prevention**:
```typescript
// Use react-markdown for safe rendering
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Sanitize links
    a: ({ href, children }) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }}
>
  {message.content}
</ReactMarkdown>
```

### Database Security

**RLS Policies** (production):
```sql
-- Restrict to authenticated users
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Prevent unauthorized access
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
```

### CORS Protection

**Supabase Configuration**:
```javascript
// Add allowed origins in Supabase dashboard
// Settings → API → CORS Origins
https://yourdomain.com
http://localhost:5173
```

---

## Contributing

### Development Workflow

1. **Fork the repository**
```bash
git clone https://github.com/yourusername/insights-b.git
cd insights-b
```

2. **Create feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make changes and test**
```bash
npm run dev
# Test your changes thoroughly
```

4. **Run linter**
```bash
npm run lint
```

5. **Build and verify**
```bash
npm run build
npm run preview
```

6. **Commit with clear message**
```bash
git add .
git commit -m "feat: Add web search history visualization"
```

7. **Push and create PR**
```bash
git push origin feature/your-feature-name
# Create PR on GitHub
```

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Tailwind CSS for styling
- Write clear, descriptive variable names
- Add comments for complex logic
- Keep functions under 100 lines

### Testing Guidelines

- Test all modes (Web and Work)
- Test with various document types
- Test error handling
- Test on different browsers
- Test mobile responsiveness

---

## License

MIT License - see LICENSE file for details

---

## Support

### Documentation
- Full documentation: This README
- Component docs: See inline JSDoc comments
- API reference: See [API Reference](#api-reference) section

### Community
- GitHub Issues: Report bugs and request features
- Discussions: Ask questions and share ideas

### Commercial Support
For enterprise support and custom development, contact: [your-email@example.com]

---

## Acknowledgments

- **OpenAI** - GPT-4o-mini model
- **Supabase** - Database and auth
- **Vercel** - Deployment platform
- **React** - UI framework
- **Vite** - Build tool
- **PDF.js** - PDF parsing
- **DuckDuckGo** - Web search

---

## Changelog

### v1.0.0 (2024-11-08)
- ✨ Initial release
- 🌐 Web Mode with agentic search
- 💼 Work Mode with document analysis
- 📊 Dynamic diagram generation
- 💾 Conversation persistence
- 🎨 Dark/Light theme support
- 📱 Responsive design
- 🔒 Row-Level Security

---

**Built with ❤️ using React, TypeScript, OpenAI, and Supabase**

**Star ⭐ this repo if you find it useful!**
