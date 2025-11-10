#!/usr/bin/env python3
"""
FastMCP Server for Document Analysis Chatbot
Provides all core functionality as MCP tools
"""

import asyncio
import json
import os
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, AsyncIterator, Any
import base64
import io

from fastmcp import FastMCP
from pydantic import BaseModel, Field
import aiofiles
import openai
from PIL import Image, ImageDraw, ImageFont
import docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import markdown
from jinja2 import Template

# Import Docling processor
from docling_processor import get_processor

# Initialize FastMCP app
app = FastMCP("Document Analysis Server")

# Global storage for processed documents
document_store: Dict[str, Dict] = {}
conversation_store: Dict[str, List] = {}

# OpenAI client
openai_client = None

def init_openai_client(api_key: str):
    """Initialize OpenAI client with API key"""
    global openai_client
    openai_client = openai.OpenAI(api_key=api_key)

# Pydantic models for type safety
class DocumentMetadata(BaseModel):
    page_count: Optional[int] = None
    word_count: int
    character_count: int
    language: Optional[str] = None
    created_date: Optional[datetime] = None
    modified_date: Optional[datetime] = None
    author: Optional[str] = None
    title: Optional[str] = None
    subject: Optional[str] = None
    keywords: Optional[List[str]] = None

class DocumentChunk(BaseModel):
    id: str
    content: str
    start_index: int
    end_index: int
    chunk_type: str = "paragraph"
    metadata: Dict = {}

class ProcessedDocument(BaseModel):
    id: str
    file_name: str
    content: str
    file_type: str
    metadata: DocumentMetadata
    chunks: List[DocumentChunk]
    created_at: datetime

class DiagramNode(BaseModel):
    id: str
    x: int
    y: int
    width: int
    height: int
    text: str
    node_type: str

class DiagramConnection(BaseModel):
    id: str
    from_node: str
    to_node: str
    label: Optional[str] = None

class DiagramData(BaseModel):
    id: str
    diagram_type: str
    title: str
    nodes: List[DiagramNode]
    connections: List[DiagramConnection]

class ChatMessage(BaseModel):
    id: str
    message_type: str  # 'user' or 'assistant'
    content: str
    timestamp: datetime
    metadata: Optional[Dict] = None

# =============================================================================
# DOCUMENT PROCESSING TOOLS
# =============================================================================

@app.tool()
async def process_document(
    file_content: str,
    file_name: str,
    file_type: str
) -> Dict[str, Any]:
    """
    Process uploaded documents using enterprise-grade Docling processor.
    Supports: PDF, DOCX, PPTX, XLSX, Images (with OCR), HTML, TXT

    Args:
        file_content: Base64 encoded file content
        file_name: Name of the file
        file_type: MIME type of the file

    Returns:
        Dictionary containing processed document data with tables and structure
    """
    try:
        # Decode base64 content
        file_data = base64.b64decode(file_content)

        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=Path(file_name).suffix) as temp_file:
            temp_file.write(file_data)
            temp_path = temp_file.name

        try:
            # Get processor instance
            processor = get_processor()

            # Process document with Docling (+ PyMuPDF fallback)
            result = await processor.process_document(temp_path, file_type)

            # Generate unique document ID
            doc_id = str(uuid.uuid4())
            result["id"] = doc_id

            # Store in document store for later retrieval
            document_store[doc_id] = result

            # Return summary response
            return {
                "success": result.get("success", True),
                "documentId": doc_id,
                "fileName": result["fileName"],
                "processor": result.get("processor", "unknown"),
                "contentPreview": result["content"][:500] + "..." if len(result["content"]) > 500 else result["content"],
                "metadata": result["metadata"],
                "tableCount": len(result.get("tables", [])),
                "chunkCount": len(result.get("chunks", [])),
                "hasStructuredData": len(result.get("tables", [])) > 0,
                "processedAt": result.get("processedAt")
            }

        finally:
            # Clean up temp file
            try:
                os.unlink(temp_path)
            except:
                pass

    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to process document: {str(e)}",
            "fileName": file_name,
            "processor": "error"
        }


@app.tool()
async def get_document_full_data(document_id: str) -> Dict[str, Any]:
    """
    Get full document data including all tables and chunks

    Args:
        document_id: Unique document identifier

    Returns:
        Complete document data
    """
    try:
        if document_id not in document_store:
            return {
                "success": False,
                "error": f"Document {document_id} not found"
            }

        return {
            "success": True,
            **document_store[document_id]
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@app.tool()
async def get_document_tables(document_id: str) -> Dict[str, Any]:
    """
    Get extracted tables from a processed document

    Args:
        document_id: Unique document identifier

    Returns:
        List of extracted tables with structure
    """
    try:
        if document_id not in document_store:
            return {
                "success": False,
                "error": f"Document {document_id} not found"
            }

        doc = document_store[document_id]

        return {
            "success": True,
            "documentId": document_id,
            "fileName": doc["fileName"],
            "tables": doc.get("tables", []),
            "tableCount": len(doc.get("tables", []))
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# =============================================================================
# DOCUMENT SEARCH TOOLS
# =============================================================================

@app.tool()
async def search_documents(
    query: str,
    document_ids: Optional[List[str]] = None,
    max_results: int = 10
) -> Dict[str, Any]:
    """
    Search through processed documents using TF-IDF similarity.
    
    Args:
        query: Search query
        document_ids: Optional list of document IDs to search in
        max_results: Maximum number of results to return
    
    Returns:
        Dictionary containing search results
    """
    try:
        # Get documents to search
        docs_to_search = []
        if document_ids:
            docs_to_search = [document_store[doc_id] for doc_id in document_ids if doc_id in document_store]
        else:
            docs_to_search = list(document_store.values())
        
        if not docs_to_search:
            return {"success": True, "results": [], "total_results": 0}
        
        # Collect all chunks
        all_chunks = []
        chunk_to_doc = {}
        
        for doc in docs_to_search:
            for chunk in doc['chunks']:
                all_chunks.append(chunk['content'])
                chunk_to_doc[len(all_chunks) - 1] = doc
        
        if not all_chunks:
            return {"success": True, "results": [], "total_results": 0}
        
        # Create TF-IDF vectors
        vectorizer = TfidfVectorizer(stop_words='english', max_features=1000)
        tfidf_matrix = vectorizer.fit_transform(all_chunks + [query])
        
        # Calculate similarities
        query_vector = tfidf_matrix[-1]
        chunk_vectors = tfidf_matrix[:-1]
        similarities = cosine_similarity(query_vector, chunk_vectors).flatten()
        
        # Get top results
        top_indices = np.argsort(similarities)[::-1][:max_results]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0.1:  # Minimum similarity threshold
                doc = chunk_to_doc[idx]
                chunk = doc['chunks'][idx % len(doc['chunks'])]
                
                results.append({
                    "document_id": doc['id'],
                    "document_name": doc['file_name'],
                    "chunk_id": chunk['id'],
                    "content": chunk['content'][:300] + "..." if len(chunk['content']) > 300 else chunk['content'],
                    "similarity_score": float(similarities[idx]),
                    "chunk_metadata": chunk.get('metadata', {})
                })
        
        return {
            "success": True,
            "results": results,
            "total_results": len(results),
            "query": query
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Search failed: {str(e)}",
            "results": []
        }

# =============================================================================
# AI ANALYSIS TOOLS
# =============================================================================

@app.tool()
async def setup_openai_client(api_key: str) -> Dict[str, Any]:
    """
    Setup OpenAI client with API key.
    
    Args:
        api_key: OpenAI API key
    
    Returns:
        Success status
    """
    try:
        init_openai_client(api_key)
        
        # Test the API key
        response = await asyncio.to_thread(
            openai_client.models.list
        )
        
        return {
            "success": True,
            "message": "OpenAI client initialized successfully",
            "models_available": len(response.data) > 0
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to initialize OpenAI client: {str(e)}"
        }

@app.tool()
async def analyze_document(
    question: str,
    document_ids: List[str],
    conversation_id: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 3000
) -> Dict[str, Any]:
    """
    Analyze documents using OpenAI and provide comprehensive response.
    
    Args:
        question: User's question
        document_ids: List of document IDs to analyze
        conversation_id: Optional conversation ID for context
        temperature: OpenAI temperature parameter
        max_tokens: Maximum tokens for response
    
    Returns:
        Analysis response with metadata
    """
    try:
        if not openai_client:
            return {
                "success": False,
                "error": "OpenAI client not initialized. Call setup_openai_client first."
            }
        
        # Get documents
        documents = [document_store[doc_id] for doc_id in document_ids if doc_id in document_store]
        if not documents:
            return {
                "success": False,
                "error": "No valid documents found for analysis"
            }
        
        # Build context
        context = _build_document_context(documents, question)
        
        # Get conversation history
        conversation_history = []
        if conversation_id and conversation_id in conversation_store:
            conversation_history = conversation_store[conversation_id][-10:]  # Last 10 messages
        
        # Build messages
        messages = _build_conversation_messages(conversation_history, question, context)
        
        # Call OpenAI
        response = await asyncio.to_thread(
            openai_client.chat.completions.create,
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        content = response.choices[0].message.content
        
        # Analyze response
        analysis_type = _determine_analysis_type(question)
        needs_diagram = _analyze_diagram_needs(question, content)
        confidence = _calculate_confidence(content, documents)
        
        # Store conversation
        if conversation_id:
            if conversation_id not in conversation_store:
                conversation_store[conversation_id] = []
            
            conversation_store[conversation_id].extend([
                ChatMessage(
                    id=str(uuid.uuid4()),
                    message_type="user",
                    content=question,
                    timestamp=datetime.now()
                ).dict(),
                ChatMessage(
                    id=str(uuid.uuid4()),
                    message_type="assistant",
                    content=content,
                    timestamp=datetime.now(),
                    metadata={
                        "analysis_type": analysis_type,
                        "confidence": confidence,
                        "document_ids": document_ids
                    }
                ).dict()
            ])
        
        return {
            "success": True,
            "content": content,
            "analysis_type": analysis_type,
            "confidence": confidence,
            "needs_diagram": needs_diagram["needs_diagram"],
            "diagram_type": needs_diagram.get("diagram_type"),
            "diagram_title": needs_diagram.get("diagram_title"),
            "document_sources": [{"id": doc["id"], "name": doc["file_name"]} for doc in documents],
            "token_usage": {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Analysis failed: {str(e)}"
        }

@app.tool()
async def analyze_document_streaming(
    question: str,
    document_ids: List[str],
    conversation_id: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 3000
) -> AsyncIterator[str]:
    """
    Analyze documents with streaming response.
    
    Args:
        question: User's question
        document_ids: List of document IDs to analyze
        conversation_id: Optional conversation ID for context
        temperature: OpenAI temperature parameter
        max_tokens: Maximum tokens for response
    
    Yields:
        Streaming response chunks
    """
    try:
        if not openai_client:
            yield json.dumps({"error": "OpenAI client not initialized"})
            return
        
        # Get documents
        documents = [document_store[doc_id] for doc_id in document_ids if doc_id in document_store]
        if not documents:
            yield json.dumps({"error": "No valid documents found"})
            return
        
        # Build context and messages
        context = _build_document_context(documents, question)
        conversation_history = []
        if conversation_id and conversation_id in conversation_store:
            conversation_history = conversation_store[conversation_id][-10:]
        
        messages = _build_conversation_messages(conversation_history, question, context)
        
        # Stream response
        full_content = ""
        async for chunk in await asyncio.to_thread(
            openai_client.chat.completions.create,
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True
        ):
            if chunk.choices[0].delta.content:
                content_chunk = chunk.choices[0].delta.content
                full_content += content_chunk
                yield json.dumps({"chunk": content_chunk})
        
        # Send final metadata
        analysis_type = _determine_analysis_type(question)
        confidence = _calculate_confidence(full_content, documents)
        needs_diagram = _analyze_diagram_needs(question, full_content)
        
        # Store conversation
        if conversation_id:
            if conversation_id not in conversation_store:
                conversation_store[conversation_id] = []
            
            conversation_store[conversation_id].extend([
                ChatMessage(
                    id=str(uuid.uuid4()),
                    message_type="user",
                    content=question,
                    timestamp=datetime.now()
                ).dict(),
                ChatMessage(
                    id=str(uuid.uuid4()),
                    message_type="assistant",
                    content=full_content,
                    timestamp=datetime.now(),
                    metadata={
                        "analysis_type": analysis_type,
                        "confidence": confidence,
                        "document_ids": document_ids
                    }
                ).dict()
            ])
        
        yield json.dumps({
            "final": True,
            "analysis_type": analysis_type,
            "confidence": confidence,
            "needs_diagram": needs_diagram["needs_diagram"],
            "diagram_type": needs_diagram.get("diagram_type"),
            "diagram_title": needs_diagram.get("diagram_title")
        })
        
    except Exception as e:
        yield json.dumps({"error": f"Streaming analysis failed: {str(e)}"})

def _build_document_context(documents: List[Dict], question: str) -> str:
    """Build document context for AI analysis"""
    context = "=== UPLOADED DOCUMENTS ===\n\n"
    
    for doc in documents:
        context += f"--- {doc['file_name']} ---\n"
        if doc['content'] and not doc['content'].startswith('ERROR:'):
            context += doc['content'] + "\n\n"
        else:
            context += "Document could not be processed properly.\n\n"
    
    return context

def _build_conversation_messages(history: List[Dict], question: str, context: str) -> List[Dict]:
    """Build conversation messages for OpenAI"""
    messages = [
        {
            "role": "system",
            "content": """You are a helpful AI assistant that can analyze and discuss uploaded documents. You have access to the full content of the user's uploaded documents.

Key guidelines:
- Answer questions naturally and conversationally, just like ChatGPT
- You have access to the full document content - use it to answer questions accurately
- Reference specific details from the documents when relevant
- Maintain conversation context and remember what was discussed earlier
- Be helpful, friendly, and direct in your responses
- Only provide structured analysis if specifically requested
- If asked about costs, dates, names, or other specific details, look for them in the document content

For diagram requests (flowcharts, diagrams, processes, workflows), start your response with:
"DIAGRAM_NEEDED [type] [title]"

Remember: You can see and analyze the full document content. Use it to provide accurate, helpful answers."""
        }
    ]
    
    # Add document context
    if context.strip():
        messages.extend([
            {"role": "user", "content": f"Here are my uploaded documents:\n\n{context}"},
            {"role": "assistant", "content": "I can see your uploaded documents and I'm ready to help you with any questions about them. What would you like to know?"}
        ])
    
    # Add conversation history
    for msg in history:
        if msg['message_type'] == 'user':
            messages.append({"role": "user", "content": msg['content']})
        else:
            clean_content = msg['content']
            if 'DIAGRAM_NEEDED' in clean_content:
                clean_content = clean_content.split('\n')[1:] if '\n' in clean_content else clean_content
                clean_content = '\n'.join(clean_content) if isinstance(clean_content, list) else clean_content
            messages.append({"role": "assistant", "content": clean_content})
    
    # Add current question
    messages.append({"role": "user", "content": question})
    
    return messages

def _determine_analysis_type(question: str) -> str:
    """Determine the type of analysis based on question"""
    question_lower = question.lower()
    
    if any(word in question_lower for word in ['summary', 'summarize', 'overview']):
        return 'summary'
    elif any(word in question_lower for word in ['compare', 'difference', 'versus']):
        return 'comparison'
    elif any(word in question_lower for word in ['recommend', 'suggest', 'should']):
        return 'recommendation'
    elif any(word in question_lower for word in ['extract', 'find', 'list']):
        return 'extraction'
    else:
        return 'analysis'

def _analyze_diagram_needs(question: str, content: str) -> Dict[str, Any]:
    """Analyze if response needs a diagram"""
    needs_diagram = 'DIAGRAM_NEEDED' in content or any(word in question.lower() for word in [
        'flowchart', 'diagram', 'process flow', 'workflow', 'organizational chart', 'timeline', 'chart'
    ])
    
    diagram_type = 'flowchart'
    diagram_title = 'Generated Diagram'
    
    if 'DIAGRAM_NEEDED' in content:
        lines = content.split('\n')
        for line in lines:
            if line.startswith('DIAGRAM_NEEDED'):
                parts = line.split(' ', 2)
                if len(parts) >= 2:
                    diagram_type = parts[1]
                if len(parts) >= 3:
                    diagram_title = parts[2]
                break
    elif needs_diagram:
        question_lower = question.lower()
        if 'organizational' in question_lower or 'org chart' in question_lower:
            diagram_type = 'organizational'
            diagram_title = 'Organizational Structure'
        elif 'timeline' in question_lower or 'schedule' in question_lower:
            diagram_type = 'timeline'
            diagram_title = 'Project Timeline'
        elif 'process' in question_lower or 'workflow' in question_lower:
            diagram_type = 'process'
            diagram_title = 'Process Workflow'
        elif 'flowchart' in question_lower:
            diagram_type = 'flowchart'
            diagram_title = 'Decision Flowchart'
    
    return {
        "needs_diagram": needs_diagram,
        "diagram_type": diagram_type,
        "diagram_title": diagram_title
    }

def _calculate_confidence(content: str, documents: List[Dict]) -> float:
    """Calculate confidence score for the response"""
    confidence = 0.5  # Base confidence
    
    # Increase based on content length and detail
    if len(content) > 500:
        confidence += 0.1
    if len(content) > 1000:
        confidence += 0.1
    
    # Increase if specific data or numbers are referenced
    import re
    if re.search(r'\d+%|\$\d+|\d+\.\d+', content):
        confidence += 0.1
    
    # Increase based on number of documents
    confidence += min(len(documents) * 0.05, 0.2)
    
    return min(confidence, 0.95)

# =============================================================================
# DIAGRAM GENERATION TOOLS
# =============================================================================

@app.tool()
async def generate_diagram(
    content: str,
    diagram_type: str = "flowchart",
    title: str = "Generated Diagram"
) -> Dict[str, Any]:
    """
    Generate diagram data based on content.
    
    Args:
        content: Content to base diagram on
        diagram_type: Type of diagram (flowchart, process, organizational, timeline)
        title: Diagram title
    
    Returns:
        Diagram data structure
    """
    try:
        if openai_client:
            # Try AI-generated diagram first
            try:
                diagram_data = await _generate_ai_diagram(content, diagram_type, title)
                if diagram_data:
                    return {"success": True, "diagram": diagram_data}
            except Exception as e:
                print(f"AI diagram generation failed: {e}")
        
        # Fallback to template-based diagram
        diagram_data = _generate_template_diagram(content, diagram_type, title)
        
        return {
            "success": True,
            "diagram": diagram_data
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Diagram generation failed: {str(e)}"
        }

async def _generate_ai_diagram(content: str, diagram_type: str, title: str) -> Optional[Dict]:
    """Generate diagram using AI"""
    prompt = f"""Create a professional {diagram_type} diagram based on this content: "{content[:1000]}"

Generate a JSON object with this EXACT structure:
{{
  "title": "{title}",
  "nodes": [
    {{"id": "1", "x": 100, "y": 50, "width": 180, "height": 80, "text": "Start Process", "type": "start"}},
    {{"id": "2", "x": 100, "y": 170, "width": 180, "height": 80, "text": "Analyze Requirements", "type": "process"}}
  ],
  "connections": [
    {{"id": "c1", "from": "1", "to": "2", "label": ""}}
  ]
}}

Requirements for {diagram_type}:
- Use appropriate node types: "start", "process", "decision", "end"
- Create 6-10 nodes showing clear workflow
- Position nodes with proper spacing (120px vertical, 200px horizontal)
- Add meaningful labels to connections where needed
"""

    try:
        response = await asyncio.to_thread(
            openai_client.chat.completions.create,
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are an expert diagram generator. Return ONLY valid JSON with no additional text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2,
            max_tokens=2000
        )
        
        json_content = response.choices[0].message.content.strip()
        
        # Clean up JSON
        if json_content.startswith('```json'):
            json_content = json_content.replace('```json\n', '').replace('\n```', '')
        elif json_content.startswith('```'):
            json_content = json_content.replace('```\n', '').replace('\n```', '')
        
        diagram_data = json.loads(json_content)
        
        return {
            "id": str(uuid.uuid4()),
            "type": diagram_type,
            "title": diagram_data.get("title", title),
            "nodes": diagram_data.get("nodes", []),
            "connections": diagram_data.get("connections", [])
        }
        
    except Exception as e:
        print(f"AI diagram generation error: {e}")
        return None

def _generate_template_diagram(content: str, diagram_type: str, title: str) -> Dict:
    """Generate template-based diagram"""
    diagram_id = str(uuid.uuid4())
    
    if diagram_type == 'organizational':
        return {
            "id": diagram_id,
            "type": diagram_type,
            "title": title,
            "nodes": [
                {"id": "1", "x": 200, "y": 50, "width": 160, "height": 70, "text": "Executive Team", "type": "executive"},
                {"id": "2", "x": 100, "y": 170, "width": 140, "height": 70, "text": "Operations", "type": "manager"},
                {"id": "3", "x": 300, "y": 170, "width": 140, "height": 70, "text": "Strategy", "type": "manager"},
                {"id": "4", "x": 50, "y": 290, "width": 120, "height": 70, "text": "Team A", "type": "employee"},
                {"id": "5", "x": 170, "y": 290, "width": 120, "height": 70, "text": "Team B", "type": "employee"}
            ],
            "connections": [
                {"id": "c1", "from": "1", "to": "2"},
                {"id": "c2", "from": "1", "to": "3"},
                {"id": "c3", "from": "2", "to": "4"},
                {"id": "c4", "from": "2", "to": "5"}
            ]
        }
    elif diagram_type == 'timeline':
        return {
            "id": diagram_id,
            "type": diagram_type,
            "title": title,
            "nodes": [
                {"id": "1", "x": 50, "y": 100, "width": 120, "height": 60, "text": "Phase 1", "type": "milestone"},
                {"id": "2", "x": 200, "y": 100, "width": 120, "height": 60, "text": "Phase 2", "type": "milestone"},
                {"id": "3", "x": 350, "y": 100, "width": 120, "height": 60, "text": "Phase 3", "type": "milestone"},
                {"id": "4", "x": 500, "y": 100, "width": 120, "height": 60, "text": "Completion", "type": "deliverable"}
            ],
            "connections": [
                {"id": "c1", "from": "1", "to": "2", "label": "3 months"},
                {"id": "c2", "from": "2", "to": "3", "label": "6 months"},
                {"id": "c3", "from": "3", "to": "4", "label": "2 months"}
            ]
        }
    else:
        # Default flowchart
        return {
            "id": diagram_id,
            "type": diagram_type,
            "title": title,
            "nodes": [
                {"id": "1", "x": 100, "y": 50, "width": 180, "height": 80, "text": "Initialize Process", "type": "start"},
                {"id": "2", "x": 100, "y": 170, "width": 180, "height": 80, "text": "Analyze Document Content", "type": "process"},
                {"id": "3", "x": 100, "y": 290, "width": 200, "height": 80, "text": "Requirements Satisfied?", "type": "decision"},
                {"id": "4", "x": 350, "y": 290, "width": 160, "height": 80, "text": "Refine Approach", "type": "process"},
                {"id": "5", "x": 100, "y": 410, "width": 180, "height": 80, "text": "Implement Solution", "type": "process"},
                {"id": "6", "x": 100, "y": 530, "width": 180, "height": 80, "text": "Process Complete", "type": "end"}
            ],
            "connections": [
                {"id": "c1", "from": "1", "to": "2"},
                {"id": "c2", "from": "2", "to": "3"},
                {"id": "c3", "from": "3", "to": "4", "label": "No"},
                {"id": "c4", "from": "4", "to": "2"},
                {"id": "c5", "from": "3", "to": "5", "label": "Yes"},
                {"id": "c6", "from": "5", "to": "6"}
            ]
        }

@app.tool()
async def export_diagram(
    diagram_data: Dict[str, Any],
    format: str = "png",
    width: int = 800,
    height: int = 600
) -> Dict[str, Any]:
    """
    Export diagram as image.
    
    Args:
        diagram_data: Diagram data structure
        format: Export format (png, jpeg, svg)
        width: Image width
        height: Image height
    
    Returns:
        Base64 encoded image data
    """
    try:
        if format.lower() == 'svg':
            svg_content = _generate_svg_diagram(diagram_data, width, height)
            svg_b64 = base64.b64encode(svg_content.encode()).decode()
            return {
                "success": True,
                "format": "svg",
                "data": svg_b64,
                "filename": f"{diagram_data.get('title', 'diagram').replace(' ', '_')}.svg"
            }
        else:
            # Generate PNG/JPEG
            image = _generate_image_diagram(diagram_data, width, height)
            
            # Convert to bytes
            img_buffer = io.BytesIO()
            image.save(img_buffer, format=format.upper(), quality=95 if format.lower() == 'jpeg' else None)
            img_buffer.seek(0)
            
            # Encode to base64
            img_b64 = base64.b64encode(img_buffer.getvalue()).decode()
            
            return {
                "success": True,
                "format": format.lower(),
                "data": img_b64,
                "filename": f"{diagram_data.get('title', 'diagram').replace(' ', '_')}.{format.lower()}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Diagram export failed: {str(e)}"
        }

def _generate_svg_diagram(diagram_data: Dict, width: int, height: int) -> str:
    """Generate SVG diagram"""
    svg_template = """<?xml version="1.0" encoding="UTF-8"?>
<svg width="{width}" height="{height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#374151" />
    </marker>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="white"/>
  
  <!-- Grid -->
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="url(#grid)" />
  
  <!-- Title -->
  <text x="{title_x}" y="30" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#1f2937">
    {title}
  </text>
  
  <!-- Connections -->
  {connections}
  
  <!-- Nodes -->
  {nodes}
</svg>"""
    
    # Generate connections
    connections_svg = ""
    for conn in diagram_data.get('connections', []):
        from_node = next((n for n in diagram_data['nodes'] if n['id'] == conn['from']), None)
        to_node = next((n for n in diagram_data['nodes'] if n['id'] == conn['to']), None)
        
        if from_node and to_node:
            x1 = from_node['x'] + from_node['width'] // 2
            y1 = from_node['y'] + from_node['height']
            x2 = to_node['x'] + to_node['width'] // 2
            y2 = to_node['y']
            
            connections_svg += f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#374151" stroke-width="2" marker-end="url(#arrowhead)"/>\n'
            
            if conn.get('label'):
                label_x = (x1 + x2) // 2
                label_y = (y1 + y2) // 2
                connections_svg += f'<text x="{label_x}" y="{label_y}" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#374151">{conn["label"]}</text>\n'
    
    # Generate nodes
    nodes_svg = ""
    for node in diagram_data.get('nodes', []):
        # Node colors based on type
        colors = {
            'start': '#10B981',
            'end': '#EF4444',
            'decision': '#F59E0B',
            'process': '#3B82F6',
            'executive': '#8B5CF6',
            'manager': '#06B6D4',
            'employee': '#84CC16',
            'milestone': '#F59E0B',
            'deliverable': '#10B981'
        }
        
        color = colors.get(node.get('type', 'process'), '#3B82F6')
        
        nodes_svg += f'''
        <rect x="{node['x']}" y="{node['y']}" width="{node['width']}" height="{node['height']}" 
              rx="8" fill="{color}" stroke="{color}" stroke-width="2"/>
        <text x="{node['x'] + node['width']//2}" y="{node['y'] + node['height']//2 + 5}" 
              text-anchor="middle" font-family="Arial, sans-serif" font-size="14" font-weight="600" fill="white">
          {node['text']}
        </text>
        '''
    
    return svg_template.format(
        width=width,
        height=height,
        title_x=width//2,
        title=diagram_data.get('title', 'Diagram'),
        connections=connections_svg,
        nodes=nodes_svg
    )

def _generate_image_diagram(diagram_data: Dict, width: int, height: int) -> Image.Image:
    """Generate PIL Image diagram"""
    # Create image
    img = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(img)
    
    # Try to load a font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 14)
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
    except:
        font = ImageFont.load_default()
        title_font = ImageFont.load_default()
    
    # Draw grid
    for x in range(0, width, 20):
        draw.line([(x, 0), (x, height)], fill='#f3f4f6', width=1)
    for y in range(0, height, 20):
        draw.line([(0, y), (width, y)], fill='#f3f4f6', width=1)
    
    # Draw title
    title = diagram_data.get('title', 'Diagram')
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_width = title_bbox[2] - title_bbox[0]
    draw.text((width//2 - title_width//2, 10), title, fill='#1f2937', font=title_font)
    
    # Draw connections
    for conn in diagram_data.get('connections', []):
        from_node = next((n for n in diagram_data['nodes'] if n['id'] == conn['from']), None)
        to_node = next((n for n in diagram_data['nodes'] if n['id'] == conn['to']), None)
        
        if from_node and to_node:
            x1 = from_node['x'] + from_node['width'] // 2
            y1 = from_node['y'] + from_node['height']
            x2 = to_node['x'] + to_node['width'] // 2
            y2 = to_node['y']
            
            draw.line([(x1, y1), (x2, y2)], fill='#374151', width=3)
            
            # Draw arrow
            import math
            angle = math.atan2(y2 - y1, x2 - x1)
            arrow_length = 10
            arrow_x1 = x2 - arrow_length * math.cos(angle - math.pi/6)
            arrow_y1 = y2 - arrow_length * math.sin(angle - math.pi/6)
            arrow_x2 = x2 - arrow_length * math.cos(angle + math.pi/6)
            arrow_y2 = y2 - arrow_length * math.sin(angle + math.pi/6)
            
            draw.polygon([(x2, y2), (arrow_x1, arrow_y1), (arrow_x2, arrow_y2)], fill='#374151')
            
            # Draw label
            if conn.get('label'):
                label_x = (x1 + x2) // 2
                label_y = (y1 + y2) // 2
                label_bbox = draw.textbbox((0, 0), conn['label'], font=font)
                label_width = label_bbox[2] - label_bbox[0]
                label_height = label_bbox[3] - label_bbox[1]
                
                # Background for label
                draw.rectangle([
                    label_x - label_width//2 - 5,
                    label_y - label_height//2 - 2,
                    label_x + label_width//2 + 5,
                    label_y + label_height//2 + 2
                ], fill='white', outline='#e5e7eb')
                
                draw.text((label_x - label_width//2, label_y - label_height//2), 
                         conn['label'], fill='#374151', font=font)
    
    # Draw nodes
    colors = {
        'start': '#10B981',
        'end': '#EF4444',
        'decision': '#F59E0B',
        'process': '#3B82F6',
        'executive': '#8B5CF6',
        'manager': '#06B6D4',
        'employee': '#84CC16',
        'milestone': '#F59E0B',
        'deliverable': '#10B981'
    }
    
    for node in diagram_data.get('nodes', []):
        color = colors.get(node.get('type', 'process'), '#3B82F6')
        
        # Draw node rectangle
        draw.rounded_rectangle([
            node['x'], node['y'],
            node['x'] + node['width'], node['y'] + node['height']
        ], radius=8, fill=color, outline=color, width=2)
        
        # Draw text
        text = node['text']
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        
        text_x = node['x'] + node['width']//2 - text_width//2
        text_y = node['y'] + node['height']//2 - text_height//2
        
        draw.text((text_x, text_y), text, fill='white', font=font)
    
    return img

# =============================================================================
# EXPORT TOOLS
# =============================================================================

@app.tool()
async def export_chat(
    conversation_id: str,
    format: str = "html",
    include_metadata: bool = True
) -> Dict[str, Any]:
    """
    Export chat conversation in various formats.
    
    Args:
        conversation_id: ID of conversation to export
        format: Export format (html, markdown, json)
        include_metadata: Whether to include analysis metadata
    
    Returns:
        Exported content as base64 encoded data
    """
    try:
        if conversation_id not in conversation_store:
            return {
                "success": False,
                "error": "Conversation not found"
            }
        
        messages = conversation_store[conversation_id]
        
        if format.lower() == 'html':
            content = _generate_html_export(messages, include_metadata)
            filename = f"chat-export-{conversation_id[:8]}.html"
        elif format.lower() == 'markdown':
            content = _generate_markdown_export(messages, include_metadata)
            filename = f"chat-export-{conversation_id[:8]}.md"
        elif format.lower() == 'json':
            content = json.dumps(messages, indent=2, default=str)
            filename = f"chat-export-{conversation_id[:8]}.json"
        else:
            return {
                "success": False,
                "error": f"Unsupported format: {format}"
            }
        
        # Encode to base64
        content_b64 = base64.b64encode(content.encode('utf-8')).decode()
        
        return {
            "success": True,
            "format": format.lower(),
            "data": content_b64,
            "filename": filename,
            "message_count": len(messages)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Export failed: {str(e)}"
        }

def _generate_html_export(messages: List[Dict], include_metadata: bool) -> str:
    """Generate HTML export of conversation"""
    html_template = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat Export - Document Analysis</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f9fafb;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .message.user {
            border-left: 4px solid #3b82f6;
        }
        .message.assistant {
            border-left: 4px solid #14b8a6;
        }
        .message-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }
        .timestamp {
            color: #666;
        }
        .message-content {
            white-space: pre-wrap;
        }
        .metadata {
            margin-top: 15px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 6px;
            font-size: 12px;
            color: #6b7280;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Document Analysis Chat Export</h1>
        <p>Generated on {timestamp}</p>
        <p>{message_count} messages</p>
    </div>
    <div class="messages">
        {messages_html}
    </div>
</body>
</html>"""
    
    messages_html = ""
    for msg in messages:
        metadata_html = ""
        if include_metadata and msg.get('metadata'):
            metadata_html = f"""
            <div class="metadata">
                <strong>Analysis Metadata:</strong><br>
                Type: {msg['metadata'].get('analysis_type', 'N/A')}<br>
                Confidence: {msg['metadata'].get('confidence', 'N/A')}<br>
                Documents: {', '.join([doc['name'] for doc in msg['metadata'].get('document_ids', [])])}
            </div>
            """
        
        messages_html += f"""
        <div class="message {msg['message_type']}">
            <div class="message-header">
                <strong>{'You' if msg['message_type'] == 'user' else 'Assistant'}</strong>
                <span class="timestamp">{msg['timestamp']}</span>
            </div>
            <div class="message-content">{msg['content']}</div>
            {metadata_html}
        </div>
        """
    
    return html_template.format(
        timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        message_count=len(messages),
        messages_html=messages_html
    )

def _generate_markdown_export(messages: List[Dict], include_metadata: bool) -> str:
    """Generate Markdown export of conversation"""
    md_content = f"""# Document Analysis Chat Export

**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  
**Messages:** {len(messages)}

---

"""
    
    for i, msg in enumerate(messages, 1):
        role = "🧑 **You**" if msg['message_type'] == 'user' else "🤖 **Assistant**"
        timestamp = msg['timestamp']
        
        md_content += f"""## Message {i}

**{role}** - {timestamp}

{msg['content']}

"""
        
        if include_metadata and msg.get('metadata'):
            md_content += f"""**Analysis Metadata:**
- Type: {msg['metadata'].get('analysis_type', 'N/A')}
- Confidence: {msg['metadata'].get('confidence', 'N/A')}
- Documents: {', '.join([doc['name'] for doc in msg['metadata'].get('document_ids', [])])}

"""
        
        md_content += "---\n\n"
    
    return md_content

# =============================================================================
# UTILITY TOOLS
# =============================================================================

@app.tool()
async def get_document_list() -> Dict[str, Any]:
    """
    Get list of all processed documents.
    
    Returns:
        List of document metadata
    """
    try:
        documents = []
        for doc_id, doc_data in document_store.items():
            documents.append({
                "id": doc_id,
                "file_name": doc_data["file_name"],
                "file_type": doc_data["file_type"],
                "word_count": doc_data["metadata"]["word_count"],
                "character_count": doc_data["metadata"]["character_count"],
                "chunk_count": len(doc_data["chunks"]),
                "created_at": doc_data["created_at"]
            })
        
        return {
            "success": True,
            "documents": documents,
            "total_count": len(documents)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get document list: {str(e)}"
        }

@app.tool()
async def get_conversation_list() -> Dict[str, Any]:
    """
    Get list of all conversations.
    
    Returns:
        List of conversation metadata
    """
    try:
        conversations = []
        for conv_id, messages in conversation_store.items():
            if messages:
                conversations.append({
                    "id": conv_id,
                    "message_count": len(messages),
                    "created_at": messages[0]["timestamp"] if messages else None,
                    "last_updated": messages[-1]["timestamp"] if messages else None,
                    "preview": messages[-1]["content"][:100] + "..." if messages and len(messages[-1]["content"]) > 100 else messages[-1]["content"] if messages else ""
                })
        
        return {
            "success": True,
            "conversations": conversations,
            "total_count": len(conversations)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get conversation list: {str(e)}"
        }

@app.tool()
async def delete_document(document_id: str) -> Dict[str, Any]:
    """
    Delete a processed document.
    
    Args:
        document_id: ID of document to delete
    
    Returns:
        Success status
    """
    try:
        if document_id in document_store:
            del document_store[document_id]
            return {
                "success": True,
                "message": f"Document {document_id} deleted successfully"
            }
        else:
            return {
                "success": False,
                "error": "Document not found"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to delete document: {str(e)}"
        }

@app.tool()
async def get_system_stats() -> Dict[str, Any]:
    """
    Get system statistics.
    
    Returns:
        System statistics and health info
    """
    try:
        total_documents = len(document_store)
        total_conversations = len(conversation_store)
        total_messages = sum(len(messages) for messages in conversation_store.values())
        
        # Calculate storage usage
        total_content_size = sum(
            len(doc["content"]) for doc in document_store.values()
        )
        
        return {
            "success": True,
            "stats": {
                "documents": {
                    "total": total_documents,
                    "total_content_size": total_content_size,
                    "average_size": total_content_size // total_documents if total_documents > 0 else 0
                },
                "conversations": {
                    "total": total_conversations,
                    "total_messages": total_messages,
                    "average_messages": total_messages // total_conversations if total_conversations > 0 else 0
                },
                "system": {
                    "openai_client_initialized": openai_client is not None,
                    "uptime": "N/A",  # Could implement actual uptime tracking
                    "memory_usage": "N/A"  # Could implement memory monitoring
                }
            }
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to get system stats: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    from typing import Any, Dict

    print("🚀 Starting FastMCP Document Analysis Server...")
    print("📋 Available tools:")
    print("   • process_document - Process uploaded documents")
    print("   • get_document_full_data - Get full document data with tables")
    print("   • get_document_tables - Get extracted tables from document")
    print("   • search_documents - Search through documents")
    print("   • setup_openai_client - Initialize OpenAI client")
    print("   • analyze_document - Analyze documents with AI")
    print("   • analyze_document_streaming - Stream AI analysis")
    print("   • generate_diagram - Generate diagrams")
    print("   • export_diagram - Export diagrams as images")
    print("   • export_chat - Export conversations")
    print("   • get_document_list - List all documents")
    print("   • get_conversation_list - List all conversations")
    print("   • delete_document - Delete documents")
    print("   • get_system_stats - System statistics")
    print()

    # Create a FastAPI wrapper for REST API compatibility
    rest_app = FastAPI(title="Document Analysis Server")

    # Enable CORS for frontend access
    rest_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class ToolRequest(BaseModel):
        args: Dict[str, Any] = {}

    @rest_app.get("/health")
    async def health_check():
        return {"status": "healthy", "service": "Document Analysis Server"}

    @rest_app.post("/tools/{tool_name}")
    async def call_tool(tool_name: str, request: Dict[str, Any]):
        """REST API endpoint for calling MCP tools"""
        try:
            # Get the tool function from app
            # FastMCP wraps functions in FunctionTool objects, so we need to access the underlying function
            tools = {
                'process_document': process_document,
                'get_document_full_data': get_document_full_data,
                'get_document_tables': get_document_tables,
                'search_documents': search_documents,
                'setup_openai_client': setup_openai_client,
                'analyze_document': analyze_document,
                'generate_diagram': generate_diagram,
                'export_diagram': export_diagram,
                'export_chat': export_chat,
                'get_document_list': get_document_list,
                'get_conversation_list': get_conversation_list,
                'delete_document': delete_document,
                'get_system_stats': get_system_stats,
            }

            if tool_name not in tools:
                raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found")

            # Get the tool (which may be a FunctionTool wrapper)
            tool_obj = tools[tool_name]

            # If it's a FunctionTool object, get the underlying function
            if hasattr(tool_obj, 'fn'):
                tool_func = tool_obj.fn
            elif hasattr(tool_obj, '_fn'):
                tool_func = tool_obj._fn
            elif hasattr(tool_obj, 'func'):
                tool_func = tool_obj.func
            elif callable(tool_obj):
                # If it's directly callable, use it
                tool_func = tool_obj
            else:
                raise HTTPException(status_code=500, detail=f"Cannot access function for tool '{tool_name}'")

            # Call the actual function with the provided arguments
            result = await tool_func(**request)

            return result

        except Exception as e:
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=str(e))

    # Run the REST API server
    print("🌐 Starting REST API server on http://0.0.0.0:8000")
    uvicorn.run(rest_app, host="0.0.0.0", port=8000)