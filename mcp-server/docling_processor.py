#!/usr/bin/env python3
"""
Enterprise Document Processing with Docling
Supports: PDF, DOCX, PPTX, XLSX, Images with OCR
Fallback: PyMuPDF for robust processing
"""

import os
import asyncio
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import logging
from datetime import datetime

# Docling imports
try:
    from docling.document_converter import DocumentConverter
    from docling.datamodel.base_models import InputFormat
    from docling.datamodel.pipeline_options import PdfPipelineOptions
    from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend
    DOCLING_AVAILABLE = True
except ImportError:
    DOCLING_AVAILABLE = False
    logging.warning("Docling not available, will use fallback processor only")

# Fallback processor
import fitz  # PyMuPDF

# Optional file type detection (may not be available on all systems)
try:
    import magic
    MAGIC_AVAILABLE = True
except ImportError:
    MAGIC_AVAILABLE = False
    logging.warning("python-magic not available, file type detection will be limited")

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Enterprise-grade document processor with Docling and PyMuPDF fallback"""

    def __init__(self):
        self.converter = None
        if DOCLING_AVAILABLE:
            try:
                # Initialize Docling with optimized settings
                pipeline_options = PdfPipelineOptions()
                pipeline_options.do_ocr = True  # Enable OCR for scanned docs
                pipeline_options.do_table_structure = True  # Extract table structure

                self.converter = DocumentConverter(
                    format_options={
                        InputFormat.PDF: pipeline_options,
                    }
                )
                logger.info("✅ Docling initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize Docling: {e}")
                self.converter = None

    async def process_document(
        self,
        file_path: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        Process document using Docling (primary) or PyMuPDF (fallback)

        Args:
            file_path: Path to the document file
            file_type: MIME type of the file

        Returns:
            Structured document data with tables, chunks, and metadata
        """
        logger.info(f"Processing document: {file_path} (type: {file_type})")

        try:
            # Try Docling first
            if self.converter and DOCLING_AVAILABLE:
                result = await self._process_with_docling(file_path, file_type)
                if result:
                    logger.info("✅ Processed with Docling")
                    return result

            # Fallback to PyMuPDF
            logger.info("Using PyMuPDF fallback processor")
            result = await self._process_with_pymupdf(file_path, file_type)
            return result

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            return self._create_error_document(file_path, str(e))

    async def _process_with_docling(
        self,
        file_path: str,
        file_type: str
    ) -> Optional[Dict[str, Any]]:
        """Process document with Docling"""
        try:
            # Convert document
            result = self.converter.convert(file_path)

            # Extract markdown content
            markdown_content = result.document.export_to_markdown()

            # Extract tables
            tables = self._extract_tables_from_docling(result)

            # Extract document structure
            layout = self._extract_layout_info(result)

            # Create intelligent chunks
            chunks = self._create_intelligent_chunks(
                markdown_content,
                tables,
                result
            )

            # Extract metadata
            metadata = self._extract_metadata_from_docling(result, file_path)

            return {
                "success": True,
                "processor": "docling",
                "fileName": os.path.basename(file_path),
                "content": markdown_content,
                "type": file_type,
                "metadata": metadata,
                "tables": tables,
                "layout": layout,
                "chunks": chunks,
                "processedAt": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Docling processing error: {e}")
            return None

    def _extract_tables_from_docling(self, result) -> List[Dict[str, Any]]:
        """Extract structured tables from Docling result"""
        tables = []

        try:
            # Iterate through document elements
            for idx, table in enumerate(result.document.tables):
                # Extract table data
                table_data = {
                    "id": f"table-{idx}",
                    "title": getattr(table, 'title', f"Table {idx + 1}"),
                    "headers": [],
                    "rows": [],
                    "markdown": "",
                    "pageNumber": getattr(table, 'page_no', None)
                }

                # Get table grid
                if hasattr(table, 'data'):
                    grid = table.data

                    # Extract headers (first row)
                    if len(grid) > 0:
                        table_data["headers"] = [str(cell) for cell in grid[0]]

                    # Extract data rows
                    if len(grid) > 1:
                        table_data["rows"] = [
                            [str(cell) for cell in row]
                            for row in grid[1:]
                        ]

                    # Generate markdown table
                    table_data["markdown"] = self._table_to_markdown(
                        table_data["headers"],
                        table_data["rows"]
                    )

                tables.append(table_data)

        except Exception as e:
            logger.warning(f"Table extraction warning: {e}")

        return tables

    def _table_to_markdown(
        self,
        headers: List[str],
        rows: List[List[str]]
    ) -> str:
        """Convert table to markdown format"""
        if not headers:
            return ""

        # Create markdown table
        md_lines = []

        # Headers
        md_lines.append("| " + " | ".join(headers) + " |")

        # Separator
        md_lines.append("| " + " | ".join(["---"] * len(headers)) + " |")

        # Rows
        for row in rows:
            # Pad row if needed
            padded_row = row + [""] * (len(headers) - len(row))
            md_lines.append("| " + " | ".join(padded_row[:len(headers)]) + " |")

        return "\n".join(md_lines)

    def _extract_layout_info(self, result) -> Dict[str, Any]:
        """Extract document layout information"""
        try:
            return {
                "hasMultipleColumns": False,  # Can be detected from Docling
                "pageCount": getattr(result.document, 'page_count', 0),
                "sections": []  # Can extract section info from Docling
            }
        except:
            return {
                "hasMultipleColumns": False,
                "pageCount": 0,
                "sections": []
            }

    def _create_intelligent_chunks(
        self,
        content: str,
        tables: List[Dict],
        docling_result
    ) -> List[Dict[str, Any]]:
        """Create intelligent chunks optimized for LLM context"""
        chunks = []
        chunk_id = 0

        # Split content by double newlines (paragraphs)
        paragraphs = content.split('\n\n')

        current_chunk = ""
        current_start = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            # Check if this paragraph contains a table (starts with |)
            is_table = para.startswith('|')

            # If chunk is getting large or we hit a table, create a chunk
            if len(current_chunk) + len(para) > 1500 or (is_table and current_chunk):
                if current_chunk:
                    chunks.append({
                        "id": f"chunk-{chunk_id}",
                        "content": current_chunk.strip(),
                        "startIndex": current_start,
                        "endIndex": current_start + len(current_chunk),
                        "type": "paragraph",
                        "metadata": {}
                    })
                    chunk_id += 1
                    current_start += len(current_chunk)
                    current_chunk = ""

            # Add paragraph to current chunk
            current_chunk += para + "\n\n"

            # If this is a table, mark it specially
            if is_table:
                # Find matching table
                table_id = None
                for table in tables:
                    if table["markdown"] in para:
                        table_id = table["id"]
                        break

                chunks.append({
                    "id": f"chunk-{chunk_id}",
                    "content": para,
                    "startIndex": current_start,
                    "endIndex": current_start + len(para),
                    "type": "table",
                    "metadata": {
                        "hasTable": True,
                        "tableId": table_id
                    }
                })
                chunk_id += 1
                current_start += len(para)
                current_chunk = ""

        # Add remaining chunk
        if current_chunk.strip():
            chunks.append({
                "id": f"chunk-{chunk_id}",
                "content": current_chunk.strip(),
                "startIndex": current_start,
                "endIndex": current_start + len(current_chunk),
                "type": "paragraph",
                "metadata": {}
            })

        return chunks

    def _extract_metadata_from_docling(
        self,
        result,
        file_path: str
    ) -> Dict[str, Any]:
        """Extract document metadata from Docling result"""
        try:
            doc = result.document

            # Count words in content
            content = doc.export_to_markdown()
            word_count = len(content.split())

            return {
                "pageCount": getattr(doc, 'page_count', 0),
                "wordCount": word_count,
                "characterCount": len(content),
                "language": "en",  # Could be detected
                "title": getattr(doc, 'title', os.path.basename(file_path)),
                "createdDate": None,
                "modifiedDate": None,
                "author": None
            }
        except Exception as e:
            logger.warning(f"Metadata extraction warning: {e}")
            return {
                "wordCount": 0,
                "characterCount": 0
            }

    async def _process_with_pymupdf(
        self,
        file_path: str,
        file_type: str
    ) -> Dict[str, Any]:
        """Fallback processor using PyMuPDF"""
        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(file_path)

            full_text = ""
            chunks = []
            tables = []
            chunk_id = 0

            # Process each page
            for page_num in range(len(doc)):
                page = doc[page_num]

                # Extract text
                text = page.get_text()

                if text.strip():
                    full_text += f"\n--- Page {page_num + 1} ---\n{text}\n"

                    # Create chunk for this page
                    chunks.append({
                        "id": f"chunk-{chunk_id}",
                        "content": text.strip(),
                        "startIndex": len(full_text) - len(text),
                        "endIndex": len(full_text),
                        "type": "paragraph",
                        "metadata": {"pageNumber": page_num + 1}
                    })
                    chunk_id += 1

                # Try to extract tables (basic detection)
                tables_on_page = self._extract_tables_pymupdf(page, page_num + 1)
                tables.extend(tables_on_page)

            doc.close()

            # Create metadata
            metadata = {
                "pageCount": len(doc),
                "wordCount": len(full_text.split()),
                "characterCount": len(full_text),
                "language": "en"
            }

            return {
                "success": True,
                "processor": "pymupdf_fallback",
                "fileName": os.path.basename(file_path),
                "content": full_text.strip(),
                "type": file_type,
                "metadata": metadata,
                "tables": tables,
                "layout": {
                    "hasMultipleColumns": False,
                    "pageCount": len(doc),
                    "sections": []
                },
                "chunks": chunks,
                "processedAt": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"PyMuPDF processing error: {e}")
            return self._create_error_document(file_path, str(e))

    def _extract_tables_pymupdf(
        self,
        page,
        page_num: int
    ) -> List[Dict[str, Any]]:
        """Basic table extraction from PyMuPDF page"""
        tables = []

        try:
            # PyMuPDF's table detection (if available)
            # This is a simplified version - Docling is much better
            tabs = page.find_tables()

            for idx, tab in enumerate(tabs):
                table_data = tab.extract()

                if table_data and len(table_data) > 0:
                    headers = table_data[0] if len(table_data) > 0 else []
                    rows = table_data[1:] if len(table_data) > 1 else []

                    tables.append({
                        "id": f"table-p{page_num}-{idx}",
                        "title": f"Table on Page {page_num}",
                        "headers": headers,
                        "rows": rows,
                        "markdown": self._table_to_markdown(headers, rows),
                        "pageNumber": page_num
                    })
        except Exception as e:
            logger.debug(f"Table detection skipped for page {page_num}: {e}")

        return tables

    def _create_error_document(
        self,
        file_path: str,
        error: str
    ) -> Dict[str, Any]:
        """Create error document response"""
        error_msg = f"Error processing document: {error}"

        return {
            "success": False,
            "processor": "error",
            "fileName": os.path.basename(file_path),
            "content": error_msg,
            "type": "error",
            "metadata": {
                "wordCount": 0,
                "characterCount": len(error_msg)
            },
            "tables": [],
            "layout": {
                "hasMultipleColumns": False,
                "pageCount": 0,
                "sections": []
            },
            "chunks": [{
                "id": "error-chunk",
                "content": error_msg,
                "startIndex": 0,
                "endIndex": len(error_msg),
                "type": "paragraph",
                "metadata": {}
            }],
            "processedAt": datetime.now().isoformat(),
            "error": error
        }


# Global processor instance
_processor = None

def get_processor() -> DocumentProcessor:
    """Get or create global processor instance"""
    global _processor
    if _processor is None:
        _processor = DocumentProcessor()
    return _processor
