#!/usr/bin/env python3
"""
Local Document Processor
Enhanced PyMuPDF + pdfplumber for local document processing
No cloud dependencies, runs entirely offline
"""

import os
import logging
import warnings
from typing import Dict, List, Optional, Any
from datetime import datetime

# PyMuPDF for fast text extraction
import fitz  # PyMuPDF

# Suppress PyMuPDF table detection warning (we use pdfplumber for tables)
warnings.filterwarnings('ignore', message='.*pymupdf_layout.*')

# pdfplumber for superior table extraction
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    logging.warning("pdfplumber not available - table extraction will be limited")


logger = logging.getLogger(__name__)


class LocalProcessor:
    """Local document processor using PyMuPDF + pdfplumber"""

    def __init__(self, enable_pdfplumber: bool = True):
        """
        Initialize local processor

        Args:
            enable_pdfplumber: Use pdfplumber for enhanced table extraction
        """
        self.enable_pdfplumber = enable_pdfplumber and PDFPLUMBER_AVAILABLE

        if self.enable_pdfplumber:
            logger.info("✅ Local processor initialized (PyMuPDF + pdfplumber)")
        else:
            logger.info("✅ Local processor initialized (PyMuPDF only)")

    async def process_document(
        self,
        file_path: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        Process document using local tools

        Args:
            file_path: Path to the document file
            file_type: MIME type of the file

        Returns:
            Structured document data with tables, chunks, and metadata
        """
        logger.info(f"Processing document with local processor: {file_path}")

        try:
            # Extract text with PyMuPDF (fast and reliable)
            pymupdf_data = self._process_with_pymupdf(file_path)

            # Extract tables with pdfplumber (if available and enabled)
            if self.enable_pdfplumber:
                pdfplumber_tables = self._extract_tables_with_pdfplumber(file_path)
                # Merge pdfplumber tables (more accurate) with pymupdf data
                pymupdf_data['tables'] = pdfplumber_tables or pymupdf_data['tables']

            # Update metadata
            pymupdf_data['processor'] = 'local_pymupdf_pdfplumber' if self.enable_pdfplumber else 'local_pymupdf'
            pymupdf_data['type'] = file_type

            return pymupdf_data

        except Exception as e:
            logger.error(f"Local processing error: {e}")
            raise

    def _process_with_pymupdf(self, file_path: str) -> Dict[str, Any]:
        """Process document with PyMuPDF for text extraction"""
        try:
            # Open PDF with PyMuPDF
            doc = fitz.open(file_path)

            # Get page count before processing
            page_count = len(doc)

            full_text = ""
            chunks = []
            tables = []  # Basic tables (will be replaced by pdfplumber if available)
            chunk_id = 0

            # Process each page
            for page_num in range(page_count):
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
                        "type": "page",
                        "metadata": {"pageNumber": page_num + 1}
                    })
                    chunk_id += 1

                # Try to extract tables (basic detection with PyMuPDF)
                tables_on_page = self._extract_tables_pymupdf(page, page_num + 1)
                tables.extend(tables_on_page)

            # Close document after processing
            doc.close()

            # Create metadata
            metadata = {
                "pageCount": page_count,
                "wordCount": len(full_text.split()),
                "characterCount": len(full_text),
                "language": "en"
            }

            return {
                "success": True,
                "processor": "local_pymupdf",
                "fileName": os.path.basename(file_path),
                "content": full_text.strip(),
                "type": "application/pdf",
                "metadata": metadata,
                "tables": tables,
                "layout": {
                    "hasMultipleColumns": False,
                    "pageCount": page_count,
                    "sections": []
                },
                "chunks": chunks,
                "processedAt": datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"PyMuPDF processing error: {e}")
            raise

    def _extract_tables_pymupdf(self, page, page_num: int) -> List[Dict[str, Any]]:
        """Basic table extraction from PyMuPDF page"""
        tables = []

        try:
            # PyMuPDF's table detection (if available)
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

    def _extract_tables_with_pdfplumber(self, file_path: str) -> Optional[List[Dict[str, Any]]]:
        """Extract tables with pdfplumber (more accurate than PyMuPDF)"""
        if not PDFPLUMBER_AVAILABLE:
            return None

        tables = []

        try:
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, start=1):
                    # Extract tables from this page
                    page_tables = page.extract_tables()

                    for idx, table_data in enumerate(page_tables):
                        if table_data and len(table_data) > 0:
                            # First row as headers
                            headers = table_data[0] if len(table_data) > 0 else []
                            # Clean headers (remove None values)
                            headers = [str(h) if h is not None else '' for h in headers]

                            # Remaining rows as data
                            rows = table_data[1:] if len(table_data) > 1 else []
                            # Clean rows
                            rows = [
                                [str(cell) if cell is not None else '' for cell in row]
                                for row in rows
                            ]

                            tables.append({
                                "id": f"table-p{page_num}-{idx}",
                                "title": f"Table {len(tables) + 1}",
                                "headers": headers,
                                "rows": rows,
                                "markdown": self._table_to_markdown(headers, rows),
                                "pageNumber": page_num,
                                "extractor": "pdfplumber"
                            })

            logger.info(f"✅ Extracted {len(tables)} tables with pdfplumber")
            return tables

        except Exception as e:
            logger.warning(f"pdfplumber table extraction failed: {e}")
            return None

    def _table_to_markdown(self, headers: List[str], rows: List[List[str]]) -> str:
        """Convert table to markdown format"""
        if not headers:
            return ""

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
